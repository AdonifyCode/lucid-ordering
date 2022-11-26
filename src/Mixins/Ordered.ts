import { OrderedModel, OrderedModelMixinContract } from '@ioc:Adonify/LucidOrdering'
const { column, beforeCreate, afterDelete } = global[Symbol.for('ioc.use')]('Adonis/Lucid/Orm')
import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
import { LucidModel } from '@ioc:Adonis/Lucid/Orm'
const Database: DatabaseContract = global[Symbol.for('ioc.use')]('Adonis/Lucid/Database')
import OrderedModelService from '../Helpers/OrderedModelService'
const { string } = global[Symbol.for('ioc.use')]('Adonis/Core/Helpers')

export const Ordered: OrderedModelMixinContract = (superclass) => {
  class OrderedModelMixin extends superclass implements OrderedModel {
    @column()
    public order: number

    public async setOrder(order: number): Promise<void> {
      const { table } = this.constructor as LucidModel
      const high = await OrderedModelService.getHighestOrder({
        orderedModel: this,
      })

      const newOrder = high ? Math.min(high, Math.max(0, order)) : order
      const trx = await Database.transaction()

      const orderKeys = OrderedModelService.getOrderKeys(this)
      if (newOrder > this.order) {
        await trx
          .from(table)
          .decrement('order', 1)
          .where('order', '<=', newOrder)
          .andWhere('order', '>', 0)
          .if(orderKeys.length, (orderKeysQuery) => {
            for (const key of orderKeys) {
              orderKeysQuery.where(string.snakeCase(key), this[key])
            }
          })
      } else if (newOrder < this.order) {
        await trx
          .from(table)
          .increment('order', 1)
          .where('order', '>=', newOrder)
          .andWhere('order', '<', high || 0)
          .if(orderKeys.length, (orderKeysQuery) => {
            for (const key of orderKeys) {
              orderKeysQuery.where(string.snakeCase(key), this[key])
            }
          })
      }

      this.order = newOrder
      await this.useTransaction(trx).save()
      await trx.commit()
    }

    public isFirst() {
      return this.order === 0
    }

    public async isLast() {
      const high = await OrderedModelService.getHighestOrder({ orderedModel: this })
      return high === this.order
    }

    public async moveToStart() {
      await this.setOrder(0)
    }

    public async moveToEnd() {
      const high = await OrderedModelService.getHighestOrder({ orderedModel: this })
      await this.setOrder(high || 0)
    }

    public async moveUp() {
      const high = await OrderedModelService.getHighestOrder({ orderedModel: this })
      const newOrder = Math.min(high || 0, this.order + 1)
      await this.setOrder(newOrder)
    }

    public async moveDown() {
      await this.setOrder(Math.max(this.order - 1, 0))
    }

    public async swapOrder(modelToSwap: OrderedModel) {
      const trx = await Database.transaction()
      const thisOrder = this.order
      this.order = modelToSwap.order
      modelToSwap.order = thisOrder

      await Promise.all([this.useTransaction(trx).save(), modelToSwap.useTransaction(trx).save()])
      await trx.commit()
    }

    public async moveBefore(model: OrderedModel) {
      await this.setOrder(Math.max(0, model.order))
    }

    public async moveAfter(model: OrderedModel) {
      const high = await OrderedModelService.getHighestOrder({ orderedModel: this })
      await this.setOrder(Math.min(high || Infinity, model.order === 0 ? 1 : model.order))
    }

    public async syncSequence() {
      await OrderedModelService.syncOrder({ model: this })
    }

    @beforeCreate()
    private static async populateOrder(orderedModel: OrderedModel) {
      if (orderedModel?.order >= 0) {
        return
      }

      const high = await OrderedModelService.getHighestOrder({ orderedModel })

      orderedModel.merge({ order: high !== null ? high + 1 : 0 })
    }

    @afterDelete()
    private static async syncSequenceAfterDelete(orderedModel: OrderedModel) {
      await orderedModel.syncSequence()
    }
  }

  return OrderedModelMixin
}

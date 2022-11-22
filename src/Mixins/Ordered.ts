import { OrderedModel, OrderedModelMixinContract } from '@ioc:Adonify/LucidOrdering'
const { column, beforeCreate, afterDelete } = global[Symbol.for('ioc.use')]('Adonis/Lucid/Orm')
import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
const Database: DatabaseContract = global[Symbol.for('ioc.use')]('Adonis/Lucid/Database')
import OrderedModelService from '../Helpers/OrderedModelService'

export default function Ordered(
  tableName: string,
  options?: { orderColumnName: string }
): OrderedModelMixinContract {
  return (superclass) => {
    class OrderedModelMixin extends superclass implements OrderedModel {
      public static table = tableName
      public $orderColumnName = options?.orderColumnName

      @column()
      public order: number

      public async setOrder(order: number): Promise<void> {
        OrderedModelService.validateOrderedColumnNameExists(this)

        if (typeof order !== 'number' || order < 0) {
          throw new Error(`Order for setOrder(${order}) must be a number greater than 0`)
        }
        const high = await OrderedModelService.getHighestOrder({
          orderedModel: this,
          tableName: tableName,
        })

        const newOrder = high ? Math.min(high, order) : order
        const trx = await Database.transaction()

        if (newOrder > this.order) {
          await trx
            .from(tableName)
            .decrement('order', 1)
            .where('order', '<=', newOrder)
            .andWhere('order', '>', 0)
            .if(this.$orderColumnName, (query) =>
              query.where(this.$orderColumnName!, this[this.$orderColumnName!])
            )
        } else if (newOrder < this.order) {
          await trx
            .from(tableName)
            .increment('order', 1)
            .where('order', '>=', newOrder)
            .andWhere('order', '<', high || 0)
            .if(this.$orderColumnName, (query) =>
              query.where(this.$orderColumnName!, this[this.$orderColumnName!])
            )
        }

        this.order = newOrder
        await this.useTransaction(trx).save()
        await trx.commit()
      }

      public isFirst() {
        return this.order === 0
      }

      public async isLast() {
        const high = await OrderedModelService.getHighestOrder({
          orderedModel: this,
          tableName,
        })

        return high === this.order
      }

      public async moveToStart() {
        await this.setOrder(0)
      }

      public async moveToEnd() {
        const high = await OrderedModelService.getHighestOrder({
          orderedModel: this,
          tableName,
        })
        await this.setOrder(high || 0)
      }

      public async moveUp() {
        const high = await OrderedModelService.getHighestOrder({
          orderedModel: this,
          tableName,
        })

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
        const high = await OrderedModelService.getHighestOrder({
          orderedModel: this,
          tableName,
        })
        await this.setOrder(Math.min(high || Infinity, model.order === 0 ? 1 : model.order))
      }

      public async syncSequence() {
        await OrderedModelService.syncOrder({ table: tableName, model: this })
      }

      @beforeCreate()
      private static async populateOrder(orderedModel: OrderedModel) {
        if (orderedModel?.order >= 0) {
          return
        }

        const high = await OrderedModelService.getHighestOrder({
          orderedModel,
          tableName: this.table,
        })

        orderedModel.merge({ order: high !== null ? high + 1 : 0 })
      }

      @afterDelete()
      private static async syncSequenceAfterDelete(orderedModel: OrderedModel) {
        await orderedModel.syncSequence()
      }
    }

    return OrderedModelMixin
  }
}

import { LucidModelOrdered, OrderedModel } from '@ioc:Adonify/LucidOrdering'
const { string } = global[Symbol.for('ioc.use')]('Adonis/Core/Helpers')
import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
const Database: DatabaseContract = global[Symbol.for('ioc.use')]('Adonis/Lucid/Database')

export default class OrderedModelService {
  public static async getHighestOrder({ orderedModel }: { orderedModel: OrderedModel }) {
    const { table } = orderedModel.constructor as LucidModelOrdered
    const orderKeys = this.getOrderKeys(orderedModel)

    const result: OrderedModel | null = await Database.from(table)
      .orderBy('order', 'desc')
      .if(orderKeys.length, (orderKeysQuery) => {
        for (const orderKey of orderKeys) {
          orderKeysQuery.where(string.snakeCase(orderKey), orderedModel[orderKey])
        }
      })
      .first()

    return result ? result.order : null
  }

  public static async syncOrder({ model }: { model: OrderedModel }) {
    const { table } = model.constructor as LucidModelOrdered
    const orderKeys = this.getOrderKeys(model)

    const orderedModels: { id: number; order: number }[] = await Database.query()
      .from(table)
      .if(orderKeys.length, (orderKeysQuery) => {
        for (const orderKey of orderKeys) {
          orderKeysQuery.where(string.snakeCase(orderKey), model[orderKey])
        }
      })
      .orderBy('order', 'asc')

    let high = 0
    for (const m of orderedModels) {
      if (m.order !== high) {
        m.order = high
      }
      high++
    }

    const trx = await Database.transaction()
    await Promise.all(
      orderedModels.map((x) => trx.query().from(table).where('id', x.id).update({ order: x.order }))
    )
    await trx.commit()
  }

  public static getOrderKeys(orderedModel: OrderedModel): string[] {
    const model = orderedModel.constructor as LucidModelOrdered
    return model['orderKeys']?.map((key) => key.property) || []
  }
}

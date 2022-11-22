import { OrderedModel } from '@ioc:Adonify/LucidOrdering'
const { string } = global[Symbol.for('ioc.use')]('Adonis/Core/Helpers')
import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
const Database: DatabaseContract = global[Symbol.for('ioc.use')]('Adonis/Lucid/Database')

export default class OrderedModelService {
  public static async getHighestOrder({
    orderedModel,
    tableName,
  }: {
    orderedModel: OrderedModel
    tableName: string
  }) {
    this.validateOrderedColumnNameExists(orderedModel)

    const result: OrderedModel | null = await Database.from(tableName)
      .orderBy('order', 'desc')
      .if(orderedModel.$orderColumnName, (subQuery) => {
        subQuery.where(
          string.snakeCase(orderedModel.$orderColumnName!),
          orderedModel[orderedModel.$orderColumnName!]
        )
      })
      .first()

    return result ? result.order : null
  }

  public static async syncOrder({ model, table }: { model: OrderedModel; table: string }) {
    this.validateOrderedColumnNameExists(model)

    const orderedModels: { id: number; order: number }[] = await Database.query()
      .from(table)
      .if(model.$orderColumnName, (subQuery) => {
        subQuery.where(string.snakeCase(model.$orderColumnName!), model[model.$orderColumnName!])
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

  public static async validateOrderedColumnNameExists(model: OrderedModel) {
    if (model.$orderColumnName && model[model.$orderColumnName] === undefined) {
      throw new Error(
        `A column name of orderColumnName (${model.$orderColumnName}) was supplied but not defined on the model`
      )
    }
  }
}

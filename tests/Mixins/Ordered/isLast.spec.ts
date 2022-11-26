import { test } from '@japa/runner'
import { cleanDatabase, createOrderedTable } from '../../../bin/test/database'
import type { BaseModel as BaseModelContract, ColumnDecorator } from '@ioc:Adonis/Lucid/Orm'
import type { Ordered } from '@ioc:Adonify/LucidOrdering'
import { compose } from '@poppinss/utils/build/helpers'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
const Application: ApplicationContract = global[Symbol.for('ioc.use')]('Adonis/Core/Application')

let BaseModel: typeof BaseModelContract
let OrderedMixin: typeof Ordered
let column: ColumnDecorator

test.group('Mixins.Ordered.isLast', (group) => {
  group.setup(async () => {
    BaseModel = Application.container.resolveBinding('Adonis/Lucid/Orm').BaseModel
    OrderedMixin = Application.container.resolveBinding('Adonify/LucidOrdering').Ordered
    column = Application.container.resolveBinding('Adonis/Lucid/Orm').column
  })
  group.each.setup(async () => {
    await createOrderedTable()
  })
  group.each.teardown(async () => {
    await cleanDatabase()
  })

  test('should return true if last ordered item', async ({ assert }) => {
    class Ordered extends compose(BaseModel, OrderedMixin) {
      public static table = 'ordered'
      @column({ isPrimary: true })
      public id: number
    }
    const orderedModels = await Promise.all([
      Ordered.create({ order: 0 }),
      Ordered.create({ order: 1 }),
      Ordered.create({ order: 2 }),
    ])

    const isLast = await orderedModels[2].isLast()

    assert.isTrue(isLast)
  })
})

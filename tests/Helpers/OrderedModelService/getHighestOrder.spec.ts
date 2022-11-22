import { test } from '@japa/runner'
import { cleanDatabase, createOrderedTable } from '../../../bin/test/database'
import type { BaseModel as BaseModelContract, ColumnDecorator } from '@ioc:Adonis/Lucid/Orm'
import type { Ordered } from '@ioc:Adonify/LucidOrdering'
import { compose } from '@poppinss/utils/build/helpers'
import OrderedModelService from '../../../src/Helpers/OrderedModelService'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
const Application: ApplicationContract = global[Symbol.for('ioc.use')]('Adonis/Core/Application')

let BaseModel: typeof BaseModelContract
let OrderedMixin: typeof Ordered
let column: ColumnDecorator

test.group('Helpers.OrderedModelService.getHighestOrder', (group) => {
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

  test('returns the highest order', async ({ assert }) => {
    class Ordered extends compose(BaseModel, OrderedMixin('ordered')) {
      public static table = 'ordered'
    }

    const [, second] = await Promise.all([
      Ordered.create({ order: 0 }),
      Ordered.create({ order: 1 }),
    ])

    const high = await OrderedModelService.getHighestOrder({
      orderedModel: second,
      tableName: 'ordered',
    })

    assert.equal(high, 1)
  })

  test('returns the highest order with respect to the order column', async ({ assert }) => {
    await createOrderedTable({ orderColumn: 'test' })
    class Ordered extends compose(BaseModel, OrderedMixin('ordered', { orderColumnName: 'test' })) {
      public static table = 'ordered'

      @column()
      public test: number
    }

    const [, , , fourth] = await Promise.all([
      Ordered.create({ order: 0, test: 0 }),
      Ordered.create({ order: 1, test: 0 }),
      Ordered.create({ order: 2, test: 0 }),
      Ordered.create({ order: 0, test: 1 }),
      Ordered.create({ order: 1, test: 1 }),
    ])

    const high = await OrderedModelService.getHighestOrder({
      orderedModel: fourth,
      tableName: 'ordered',
    })

    assert.equal(high, 1)
  })
})

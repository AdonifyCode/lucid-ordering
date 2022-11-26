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

test.group('Mixins.Ordered.moveUp', (group) => {
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

  test('should move item up one order in the sequence', async ({ assert }) => {
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

    await orderedModels[1].moveUp()

    await Promise.all(orderedModels.map((orderedModel) => orderedModel.refresh()))
    assert.equal(orderedModels[0].order, 0)
    assert.equal(orderedModels[1].order, 2)
    assert.equal(orderedModels[2].order, 1)
  })

  test('should not move item if last item in the sequence', async ({ assert }) => {
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

    await orderedModels[2].moveUp()

    await Promise.all(orderedModels.map((orderedModel) => orderedModel.refresh()))
    assert.equal(orderedModels[0].order, 0)
    assert.equal(orderedModels[1].order, 1)
    assert.equal(orderedModels[2].order, 2)
  })

  test('should not move item if only one item in the sequence', async ({ assert }) => {
    class Ordered extends compose(BaseModel, OrderedMixin) {
      public static table = 'ordered'
      @column({ isPrimary: true })
      public id: number
    }
    const orderedModel = await Ordered.create({ order: 0 })

    await orderedModel.moveUp()

    await orderedModel.refresh()
    assert.equal(orderedModel.order, 0)
  })
})

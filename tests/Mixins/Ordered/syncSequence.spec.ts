import { test } from '@japa/runner'
import { cleanDatabase, createOrderedTable } from '../../../bin/test/database'
import type { BaseModel as BaseModelContract, ColumnDecorator } from '@ioc:Adonis/Lucid/Orm'
import type { Ordered } from '@ioc:Adonify/LucidOrdering'
import { compose } from '@poppinss/utils/build/helpers'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { orderKey } from '../../../src/Decorators/orderKey'
const Application: ApplicationContract = global[Symbol.for('ioc.use')]('Adonis/Core/Application')

let BaseModel: typeof BaseModelContract
let OrderedMixin: typeof Ordered
let column: ColumnDecorator

test.group('Mixins.Ordered.syncSequence', (group) => {
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

  test('deleting a middle item in the sequence syncs remaining after deletion', async ({
    assert,
  }) => {
    class Ordered extends compose(BaseModel, OrderedMixin) {
      public static table = 'ordered'
      @column({ isPrimary: true })
      public id: number
    }
    const orderedModels = await Promise.all([
      Ordered.create({ order: 0 }),
      Ordered.create({ order: 1 }),
      Ordered.create({ order: 2 }),
      Ordered.create({ order: 3 }),
    ])

    const indexToRemove = 1
    await orderedModels[indexToRemove].delete()

    orderedModels.splice(indexToRemove, 1)
    await Promise.all(orderedModels.map((orderedModel) => orderedModel.refresh()))
    assert.equal(orderedModels[0].order, 0)
    assert.equal(orderedModels[1].order, 1)
    assert.equal(orderedModels[2].order, 2)
  })

  test('deleting the first item in the sequence syncs remaining after deletion', async ({
    assert,
  }) => {
    class Ordered extends compose(BaseModel, OrderedMixin) {
      public static table = 'ordered'
      @column({ isPrimary: true })
      public id: number
    }
    const orderedModels = await Promise.all([
      Ordered.create({ order: 0 }),
      Ordered.create({ order: 1 }),
      Ordered.create({ order: 2 }),
      Ordered.create({ order: 3 }),
    ])

    const indexToRemove = 0
    await orderedModels[indexToRemove].delete()

    orderedModels.splice(indexToRemove, 1)
    await Promise.all(orderedModels.map((orderedModel) => orderedModel.refresh()))
    assert.equal(orderedModels[0].order, 0)
    assert.equal(orderedModels[1].order, 1)
    assert.equal(orderedModels[2].order, 2)
  })

  test('deleting the last item in the sequence syncs remaining after deletion', async ({
    assert,
  }) => {
    class Ordered extends compose(BaseModel, OrderedMixin) {
      public static table = 'ordered'
      @column({ isPrimary: true })
      public id: number
    }
    const orderedModels = await Promise.all([
      Ordered.create({ order: 0 }),
      Ordered.create({ order: 1 }),
      Ordered.create({ order: 2 }),
      Ordered.create({ order: 3 }),
    ])

    const indexToRemove = 3
    await orderedModels[indexToRemove].delete()

    orderedModels.splice(indexToRemove, 1)
    await Promise.all(orderedModels.map((orderedModel) => orderedModel.refresh()))
    assert.equal(orderedModels[0].order, 0)
    assert.equal(orderedModels[1].order, 1)
    assert.equal(orderedModels[2].order, 2)
  })

  test('syncs models with respect to the orderColumn', async ({ assert }) => {
    await createOrderedTable({ tableName: 'ordered', orderColumns: ['test'] })
    class Ordered extends compose(BaseModel, OrderedMixin) {
      public static table = 'ordered'
      @column({ isPrimary: true })
      public id: number

      @column()
      @orderKey()
      public test: number
    }
    const orderedModels = await Promise.all([
      Ordered.create({ order: 0, test: 0 }),
      Ordered.create({ order: 1, test: 0 }),
      Ordered.create({ order: 2, test: 0 }),
      Ordered.create({ order: 3, test: 0 }),
      // These models should not be synced after a model from the first set is deleted
      Ordered.create({ order: 0, test: 1 }),
      Ordered.create({ order: 2, test: 1 }),
    ])

    const indexToRemove = 2
    await orderedModels[indexToRemove].delete()
    orderedModels.splice(indexToRemove, 1)
    await Promise.all(orderedModels.map((orderedModel) => orderedModel.refresh()))

    assert.equal(orderedModels[0].order, 0)
    assert.equal(orderedModels[1].order, 1)
    assert.equal(orderedModels[2].order, 2)
    assert.equal(orderedModels[3].order, 0)
    assert.equal(orderedModels[4].order, 2)
  })

  test('should sync sequence of 0 values', async ({ assert }) => {
    await createOrderedTable({ tableName: 'ordered' })
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
    await Promise.all(orderedModels.map((model) => model.merge({ order: 0 }).save()))

    await orderedModels[0].syncSequence()

    await Promise.all(orderedModels.map((orderedModel) => orderedModel.refresh()))
    assert.equal(orderedModels[0].order, 0)
    assert.equal(orderedModels[1].order, 1)
    assert.equal(orderedModels[2].order, 2)
  })

  test('should sync sequence with respect to multiple order columns', async ({ assert }) => {
    await createOrderedTable({ orderColumns: ['test_key', 'test_key_two'] })
    class Ordered extends compose(BaseModel, OrderedMixin) {
      public static table = 'ordered'

      @column({ isPrimary: true })
      public id: number

      @column()
      @orderKey()
      public testKey: number

      @column()
      @orderKey()
      public testKeyTwo: number
    }
    const orderedModels = await Promise.all([
      Ordered.create({ order: 0, testKey: 0, testKeyTwo: 1 }),
      Ordered.create({ order: 1, testKey: 0, testKeyTwo: 1 }),
      Ordered.create({ order: 2, testKey: 0, testKeyTwo: 1 }),
      Ordered.create({ order: 0, testKey: 0, testKeyTwo: 2 }),
      Ordered.create({ order: 2, testKey: 0, testKeyTwo: 2 }),
    ])

    const indexToRemove = 1
    await orderedModels[indexToRemove].delete()
    orderedModels.splice(indexToRemove, 1)
    await Promise.all(orderedModels.map((orderedModel) => orderedModel.refresh()))

    assert.equal(orderedModels[0].order, 0)
    assert.equal(orderedModels[1].order, 1)
    // These models should not be synced after a model from the first set is deleted
    assert.equal(orderedModels[2].order, 0)
    assert.equal(orderedModels[3].order, 2)
  })
})

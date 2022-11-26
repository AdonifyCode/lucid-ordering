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

test.group('Mixins.Ordered.setOrder', (group) => {
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

  test('should set a lower order', async ({ assert }) => {
    class Ordered extends compose(BaseModel, OrderedMixin) {
      public static table = 'ordered'
      @column({ isPrimary: true })
      public id: number
    }
    const [first, second, third] = await Promise.all([
      Ordered.create({ order: 0 }),
      Ordered.create({ order: 1 }),
      Ordered.create({ order: 2 }),
    ])

    await third.setOrder(1)

    await Promise.all([first.refresh(), second.refresh(), third.refresh()])
    assert.equal(first.order, 0)
    assert.equal(second.order, 2)
    assert.equal(third.order, 1)
  })

  test('should set a lower order with respect to the orderColumn', async ({ assert }) => {
    await createOrderedTable({ orderColumns: ['test_key'] })
    class Ordered extends compose(BaseModel, OrderedMixin) {
      public static table = 'ordered'
      @column({ isPrimary: true })
      public id: number

      @column()
      @orderKey()
      public testKey: number
    }
    const orderedModels = await Promise.all([
      Ordered.create({ order: 0, testKey: 0 }),
      Ordered.create({ order: 1, testKey: 0 }),
      Ordered.create({ order: 2, testKey: 0 }),
      Ordered.create({ order: 0, testKey: 1 }),
      Ordered.create({ order: 1, testKey: 1 }),
      Ordered.create({ order: 2, testKey: 1 }),
    ])

    await orderedModels[2].setOrder(1)
    await Promise.all(orderedModels.map((orderedModel) => orderedModel.refresh()))

    // First set should have their order updated
    assert.equal(orderedModels[0].order, 0)
    assert.equal(orderedModels[1].order, 2)
    assert.equal(orderedModels[2].order, 1)
    // Second set should not be changed
    assert.equal(orderedModels[3].order, 0)
    assert.equal(orderedModels[4].order, 1)
    assert.equal(orderedModels[5].order, 2)
  })

  test('should set a higher order', async ({ assert }) => {
    class Ordered extends compose(BaseModel, OrderedMixin) {
      public static table = 'ordered'
      @column({ isPrimary: true })
      public id: number
    }
    const [first, second, third] = await Promise.all([
      Ordered.create({ order: 0 }),
      Ordered.create({ order: 1 }),
      Ordered.create({ order: 2 }),
    ])

    await first.setOrder(1)

    await Promise.all([first.refresh(), second.refresh(), third.refresh()])
    assert.equal(first.order, 1)
    assert.equal(second.order, 0)
    assert.equal(third.order, 2)
  })

  test('should set a higher order with respect to the orderColumn', async ({ assert }) => {
    await createOrderedTable({ orderColumns: ['test'] })
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
      Ordered.create({ order: 0, test: 1 }),
      Ordered.create({ order: 1, test: 1 }),
      Ordered.create({ order: 2, test: 1 }),
    ])

    await orderedModels[1].setOrder(2)

    await Promise.all(orderedModels.map((orderedModel) => orderedModel.refresh()))
    // First set should have their order updated
    assert.equal(orderedModels[0].order, 0)
    assert.equal(orderedModels[1].order, 2)
    assert.equal(orderedModels[2].order, 1)
    // Second set should not be changed
    assert.equal(orderedModels[3].order, 0)
    assert.equal(orderedModels[4].order, 1)
    assert.equal(orderedModels[5].order, 2)
  })

  test('should set order to last in the list', async ({ assert }) => {
    class Ordered extends compose(BaseModel, OrderedMixin) {
      public static table = 'ordered'
      @column({ isPrimary: true })
      public id: number
    }
    const [first, second, third] = await Promise.all([
      Ordered.create({ order: 0 }),
      Ordered.create({ order: 1 }),
      Ordered.create({ order: 2 }),
    ])

    await second.setOrder(2)

    await Promise.all([first.refresh(), second.refresh(), third.refresh()])
    assert.equal(first.order, 0)
    assert.equal(second.order, 2)
    assert.equal(third.order, 1)
  })

  test('should set order to first in the list', async ({ assert }) => {
    class Ordered extends compose(BaseModel, OrderedMixin) {
      public static table = 'ordered'
      @column({ isPrimary: true })
      public id: number
    }
    const [first, second, third] = await Promise.all([
      Ordered.create({ order: 0 }),
      Ordered.create({ order: 1 }),
      Ordered.create({ order: 2 }),
    ])

    await third.setOrder(0)

    await Promise.all([first.refresh(), second.refresh(), third.refresh()])
    assert.equal(first.order, 1)
    assert.equal(second.order, 2)
    assert.equal(third.order, 0)
  })

  test('should set order to last in sequence if larger number than greatest order is passed', async ({
    assert,
  }) => {
    class Ordered extends compose(BaseModel, OrderedMixin) {
      public static table = 'ordered'
      @column({ isPrimary: true })
      public id: number
    }
    const [first, second, third] = await Promise.all([
      Ordered.create({ order: 0 }),
      Ordered.create({ order: 1 }),
      Ordered.create({ order: 2 }),
    ])

    await first.setOrder(4)

    await Promise.all([first.refresh(), second.refresh(), third.refresh()])
    assert.equal(first.order, 2)
    assert.equal(second.order, 0)
    assert.equal(third.order, 1)
  })

  test('should set order to last in sequence if the last item in the sequence is set to a higher order', async ({
    assert,
  }) => {
    class Ordered extends compose(BaseModel, OrderedMixin) {
      public static table = 'ordered'
      @column({ isPrimary: true })
      public id: number
    }
    const [first, second, third] = await Promise.all([
      Ordered.create({ order: 0 }),
      Ordered.create({ order: 1 }),
      Ordered.create({ order: 2 }),
    ])

    await third.setOrder(4)

    await Promise.all([first.refresh(), second.refresh(), third.refresh()])

    assert.equal(first.order, 0)
    assert.equal(second.order, 1)
    assert.equal(third.order, 2)
  })

  test('should set order with respect to multiple order columns', async ({ assert }) => {
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
      Ordered.create({ order: 0, testKey: 0, testKeyTwo: 2 }),
      Ordered.create({ order: 1, testKey: 0, testKeyTwo: 2 }),
    ])

    await orderedModels[0].setOrder(1)

    await Promise.all(orderedModels.map((orderedModel) => orderedModel.refresh()))
    // First set should have their order updated
    assert.equal(orderedModels[0].order, 1)
    assert.equal(orderedModels[1].order, 0)
    // Second set should not be changed
    assert.equal(orderedModels[2].order, 0)
    assert.equal(orderedModels[3].order, 1)
  })
})

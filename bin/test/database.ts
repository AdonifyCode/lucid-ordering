import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
const Database: DatabaseContract = global[Symbol.for('ioc.use')]('Adonis/Lucid/Database')

export async function createOrderedTable({
  tableName = 'ordered',
  orderColumn,
}: {
  tableName?: string
  orderColumn?: string
} = {}) {
  await Database.connection().schema.dropTableIfExists(tableName)
  await Database.connection().schema.createTableIfNotExists(tableName, (table) => {
    table.increments('id').primary()
    table.timestamp('created_at', { useTz: true })
    table.timestamp('updated_at', { useTz: true })
    table.integer('order')

    if (orderColumn) {
      table.integer(orderColumn)
    }
  })
}

export async function cleanDatabase() {
  await Database.connection().dropAllTables()
}

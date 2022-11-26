import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
const Database: DatabaseContract = global[Symbol.for('ioc.use')]('Adonis/Lucid/Database')

export async function createOrderedTable({
  tableName = 'ordered',
  orderColumns,
}: {
  tableName?: string
  orderColumns?: string[]
} = {}) {
  await Database.connection().schema.dropTableIfExists(tableName)
  await Database.connection().schema.createTableIfNotExists(tableName, (table) => {
    table.increments('id').primary()
    table.timestamp('created_at', { useTz: true })
    table.timestamp('updated_at', { useTz: true })
    table.integer('order')

    orderColumns?.forEach((column) => {
      table.integer(column)
    })
  })
}

export async function cleanDatabase() {
  await Database.connection().dropAllTables()
}

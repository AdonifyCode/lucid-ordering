import type { DatabaseConfig } from '@ioc:Adonis/Lucid/Database'
import { Filesystem } from '@poppinss/dev-utils'
import { resolve, join } from 'path'

export const fs = new Filesystem(join(__dirname, '..', 'tmp'))

const database: DatabaseConfig = {
  connection: 'sqlite',
  connections: {
    sqlite: {
      client: 'sqlite',
      connection: {
        filename: resolve(__dirname, '../tmp/database.sqlite'),
      },
    },
  },
}

export async function createDatabaseConfig() {
  await fs.add(
    'config/database.ts',
    `
		const databaseConfig = ${JSON.stringify(database, null, 2)}
		export default databaseConfig
	`
  )
}

export async function createAppConfig() {
  await fs.add(
    'config/app.ts',
    `
		export const appKey = 'averylong32charsrandomsecretkey',
		export const http = {
			cookie: {},
			trustProxy: () => true,
		}
	`
  )
}

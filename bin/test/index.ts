import { assert } from '@japa/assert'
import { specReporter } from '@japa/spec-reporter'
import { runFailedTests } from '@japa/run-failed-tests'
import { processCliArgs, configure, run } from '@japa/runner'
import { createAppConfig, createDatabaseConfig, fs } from './config'
import { Application } from '@adonisjs/application'

/*
|--------------------------------------------------------------------------
| Configure tests
|--------------------------------------------------------------------------
|
| The configure method accepts the configuration to configure the Japa
| tests runner.
|
| The first method call "processCliArgs" process the command line arguments
| and turns them into a config object. Using this method is not mandatory.
|
| Please consult japa.dev/runner-config for the config docs.
*/
configure({
  ...processCliArgs(process.argv.slice(2)),
  ...{
    files: ['tests/**/*.spec.ts'],
    plugins: [assert(), runFailedTests()],
    reporters: [specReporter()],
    importer: (filePath) => import(filePath),
    setup: [
      async () => {
        await fs.add('.env', '')
        await createAppConfig()
        await createDatabaseConfig()

        const app = new Application(fs.basePath, 'test', {
          providers: ['@adonisjs/core', '@adonisjs/lucid', '../../providers/LucidOrderingProvider'],
        })

        await app.setup()
        await app.registerProviders()
        await app.bootProviders()

        return async () => {
          const db = app.container.use('Adonis/Lucid/Database')
          await db.manager.closeAll()
          await app.shutdown()
          await fs.cleanup()
        }
      },
    ],
  },
})

/*
|--------------------------------------------------------------------------
| Run tests
|--------------------------------------------------------------------------
|
| The following "run" method is required to execute all the tests.
|
*/
run()

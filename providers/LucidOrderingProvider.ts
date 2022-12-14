import { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class LucidOrderingProvider {
  public static needsApplication = true

  constructor(protected app: ApplicationContract) {}

  public register() {
    this.app.container.singleton('Adonify/LucidOrdering', () => {
      const { Ordered } = require('../src/Mixins/Ordered')
      const { orderKey } = require('../src/Decorators/orderKey')

      return { Ordered, orderKey }
    })
  }

  public async boot() {
    // IoC container is ready
  }
}

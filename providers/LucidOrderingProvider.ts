import { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class LucidOrderingProvider {
  public static needsApplication = true

  constructor(protected app: ApplicationContract) {}

  public register() {
    this.app.container.singleton('Adonify/LucidOrdering', () => {
      const Ordered = require('../src/Mixins/Ordered').default

      return { Ordered }
    })
  }

  public async boot() {
    // IoC container is ready
  }
}

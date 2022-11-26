import { OrderKeyDecorator } from '@ioc:Adonify/LucidOrdering'
import { LucidModel } from '@ioc:Adonis/Lucid/Orm'

export const orderKey: OrderKeyDecorator = () => {
  return function (target, property) {
    const Model = target.constructor as LucidModel

    Model.$defineProperty('orderKeys' as any, [], 'inherit')
    Model['orderKeys'].push({ property })
  }
}

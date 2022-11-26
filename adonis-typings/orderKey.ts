declare module '@ioc:Adonify/LucidOrdering' {
  export type OrderKeyDecorator = () => (target: any, property: string) => void

  const orderKey: OrderKeyDecorator

  export { orderKey }
}

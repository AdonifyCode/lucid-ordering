declare module '@ioc:Adonify/LucidOrdering' {
  interface OrderedModelList {
    orderedModel: {
      table: 'ordered'
      orderedColumn: 'test'
    }
    orderedModelNoColumn: {
      table: 'ordered'
    }
  }
}

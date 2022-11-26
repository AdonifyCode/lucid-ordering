declare module '@ioc:Adonify/LucidOrdering' {
  import { LucidModel, LucidRow } from '@ioc:Adonis/Lucid/Orm'
  import { NormalizeConstructor } from '@ioc:Adonis/Core/Helpers'

  export interface LucidModelOrdered extends LucidModel {
    orderKeys?: { property: string }[]
  }

  export interface OrderedModel extends LucidRow {
    order: number

    /**
     * Updates the order of the model and re-adjusts the corresponding models with the unique key.
     *
     * @param order - The desired order, must be greater than or equal to 0.
     *
     * @remarks
     * If a number greater than the largest order is supplied,
     * it will default to the last possible order.
     *
     * If a number less than 0 is supplied, it will default to 0.
     */
    setOrder(this: this, order: number): Promise<void>

    /**
     * Boolean flag returning whether the model is first in the order sequence.
     */
    isFirst(): boolean

    /**
     * Boolean flag returning whether the model is last in the order sequence.
     */
    isLast(): Promise<boolean>

    /**
     * Moves the model to the start of the sequence.
     */
    moveToStart(): Promise<void>

    /**
     * Moves the model to the end of the sequence.
     */
    moveToEnd(): Promise<void>

    /**
     * Moves the model up one position in the sequence.
     * @remarks
     * Will have no effect on the the last model in the sequence.
     */
    moveUp(): Promise<void>

    /**
     * Moves the model down one position in the sequence.
     * @remarks
     * Will have no effect on the the first model in the sequence.
     */
    moveDown(): Promise<void>

    /**
     * Swaps the order of two models.
     * @param modelToSwap The model instance to swap orders with.
     * @remarks
     * If orderKeys are defined, the model instance must have the same orderKey values value.
     */
    swapOrder(modelToSwap: OrderedModel): Promise<void>

    /**
     * Moves the model before another in the sequence.
     * @param model The model to position before in the sequence.
     */
    moveBefore(model: OrderedModel): Promise<void>

    /**
     * Moves the model after another in the sequence.
     * @param model The model to position after in the sequence.
     */
    moveAfter(model: OrderedModel): Promise<void>

    /**
     * Sync the sequence of models, this method is also called after model deletion.
     * @remarks
     * If you have defined orderKeys on your model, this will sync the sequence based on that value.
     * Otherwise, the whole table will be synced.
     */
    syncSequence(): Promise<void>
  }

  export interface OrderedModelMixinContract {
    <T extends NormalizeConstructor<LucidModel>>(superclass: T): T & {
      new (...args: any[]): LucidRow & OrderedModel
    }
  }

  const Ordered: OrderedModelMixinContract

  export { Ordered }

  export interface OrderedModelContract {
    table: string
    orderedColumn: string
  }

  /**
   * List of ordered models. Using declaration
   * merging, one must extend this interface.
   *
   * MUST BE SET IN THE USER LAND.
   *
   * Example:
   *
   * courseSections: {
   *   table: 'course_sections'
   *   orderedColumn: 'course_id'
   * }
   *
   */
  export interface OrderedModelList {}

  export interface LucidOrderingConfig {
    orderedModelList: OrderedModelList
  }
}

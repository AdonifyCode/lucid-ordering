# Adonis Lucid Ordering
> A simple way to maintain order with your Lucid models.

## Introduction

This package provides a convenient mixin to create ordered behavior (sequences) with your Lucid models. This sequence order can be maintained at a per table level or via an ordered column.

## Installation

```bash
npm i @adonify/lucid-ordering

# Or using Yarn

yarn add @adonify/lucid-ordering

```

## Configuration 
```bash
node ace configure @adonify/lucid-ordering
```

## Usage

### Add the mixin to any Lucid model

```ts
import { BaseModel } from "@ioc:Adonis/Lucid/Orm";
import { compose } from "@poppinss/utils/build/helpers";
import { Ordered } from "@ioc:Adonify/LucidOrdering";

export default class Todo extends compose(BaseModel, Ordered('todos')) {}
```

The mixin will set the model's table value to `todos` under the hood, make sure this is the table name from your migrations.


### Create the Todo migration or add an order field to your existing model.
```ts
import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "todos";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });
      table.integer("order").notNullable();
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
```

### Ordered models with respect to an ordered column

We often need to maintain different sequences on one table with respect to a unique field. For example we may have a Board model with Todo's that we need we need to keep in order corresponding the Board's id.

You can do this by passing an orderColumnName to the OrderedMixin as follows.

```ts
import { BaseModel, BelongsTo, belongsTo, column } from "@ioc:Adonis/Lucid/Orm";
import Board from "App/Models/Board";
import { compose } from "@poppinss/utils/build/helpers";
import { Ordered } from "@ioc:Adonify/LucidOrdering";

export default class Todo extends compose(BaseModel, Ordered('todos', { orderColumnName: 'boardId' })) {
  @column()
  public boardId: number;

  @belongsTo(() => Board)
  public board: BelongsTo<typeof Board>;
}
```

```ts
export default class extends BaseSchema {
  protected tableName = "todos";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });
      table.integer("order").notNullable();
      table
        .integer("board_id")
        .unsigned()
        .references("boards.id")
        .onDelete("CASCADE");
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
```

Now the mixin will maintain separate sequences on the `todos` table based on the grouping of their `boardId`.

### Creating new models

When a new ordered model is created the order will automatically be set to the largest number in the sequence + 1.

```ts
// Assume no todos are present in the database yet
const todo1 = await Todo.create({}) // will have order of 0 
const todo2 = await Todo.create({}) // will have order of 1
```

#### With an ordered column

```ts
// Assume no todos are present in the database yet
const todo1 = await Todo.create({ boardId: 1 }) // will have order of 0 
const todo2 = await Todo.create({ boardId: 1 }) // will have order of 1

const todo3 = await Todo.create({ boardId: 2 }) // will have order of 0 
const todo4 = await Todo.create({ boardId: 2 }) // will have order of 1
```

### Maintaining order

#### Deletes

When a model is deleted, the order of the sequence will be automatically synced.

```ts
// Assume no todos are present in the database yet
const todo1 = await Todo.create({}) 
const todo2 = await Todo.create({}) 
const todo3 = await Todo.create({}) 

await todo2.delete() 
// todo1 and todo3 will now be synced to have orders of 0 and 1 respectively 
```

> **Note**
>
> Models will only be automatically synced if you use the model delete() method as it relies on the afterDelete() hook under the hood.

#### Manually syncing orders

If your sequence were to ever become out of order, you can manually sync the sequence.

```ts
await todo.syncSequence()
```

This will sync all models in the sequence, with respect to the `orderColumnName` if it is present.

> **Warning**
> 
> This package relies on keeping all models in an ordered sequence (ie. 1, 2, 3, ...n). If you manually update these values through the database, you will need to sync the sequence again for the various methods and hooks to work correctly.
>
> Furthermore, this approach relies on potentially doing an update on each row of the sequence when a row is deleted, and on multiple rows during order moves. This means large datasets may not be optimal for your performance needs and you should use this package with caution.

### Model functions 

| Model function | Description |
| --- | --- |
| setOrder(order: number): Promise\<void> | Set a new order on the model. |
| isFirst(): boolean | Flag for whether the model is first in it's sequence. |
| isLast(): Promise\<boolean> | Flag for whether the model is last in it's sequence. |
| moveToStart(): Promise\<void> | Move the model to the start of it's sequence. |
| moveToEnd(): Promise\<void> | Move the model to the end of it's sequence. |
| moveUp(): Promise\<void> | Move the model one position up in it's sequence. |
| swapOrder(modelToSwap: OrderedModel): Promise\<void> | Swap the order of two models. |
| moveBefore(model: OrderedModel): Promise\<void> | Move a model before another in it's sequence. |
| moveAfter(model: OrderedModel): Promise\<void> | Move a model after another in it's sequence. |
| syncSequence(): Promise\<void> | Syncs the sequence of the model called on. |

## Issues

If you have a question or found a bug, feel free to [open an issue](https://github.com/AdonifyCode/lucid-ordering/issues).
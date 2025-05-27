I've published a [small package](https://github.com/ben-pr-p/kysely-access-control) implementing permissions as plugin to the [Kysely](https://kysely.dev/) query builder.

Implementing permissions at the query builder layer makes more sense than in _each query_:

1. **DRY-er**: Common use cases like filtering a table or omitting a column are just specified once, instead of in every query in your application.
2. **Separation of concerns**: Maintain a part of your application responsible for generating different guards for different users and ensure that your core application logic is not polluted with permission checks, and doesn't need to change when permissions or new roles are created.
3. **Harder to forget**: No more odd bugs where you forget to add a check for `.is_deleted` or `.tenant_id = ?`

Even though PostgreSQL has a fully featured permission system, implementing permissions at the query builder layer can makes more sense than in _the database_ itself:

1. **Dynamically generate context specific permissions**: Postgres permissions are static, and so you can't, for example, generate permissions based on the current context / user role / action matrix. Although you can use a role per user approach, that role controls those users permissions in any context.
2. **No security definer escape**: When using database level permissions, it's common to use security definer functions as an escape hatch. When you do, you're back to manually re-implementing parts of the permissions you want to keep.
3. **More control**: Postgres, for example, has no deny rules, and so it can be easy to accidentally grant permissions that leak when additive roles combine.


It has a high level grants API:
```typescript
// in some file db.ts
import { createKyselyGrantGuard, createAccessControlPlugin } from 'kysely-access-control'

const getSharedGrants = (currentUserId) => [
  {
    on: 'posts',
    for: 'select'
  },
  {
    on: 'comments',
    for: 'select'
  },
  {
    on: 'posts',
    for: 'all',
    where: (eb) => eb.eq('author_id', currentUserId)
  },
  {
    on: 'comments',
    for: 'all',
    where: (eb) => eb.eq('author_id', currentUserId)
  }
]

const adminGrants = [
  {
    on: 'accounts',
    for: 'all',
  }
]

const query = (userId, isAdmin) => {
  return db.withPlugin(createAccessControlPlugin(
    createKyselyGrantGuard(
      getSharedGrants(userId).concat(isAdmin ? adminGrants : [])
    )
  )
}

// in some api.ts
import { query } from './db.ts'

// in some request handler
// this query will have permissions enforced
await query(req.user.id, req.user.isAdmin).selectFrom('posts').select(['id']).execute();
```



And a lower-level allow/deny API:
```typescript
import { createAccessControlPlugin, KyselyAccessControlGuard, Allow, Deny, Update, Delete, ColumnInUpdateSet } from 'kysely-access-control';
import { Database } from './my-kysely-types.ts'

// Define your guard
const guard: KyselyAccessControlGuard<Database> = {
  table: (table, statementType, usageContext) => {
    // table.name is restricted to keyof Database
    if (table.name === 'events' && statementType ===  Delete) {
      return Deny;
    }

    return Allow;
  },
  column: (table, column, statementType, usageContext) => {
    // Control if the column can be inserted, updated independently
    if (table.name === 'events' && column.name === 'is_deleted' && statementType === Update && usageContext === ColumnInUpdateSet) {
      return Deny;
    }

    return Allow;
  }
}

// When executing a query...
const events = await db
  .withPlugin(createAccessControlPlugin(guard))
  .updateTable('events)
  .set({ is_deleted: false })
  .execute();
// throws 'UPDATE denied on events.is_deleted'
```


Give it a try and let me know what you think!
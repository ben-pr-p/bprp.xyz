---
author: Ben Packer
pubDatetime: 2024-01-11
title: Kysely Grants
slug: kysely-grants
featured: false
draft: false
description: Information about a reusable access control layer implementing permissions at the query builder layer
tags:
  - technical
  - kysely
  - postgresql
  - access-control
  - security
---

I built a re-usable access control layer that is implemented at the query builder layer called [`kysely-grants`](https://github.com/ben-pr-p/kysely-utils/tree/main/packages/kysely-grants). Please use it if you want!

## Motivation (Why Implement Permissions at the Query Builder Layer?)

Implementing permissions at the query builder layer makes more sense than in _each query_:

1. **DRY-er**: Common use cases like filtering a table or omitting a column are just specified once, instead of in every query in your application.
2. **Separation of concerns**: Maintain a part of your application responsible for generating different guards for different users and ensure that your core application logic is not polluted with permission checks, and doesn't need to change when permissions or new roles are created.
3. **Harder to forget**: No more odd bugs where you forget to add a check for `.is_deleted` or `.tenant_id = ?`

Even though PostgreSQL has a fully featured permission system, implementing permissions at the query builder layer can makes more sense than in _the database_ itself:

1. **Dynamically generate context specific permissions**: Postgres permissions are static, and so you can't, for example, generate permissions based on the current context / user role / action matrix. Although you can use a role per user approach, that role controls those users permissions in any context.
2. **No security definer escape**: When using database level permissions, it's common to use security definer functions as an escape hatch. When you do, you're back to manually re-implementing parts of the permissions you want to keep.
3. **More control**: Postgres, for example, has no deny rules, and so it can be easy to accidentally grant permissions that leak when additive roles combine.
---
author: Ben Packer
pubDatetime: 2023-09-17
title: My Choices for Building Interactive Web Apps in September 2023
slug: my-choices-for-building-interactive-web-apps-in-september-2023
featured: false
draft: false
description: My preferred technology stack for building highly interactive single page applications
tags:
  - technical
  - stack
  - web-development
  - react
  - typescript
---

As of September 2023, I am planning on starting new web apps (highly interactive single page applications) using the following technologies:
- [bun](https://bun.sh/)
- [hono](https://hono.dev/)
- [tRPC](https://trpc.io/)
- React (with vite + swc)
- [jotai](https://github.com/pmndrs/jotai)
- Radix UI + Tailwind
- PostgreSQL
- [kysely](https://github.com/kysely-org/kysely) with [kysely-codegen](https://github.com/RobinBlomberg/kysely-codegen)
- [graphile-migrate](https://github.com/graphile/migrate)
- [graphile-worker](https://github.com/graphile/worker)

Additionally, I am planning on building things to run on horizontally scalable machines that do **not** scale to 0. In more common words, I don't want to use serverless.

I am also not planning on using Neon, Xata, Supabase, or any other serverless-ey provider for Postgres, instead opting for Fly, Render, Kubernetes, or something else more stateful.

I'm putting this page up in case it's of interest to anyone. I'm also *not* going to edit it and instead let it become out of date, which might be interesting. 


> [!success] [Check out my starter repo with all of this configured!](https://github.com/ben-pr-p/bprp-2023-starter)


# Affordances of the Stack

## "Decoupled" End to End Type Safety 

This stack offers end-to-end type safety *without* strong coupling between database fields and client side code. Let's break that down.

**End-to-end type safety** means that Typescript is used to verify key components of the correctness of every function call, HTTP request, or database query. Inside my application code, Typescript already enforced this. `kysely-codegen` + `kysely` allows me to use Typescript to check the boundary between my server and database and `tRPC` allows me to check the boundary between my clients and server.

**"Decoupled" end-to-end type safety** means that these two boundaries (database <-> server, server <-> client) can be evolved separately. For example, in this stack I can change the name or type of a database field without changing the name or type of the corresponding field in the client/server contract. In my experience, this is absolutely something you'll want when doing complex rollouts of database migrations. This is not true of many other commons ways to approach end-to-end type safety, such as [Postgraphile](https://graphile.org/postgraphile/)/[Hasura](https://hasura.io/) + [GraphQL Codegen ](https://the-guild.dev/graphql/codegen), [Supabase](https://supabase.com/)/[Postgrest](https://postgrest.org/en/stable/), or other low-code backends. Some of these tools have ways to progressively evolve the schema, but it is undoubtedly harder. 

## Near 0 Configuration, Ultra Fast, No JS-Powered Bundling in my Dev Environment

On previous setups where the client (and or server) were bundled with Webpack and/or Typescript itself, the high memory usage and slow iteration speed were a constant source of frustration in development. Looking back, I spent significant time waiting for recompilation or dealing with the downstream consequences of having my computers resources fully saturated and attempting to video chat, screen share, or use an external monitor. 

I now have a new fancy M2 mac that I think could handle the old way I was developing, but I still want to optimize for overall development joy and speed as a key part of what will help me stay happy and free of frustration while developing.

## Client/Server Shared Code

I like Elixir a lot and wish I had more opportunities to use it, but I anticipate that most complex interactive single page applications **will** share logic between the client and server at some point. 

I actually should amend that to **could benefit from sharing**. You never *need* to share the code itself: the server is right there, just an HTTP request away. However, if I write my application in a way that sharing code between the client and server is easy, I'm more likely to make choices that result in a better user experience.

It's also easy for front-end developers to write their own server side API calls. 

# Specific Choices
## Bun (at least for install, build, test)

For me, the biggest benefit of Bun is the reduction in development complexity. They claim Bun's built-in webserver is faster than Node and Deno's, but I really don't care about that: my web application is not a hello world benchmark app, and the bottleneck will be database queries, not HTTP overhead.

The reason to use Bun is:

**Directly execute Typescript files**: that's just great, especially for development/util scripts and keeping your local development process simple (`bun run --hot` vs `nodemon` + `tsc` / `ts-node` and more).

**Use `npm` modules and `package.json`**: it's just much easier to take advantage of the existing and large Node ecosystem than it is with Deno.

**Abstract the differences of CommonJS vs es modules**: I can't describe how many hours I've lost to build errors related to my tsconfig, build setup, and CommonJS vs es modules. I consider myself pretty close to a Typescript + Node ecosystem expert and I barely understand what's happening here and how to fix it, and I'm very excited I won't have to learn. It does not feel necessary.

**Miscellaneous reductions in tooling**: I think I lost probably 20-40 hours to this [Jest ts-loader memory leak](https://github.com/kulshekhar/ts-jest/issues/1967), which I am currently assuming won't happen with Bun's built in test runner (it might, of course). There's more things like this, and I'm very optimistic all this pain is in the past.

I may choose to use Node in production by using `bun build` to build a Javascript bundle that Node executes, since Bun still isn't that stable. Undecided!

## Hono

Hono seems nice, but really I just don't need or want much from the "router" component of the stack. I'm going to use tRPC, and if I'm not going to use tRPC, I will likely be using GraphQL. 

I want to accomplish simple routing: a handful of different routes, maybe separated by tenant or by role. Other than that, I don't want it to do much. 

Hono is just simple and fully typed. Express is simple, but it's typing leaves some gaps. You will likely run into an `any`, and it will probably be annoying when it happens to `console.log(req.something)` to figure out what's available.

Additionally, I like the "double stack" middleware Hono (and Koa originally) where you can run something both before *and after* the main request cycle:

```typescript
app.use(async (_, next) => { 
  console.log('middleware 1 start')
  await next()
  console.log('middleware 1 end') 
})
```

In previous work, I monkey-patched Express's `req.end` for monitoring. It worked, but there were some bugs as a result of incorrect implementations.

Ultimately, I really don't want any new vocabulary words here. When I look at the overview for [NestJS](https://docs.nestjs.com/modules) or other "enterprise" frameworks, there's lots of things to learn. 

Ultimately, 90% of my backend will translate user requests into SQL queries and apply some light transformations on the results, and I believe it's simpler to develop and optimize when we minimize our abstraction distance from that core function.

## React

I've been personally using React for 8 years now. It's gotten some hate and competitors recently, but it's working great for me!

## Jotai

For me, Jotai is the state management approach that makes it easiest to build things that are fast *by default*. 

I just keep in mind that anytime I pass an object that resides in state down to a child component, I am likely going to encounter unnecessary rerenders that would solved by replacing that with an atom or key to an atom family.

From there, making that replacement is pretty simple: going from a simple `useState` to a `useAtom` or `useAtomFamily` is easier than refactoring with `zustand` or a reducer based approach.

I've also enjoyed how easy it is to connect atoms to `localStorage`, proxy them, and build them up out of components. 

## graphile-migrate

I expect that at some point in ever project I am going to have to approach a migration in some way that is both not supported by either a declarative ORM approach to migrations (think [Prisma](https://www.prisma.io/) or [Drizzle](https://github.com/drizzle-team/drizzle-orm)) and not supported by [Kysely's migraitons](https://kysely.dev/docs/migrations). Examples include concurrently creating a partial index, using a view for an intermediate stage in a column rename, etc.

Since these abstractions will always leak, I just want to write my migrations in pure SQL. `graphile-migrate` gives the best developer experience for doing so.

## graphile-worker

Being able to trigger and manipulate asynchronous jobs with SQL is extremely powerful, and feels to me like a thing you will probably need.

Although Redis based solutions like [BullMQ](https://github.com/taskforcesh/bullmq) can have higher throughput, `graphile-worker`'s throughput is probably high enough for most projects, and the experience of re-queueing a thousand failed jobs or queueing a thousand at a time can't be matched.

`graphile-worker` is also easy to test 

The one downside of `graphile-worker` vs. a proprietary cloud solution (Google's Cloud tasks, SQS, or the third party [Inngest](https://www.inngest.com/)) is that `graphile-worker` needs a database connection open to find jobs. As a result, PostgreSQL + `graphile-worker` itself cannot wake a scale to 0 serverless function. That's fine by me – I'm happy with scale to 1.

# Other Opinions

## Don't Use Automagic Backends / Backends as a Service

This is a section of my tRPC router that lists for an organization in a sample application.

```typescript
export const appRouter = router({
  // ...
  listPages: publicProcedure.input(z.string()).query(async ({ input }) => {
    return await db
      .selectFrom("pages")
      .selectAll()
      .where("pages.organization_id", "=", input)
      .execute();
  }),
  // ...
});
```

There's no denying it: this is boiler plate. There's also a lot of it. I estimate that probably 75+% of my tRPC queries and mutations look more or less like this with some extra validation and a few joins sprinkled in.

However, even though it was boilerplate, it was also really easy and enjoyable. In a file with some examples, copilot can type most of it, and the typesense with Kysely is great.

I sympathize with the line of thinking that departs from the fact that 75% of this is boilerplate and then tries to eliminate it, but ultimately, at the current moment in time, do not agree.

The key reason is this: **I care less how easy the easy things are than how hard the hard things are**. Stated differently, I would rather **have** to do an easy thing than struggle to do a hard thing.

So far, I have yet to find a automagic backend (think Supabase, Hasura, Postgraphile) that doesn't make some thing you are likely to want to do unreasonably hard.

For some, it might be holding a transaction open while you make an API call, executing a query of sufficient dynamic complexity that can't build it with the query builder or write it ahead of time in raw SQL, or build sufficient security guard rails.

Of course there are ways around these limitations, and usually it just means accessing the database directly and spinning up a separate API route to do so. However, these usually require that you to break the abstraction and thus the safety provided by these layers. Since these are often also your most complex parts of business logic, it's very much a "just when we needed them most, they vanished" type situation.

By starting with a lower level end-to-end type safety setup you can ensure you keep the benefits going for a deeper range of your complexity.

## Minimize Codegen (Use tRPC)

Any solution that requires codegen to provide end-to-end type safety is a worse developer experience than one that accomplishes the same thing without codegen.

Although with some investment (proper watching and rerunning scripts, etc.) you can engineer a decent development experience with codegen, there are still warts, like stale VSCode caches or additional time required to set up new instances of the codegen pipeline.

That of course feels obvious, but in my opinion it's really worth choosing tooling around that fact. 

For example, you can of course write an OpenAPI compliant (or GraphQL) backend and then codegen a client. However, tRPC (or [garph](https://github.com/stepci/garph)) gives you that without codegen.

If you have to use codegen, choose solutions that are further downstream and have to be run less often. Apollo Client codegen requires a rerun per GraphQL query, and Supabase's codegen must be run per each additional RPC call added, but [graphql-typed-client](https://github.com/helios1138/graphql-typed-client), [gqty](https://gqty.dev/) and kysely only run on schema change. 

## Why I chose codegen over Drizzle

Despite the desired to avoid codegen, this stack uses codegen to generate Kysely's database type.

The main alternative approach to not using codegen to type the server to database layer is to have an ORM generate the migrations, e.g., [Drizzle Migrations](https://orm.drizzle.team/docs/migrations). Drizzle's look to me to be the best out there, and the generated SQL looks readable and easily editable. 

The downside of this is that the SQL migrations are not run and validated as part of the development flow. Even if we assuming the Drizzle generated SQL is perfect (which might very well be the case), I **will** need to edit it once I reach certain data volumes and uptime requirements. 

As a result, when I start editing it, I lose the validation originally provided that my database objects and Typescript types line up, since Drizzle does re-validate that with my edited SQL.

On the other hand, `graphile-migrate` + `kysely-codegen` allows me to fully customize my migration SQL with the same level of safety, and offers a first class (minus a teensy bit of codegen) experience for doing so.

## Query Builders are Useful

One notable alternative to Kysely is [`pg-typed`](https://github.com/adelsz/pgtyped), which generates a type per query written. This is a very high level guarantee: not only is the returning type accurate, but your SQL is accurate as well.

Other than requiring too much codegen as part of development, I've found that procedurally generating a query is not that uncommon. Whether it's conditionally adding filters, some of which require a join or creating higher level functions that may leverage different tables, if I've built my application around the use of `pg-typed`, I must implement these not so uncommon edge cases with raw string manipulation, and all safety has been lost.

## Don't Use "The Edge"

The "edge" (the industry term for cloud services which let you run your code, usually Javascript or WASM, in the cloud service's data center closest to the requesting IP) is taking off.

There seem to be one key caveats that these services are leaving out of their marketing though: if your request requires more than one database call and contains a write or you are not using geo-replication, moving your service to the edge will make it slower.

The scenario I described above describes the vast majority of applications today and new applications that will come online.

Moving to the edge will make your API slower because although 1 round trip occurs between your users and your server, *n* (where *n* is mostly greater than 1) round trip occurs between your server and your database.

Of course, you may be able to carefully craft your application so that there's only 1 database query per request, but why bother! When my server is right next to my database, a single row fetch by index in Postgres, round trip, is 1-3ms, and it's a joy to program without having to worry about that.

[Cloudflare's smart placement feature](https://developers.cloudflare.com/workers/configuration/smart-placement/) is designed to work around this fact, but their solution is basically just to intelligently *stop using the edge*. There are other ways to solve the problem for read only requests (using Fly [Postgres](https://fly.io/docs/postgres/) and [the replay header](https://fly.io/docs/reference/dynamic-request-routing/)), but I'm not sure how many of your routes you'll be able to confidently say involve 0 writes.

## Don't Use "Scale to 0"

The price difference between "scale to 0" (true "serverless") and "scale to small" (horizontally scaling always on containers that scale based on CPU/RAM and ) is often $5/month or less, and often the latter is even cheaper.

For that $5/month, you get:
- The ability to use any asynchronous job setup (`graphile-worker`, [BullMQ](https://github.com/taskforcesh/bullmq), regular RabbitMQ, etc.) and not just those that cloud vendors have configured their serverless functions to be woken by
- The ability to run long running jobs, like uploading or processing a large file, instead of daisy chaining from one job to the other

There are some third party tools like [Inngest](https://www.inngest.com/) that don't lock you into a full cloud ecosystem to solve this problem, but the affordances really aren't the same, the pricing isn't nothing, and your ability to use the same tooling and access control that you use for everything else for jobs is gone.

## Note on Server Side Rendering

There are many legitimate scenarios to use server side rendering, and this stack and post assume that none of them apply to you. Specifically, you:
- Are building a highly interactive client
- Don't care that much about initial page load
- Don't care that much about [the waterfall problem](https://remix.run/docs/en/main/guides/data-loading), or are fine using `React.Suspense` and other engineering around it
- Don't care about SEO

If any of those are not true, use Next or Remix! I don't have an opinion on which one right now.
---
author: Ben Packer
pubDatetime: 2023-09-05
title: An Ahead of Time Database
slug: an-ahead-of-time-database
featured: false
draft: false
description: A database system that restricts queries to a specified set but guarantees specific performance claims
tags:
  - technical
  - database
  - redis
  - performance
  - seeking-collaborators
---

### Background

At my previous job, I had the experience of taking a batch of logic that was accomplished by 4 complex SQL queries and re-implementing it in Redis. This required:
- Re-hydrating Redis from an underlying SQL store in the event of data loss
- Choosing Redis data structures that allowed us to answer the same questions that those complex SQL queries answered with just 1-3 Redis calls
- Adding updates those data structures in response to a bunch of different application events
- Optimizing things via Lua scripts to reduce round trip times

Overall, the performance gains were incredible, and the project was a big success.

On a giant PostgreSQL box, we could process around 100-150 "decisions" per second, where a decision involved several complex reads and depending on the outcome of the decision, between 2 and 4 additional inserts or updates. 

We had spent a long time optimizing the PostgreSQL solution, but continually ran into sets of tradeoffs where there was no perfect answer. If we used a fully normalized table structure, our reads, which involved a lot of aggregates and joins, were too slow. If we precomputed the aggregates and joins, we would run into contention and locking issues as two writes updated the same pre-computations.

Once the Redis re-implementation was done, we reached 500 decisions per second with teensy resource consumption and very impressive (a millisecond or two) latency per decision. The bottleneck was still writing the results of the decisions to Postgres, and we could have pushed it much further if we needed to. 

We achieved this result despite the fact that Redis was, as a single threaded system, processing each decision one at a time. In fact, the single transaction nature of Redis meant that we could precompute everything without any contention issues. With everything precomputed, the time to make a single decision was so short that it didn't matter if everything ran sequentially. With everything in memory, the additional writes required to cache that precomputed work were cheap and not noticeable.

The project was a huge success, but it was also a huge pain. We turned around 100 lines of SQL into a few thousand lines of Typescript and Lua, and it required a few rollouts to get the subtle edge cases right. Although I already knew that SQL and relational algebra were very powerful and expressive, this re-implementation gave me a renewed appreciation for just how much time SQL had been saving me.

### Other Solutions

This experience aligns with [a finding](http://nms.csail.mit.edu/~stavros/pubs/OLTP_sigmod08.pdf) that Michael Stonebraker (the creator of PostgreSQL) and others had in 2008: for some workloads, given the recent (over the past 20 years) decreases in the cost of memory and increases in the speed of processors, the cons of concurrency outweigh the benefits. Specifically, given that on modern systems the latency of a single in-memory transaction can be so low that the overhead of locking and concurrency management outweighs the benefits.

This finding lead a group to create [VoltDB](https://en.wikipedia.org/wiki/VoltDB), a single threaded in-memory DBMS. Despite boasting very impressive latency and throughput measurements, I don't think there's been significant adoption. I believe on reason for this is Volt's tight coupling with Java and the JVM, which many companies aren't too keen to run in production. This is in contrast to something like Redis, where there is both substantial investment in making Redis easy to run and many places to run it and significant competition for [performance improvements with systems that also target the Redis protocol](https://github.com/dragonflydb/dragonfly#benchmarks).

### The Core Idea

The work I did translating SQL to Redis data structures should be able to be automated. Given a SQL query, you can infer the Redis data structures required to answer the question given the minimal number of reads, even for joins and aggregates. Given a set of Redis data structures (somewhat equivalent to SQL indexes), you can figure out how to properly update these structures in response to a given write. Each SQL query could be compiled to a single Redis Lua function so that all updates to writes happen in a single network round trip.

However, there is one big tradeoff: such a system can only answer SQL queries specified ahead of time.

Databases like PostgreSQL, MySQL, and other OLTP DBMS's will do their best job to answer any query you give them, often scanning all of the relevant data to do so. When you give them a query, they look at statistics about your data and what indexes you have already built on your data and then choose the optimal query plan.

If we sacrifice the ability to answer arbitrary SQL queries and instead restrict yourself to a specified set, we can invert the relationship between indexes and queries. Instead of query planning based on existing indexes, we can decide the optimal indexes required to answer each query.

In addition to improved in-memory performance from being a single threaded in-memory system, this database system would have the added advantage of **taking away the burden of index choice and performance considerations from developers**. You would be guaranteed specific performance claims about all reads and writes based on [well known runtime properties of specific Redis commands](https://redis.io/commands/). You could even build a CLI or web interface that let users input expected data growth over time and verify that the system would still be fast based on specific table sizes. Additionally, since the system is single-threaded, you could precompute joins and aggregates in a way that you wouldn't attempt to with triggers or incrementally materialized views with PostgreSQL because of contention issues.

### Implementation

I've done a little bit of pen and paper work on this already: writing down a set of SQL queries, writing down the accompanying data structures and Lua, and thinking about the algorithm to translate between the two.

I'd like to write this in Rust, which I don't currently know. One reason for that is the [sqlparser-rs](https://github.com/sqlparser-rs/sqlparser-rs)crate, a battle tested SQL parser used in several production systems that implements that PostgreSQL dialect. The second is the [sqllogictest-rs](https://github.com/risinglightdb/sqllogictest-rs) crate, which helps you verify that your SQL implementation is correct. The third reason is that I want to learn Rust.

The fourth reason is that this query planning engine doesn't need to be separate hosted service, running in its own container, adding a network round trip with each query. It could and should be embedded in the application that connects directly to Redis, whether NodeJS, Python, or Go. Rust currently seems to be the best way to write some code that will be executed in multiple language engines, either via compilation to WASM or those language's C FFIs.

### Next Steps

I'm hoping to write enough of the implementation (simple selects with equality + greater than where clauses and joins, inserts, updates, and deletes) to be able to verify that it's possible, good, and performant. 

From there, I'd want to shop it around to companies I have in mind that could be interested in acquiring such a system, and see if there are some milestones we could achieve that would make them interested in doing so, and well as if they think there's significant value in the overall idea.

Based on the results of that, I'd want to open source it and see what kind of traction it can get.

Let me know if you're interested!
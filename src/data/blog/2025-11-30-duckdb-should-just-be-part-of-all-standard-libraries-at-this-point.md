---
author: Ben Packer
pubDatetime: 2025-11-30
modDatetime: 2025-11-30
title: DuckDB Should Just Be Part of All Standard Libraries At This Point
slug: /duckdb-should-be-part-of-stdlib
featured: true
draft: true
tags:
  - duckdb
description: Spare me `bun add @duckdb/node-api`
---
DuckDB is too useful. In addition to being a great data muncher, a great GIS platform, and universal way to connect to basically any database wire protocol or data lake format, it's just useful to integrate with regular code as a tool to use SQL - an incredible powerful query language - on your file system or anything else.

I'm working on a app that will let me use Claude Code with my voice, whether at home doing dishes or folding clothes or walking my dog. The Claude Agent Typescript SDK does not make parts of this easy - specifically key operations like listing previous sessions you can resume and the previous messages that occurred during them.

There's [some open issues](https://github.com/anthropics/claude-agent-sdk-typescript/issues/14) to make that easier, but they don't seem to be getting any attention at the moment.

I don't want to wait (and I also don't want to keep a parallel copy of Claude Code message history), so I'm looking into how Claude Code stores the data myself.

Inside `~/.claude/projects`, it looks like this:

```
$ ls ~/.claude/projects
-Users-benpacker
-Users-benpacker-project-one
-Users-benpacker-project-two
```

With a folder per place I have invoked Claude Code, normalized. The normalization looks to be just `cwd.toLowerCase().replace('/','-','g')`, but I'm not sure.

Inside these folders, there's lots of stuff - for example, this is inside my `gpfs` folder:
```
$ ls ~/.claude/projects/-Users-benpacker--gpfs/
15362fff-0481-4343-b7bf-c08926a5a6f5.jsonl	agent-4ddc241b.jsonl				agent-a38686b3.jsonl
agent-0e1f958b.jsonl				agent-512383ac.jsonl				de4cd454-aac2-47f5-a8e0-2eb2c189b41e.jsonl
agent-15129f31.jsonl				agent-72835895.jsonl				f629b63e-e7c8-4c27-a4e6-5500bd388b3a.jsonl
agent-1b601b75.jsonl				agent-9a121f6c.jsonl
```


There's three things that I want to figure out about the Claude Code project file structure.

First, I want to figure out which of these files represent distinct sessions and what the header of the session is.

Second, I want to figure out what I need to do to reconstruct the message history. 



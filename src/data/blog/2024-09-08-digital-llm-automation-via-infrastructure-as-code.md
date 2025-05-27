---
author: Ben Packer
pubDatetime: 2024-09-08
title: Digital LLM Automation via Infrastructure as Code
slug: digital-llm-automation-via-infrastructure-as-code
featured: false
draft: false
description: Reducing digital infrastructure automation to software engineering using text-based tooling
tags:
  - technical
  - llm
  - automation
  - infrastructure
  - collaboration
---

- I want my LLM to have expansive context when executing tasks
- LLMs understand text
- Function calls are bad:
	- No way to give it all the text
	- Not automated rollbacks, logging, observability, etc.
	- Merge conflicts
- If the way to automate our digital infrastructure is via text, we should be using all of the great tooling we already have around text, aka software engineering tooling, which is already the place that LLMs are exceeding the most
- Therefore, the road to general digital infrastructure automation is to reduce it to software engineering

The specific stack for this is something like Terraform, but multilingual, easier to author, and with a different approach to secrets.

Each resource:
- list resource
- write resource
- provider per provider type
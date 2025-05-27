---
author: Ben Packer
pubDatetime: 2023-09-05
title: Cooking with Graphs (Fine Tuning an LLM + Graph Semantic Analysis)
slug: cooking-with-graphs
featured: false
draft: false
description: A "What can I cook for dinner?" service using LLMs and graph databases
tags:
  - technical
  - llm
  - fine-tuning
  - graph-database
  - collaboration
---

> [!caution] I'm not interested in working on this anymore, but I'm leaving it up here in case you are!

I'm looking to get some experience building meaningful and useful applications with large language models, including:
- Prompt engineering
- Fine tuning open source LLMs
- A stronger sense of the pros and cons of vector similarity search vs. other forms of information retrieval or search
- Experience with the rough edges of extracting structured data and building semantic graphs with LLMs

The project I have in mind is a "What can I cook for dinner?" type service. It is an example of a structured decision-making and optimization application seeded with a relatively small amount of unstructured data.

Until recently, I think this type of thing was impossible to build, or at least impossible to build as just an individual or two.

### Translating Recipes to Cooklang

We'll start by translating a bunch (maybe 5-20k?) recipes into [Cooklang](https://cooklang.org/) using LLMs. I've already determined that GPT-4 can do this basically perfectly with few-shot prompting, but costs almost 10 cents per recipe translation (approaching more than $1k for running this on Wikibook's Recipes + NYT's recipe corpus). 

I've also found that GPT-3.5 Turbo can't really get this right. It can identify the ingredients, but I can't get it to:
- Successfully produce consistent line separated steps. It bunches multiple steps into a single line.
- Only annotate [the first appearance of each ingredient](https://cooklang.org/docs/best-practices/). It annotates every appearance, making Cooklang's ingredient extraction double count.

I think this task difficulty level (in between 3.5 and 4's few-shot prompting capabilities) makes it ideal for a fine-tuning experiment (why would you want to fine-tune if you could just use the very cheap 3.5) and we can use GPT-4 to generate a few hundred examples.

I think it's definitely likely that there may not be an open source base model sophisticated enough to be fine-tuned for this task (or one that can be fine-tuned with how much I'm willing to spend on GPU's for this project). Even if that's the case, I would consider that a successful outcome, since it would help me and others understand [how much of a moat](https://www.semianalysis.com/p/google-we-have-no-moat-and-neither) the big LLM players actually have. In that case, I'd probably just pay to do it with GPT-4, but have learned a bit more about the economics of GPT-4 vs fine-tuning.

### Constructing the Meal

I'd like a user to be able to let this service know:
- the ingredients they currently have in their fridge
- the overall vibe they want for the meal ("light summer spicy asian")
- any dietary restrictions

And for this service to pop out a meal of 3-4 dishes that:
- Make maximum use of ingredients already at home
- Match the overall vibe
- "Go well together"
- Match all dietary restrictions

For this, I want to test out a database I've read about called [Cozo](https://github.com/cozodb/cozo). It's multi-model, with vector similarity search and a "relational-graph" model that you can query with Datalog.

Cozo has a blog post describing how you can [construct layers of knowledge](https://docs.cozodb.org/en/latest/releases/v0.6.html) using their model. For this project, I think we have:
- **A recipe layer**: this layer has the actual text, Cooklang, and embeddings of the recipe.
- **An ingredient layer**: this layer maps relations between recipes and deduplicated ingredients and between ingredients and ingredients (for "go well together rules" and dietary restrictions like "kosher" or [traditional Chinese food pairing rules](https://www.farwestchina.com/blog/crazy-chinese-health-notice-answers/)
- Optionally, a **cookware layer** and **prep time** layer, so you can only get recipes that you can actually make with the equipment and time you have. I say optionally because I think the educational goals of this project are accomplished without this reach goal, but it does add some interesting problems, such as using LLMs to extract dependency and resource use charts from the recipes. Cooklang already encodes time durations but does not have a structured way to express either the total pre-specified prep time for a meal *or* information about which steps can be executed in parallel. We should be able to use LLMs to figure out **a)** which steps can be executed in parallel, and **b)** which steps occupy cookware such as oven space, rice cooker usage, etc. so that we can determine a total cross-recipe meal cook time via a Datalog query. Again, a stretch goal, but interesting since it is a very similar problem to any "ingest these unstructured documents and come up with an optimal plan using search algorithms problem", which to me seems to be an interesting problem that is impactful to solve.
- Other layers to add could include **price**, **nutrition**, or **seasonality/locality**. Lots of ways to take it.

Once those exist, I believe we can meal plan by doing a Graph search over recipes, and can experiment with weighting the embedding vector distance (for vibe match), ingredient distance from current inventory, and other factors until it produces good meals. We can also experiment with different ways to approach "going well together", such as balancing food groups, different cultural heuristics, or vector approaches.

### Deduplicating Ingredients

In order to get all of this to work, we need to deduplicate ingredients so that the ingredient layer only includes things you purchase at the grocery store and gets the interchangeability of ingredients correct.

For example, in looking at how recipes describe ingredients and how LLMs translate that to Cooklang, there is a wide variety of ways that ingredients get described. I've seen standard, stock chicken eggs described as "standard eggs", "chicken eggs", "large brown organic chicken eggs", or just plain "eggs". Sometimes cheese is described as "shredded cheddar", "a block of cheddar", or just "cheddar".

In order for our meal search queries to work, these duplicates need to be resolved. I believe GPT-3.5 can do this, or an open source LLM can. Vector embedding search alone may be able to, but I'm not sure it will correctly infer that "organic brown eggs" is actually the same as "chicken egg", and not "organic quail egg" or "organic brown duck egg". This seems to be the type of "common sense" that LLMs do well, and so we could potentially present some raw ingredients from an embedding similarity search for an LLM to choose from.

### After It's Done

Once it's done I'd like to:
- Briefly see if Buzzfeed, Bon Appetit, NYT Cooking, or another similar property want to buy it and integrate it (I want to send 10 emails, wait 2 weeks, and then give up).
- Write 1-4 blog posts about our learnings and how we accomplished things.
- Open source it (if no one wants to buy it, of course).

Please let me know if this interests you!
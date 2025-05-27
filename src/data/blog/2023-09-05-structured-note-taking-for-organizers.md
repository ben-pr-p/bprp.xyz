---
author: Ben Packer
pubDatetime: 2023-09-05
title: Structured Note Taking for Organizers
slug: structured-note-taking-for-organizers
featured: true
draft: false
description: Making it easy to extract meaningful structured data from organizing conversations without burdening organizers
tags:
  - organizing
  - llm
  - productivity
  - seeking-collaborators
---

# Higher Ground RFP

This project was submitted to [Higher Ground's AI RFP](https://highergroundlabs.com/ai-lab-rfp/).  I've included most of the text part of the proposal below as a way of summarizing the project for a general audience. 

As a result, it's a bit more "pitch-ey" than how I usually write things, so just keep that in mind.

## Low Fidelity Mockups

**There are 3 panels here – you can tab within this Excalidraw to see them.**

<iframe src="https://link.excalidraw.com/p/readonly/GjFfOpwEYMqQNELbSlq7" width="100%" height="500px" style="border: none;"></iframe>


## One Paragraph Executive Summary

Please include a short description of the problem you're trying to solve, the team you have assembled (or will assemble) to solve it, and your high-level thoughts as to how AI can solve the problem. 

In a variety of context-ful organizing work – whether workplace and tenant organizing to an electoral campaign or building towards institutional endorsements – there is no easy answer to note-taking and assessments. You can choose to capture very little information (a score of 1-5) – only useful for the highest level of tracking – or create extensive surveys that your organizers won't fill out, instead choosing to use the Notes app on their phone, a Google Doc they hide from you, or worse, nothing at all. The latest AI tools can solve this problem by continually extracting and linking organizationally-defined structured data from the formats most useful and least effortful to organizers on the ground: free form notes, audio recordings, or WhatsApp chat logs. We are a group of software engineers and operators with experience in organizing and building software for organizers that are ready to solve the structured data dilemma.

## Describe the problem you're trying to solve

Our goal is to make it easy to extract meaningful and accurate structured data from organizing conversations, interviews, and other data sources, without putting a burden on organizers or simplifying the data so much that it's no longer useful.

Structured data plays a key role in all organizing efforts of even medium scale, forming the basis for evaluating progress and re-evaluating who to talk to and when. However, busy organizers hate filling out form after form to record it, especially when the data they need to follow-up – unstructured data such as notes or prior text conversations – is already on their phone. This is especially pronounced in structure based organizing and power mapping for pressure campaigns, each of which require keeping command of a rich web of relationships that no post-conversation survey can capture.

As a result, the state of data accuracy in many high touch organizing projects is abysmal, and all of the benefits of properly sharing and organizing data, such as facilitating easy handoffs between organizers, sharing and comparing notes, and ensuring timely and appropriate follow-up, fall by the wayside. 
## How will you use AI to solve this problem?

AI can solve this problem by continually performing structured data extraction on top of the unstructured data organizers generate. We can send a list of entities, attributes, and relationships to extract alongside a user's inputted text in a document to a LLM and get back a structured entity-attribute-relationship JSON document. For audio data, we can use Whisper or other speech recognition software to generate a transcript that is then sent to the LLM, and for visual data such as handwritten notes or screenshots of text conversations, we can use OCR technology or the upcoming GPT-4V. 

These AI technologies will be embedded and provide live feedback to users in a Notion / Google Docs like note taking experience so that users can see the data being extracted (and highlighted in their documents) in real time. As that occurs, users will have the opportunity to confirm, reject, or modify the inferred data, so that organizers maintain a high level of confidence in the inferences.

Additionally, we can create integrations with common CRMs such that entities and attributes can be synced and referenced inside of our software.

# Building It

I am making good progress on a prototype built with these technologies, but would love collaborators or people who would want to test it out! 

I will put up a repo soon - probably once I get the basics of fact extraction done.

My current progress is:
- [x] Authentication and application scaffolding
- [x] Pages to configure entities, entity attributes, and relationships
- [ ] Basic document editing experience
- [ ] Fact extraction based on the configured ontology
- [ ] Querying entities based on attributes
- [ ] Querying entities based on relationships
- [ ] Graph navigation of entities and their relationships
- [ ] Audio processing

I'm planning on using [BlockNote](https://www.blocknotejs.org/) for the core editing experience and GPT-3.5 (in initial experiments it's good enough, especially with the new JSON output restrictions) for entity/attribute/relationship extraction. Making it work with 3.5 is also key for a low latency feedback experience.
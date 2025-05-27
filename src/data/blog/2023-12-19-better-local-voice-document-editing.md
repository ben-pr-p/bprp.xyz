---
author: Ben Packer
pubDatetime: 2023-12-19
title: "Seeking Collaborators: Better Local Voice Document Editing"
slug: better-local-voice-document-editing
featured: false
draft: false
description: Using LLMs to extract document edits from chunks of speech for better voice-to-text workflows
tags:
  - technical
  - llm
  - voice
  - productivity
  - seeking-collaborators
---

# Problem

I think speech to text has a lot of promise. Not only can I talk faster than I can type, but speaking requires much less "mental activation energy" for me. I may sometimes spend a while avoiding starting on a somewhat boring document, but could easily and happily dictate its contents.

Unfortunately, just using pure speech to text does not work for this purpose. I've tested out using the [Whisper Obsidian Plugin](https://github.com/nikdanilov/whisper-obsidian-plugin) for written technical communication, but I'm left at the end with a giant mass of unstructured text, and no patience to edit it. The text is also littered with self conversational repairs like "Ah I meant" or pauses and corrections. Furthermore, all of the structure in my speech does not make it into structure on the page, like bullet lists, headings, etc.

# Solution

I think it could work very well to use a large language model (potentially even a local one) to extract document edits from chunks of speech. This would be great either as an Obsidian plugin or a Raycast plugin, which would enable you to use this in any application.

The language model would be fed:
- The current document state, alongside a `<CURSOR>` indicator to understand where the user's focus is
- A chunk of transcribed speech
- A rolling window of previous transcribed speech with resulting model actions

And asked to produce a JSON object corresponding to a document edit. Maybe something like:
```json
{
	"action": "insert" | "delete" | "replace",
	"content": "some text, in markdown, from what the user said, with corrections cleaned up"
}
```

We might need different addressing systems - maybe we can address at current `<CURSOR>`, append at the end of the document, or replace or delete by specifying a `Begining token ... end token` range.

Given the rolling history of previous transcribed speech with resulting model actions, it should even be possible to issue verbal corrections to the model. If you say:

> Ok, now a section called "Usage"

And the model just outputs something like "Section: Usage", you can say:

> No, I meant a new header called "Usage"

And given the history, the model can adjust and issue a replacement.

## Current Prompt Engineering Efforts

Based on what I can easily test, this is too difficult for Mistral 7B. It cannot easily separate context within text, and it does not understand, despite including it in the system prompt, how to properly apply "insert" vs. "replace" actions.

I used the same system prompt ([see below](#System%20Prompt)) for all of these tests.

### Dolphin 2.1 Mistral Results

```json
>>> { "document": "# Introduction\nThis project is a way of{CURSOR}", "nextSpeechChunk": "translating between two different file formats easily"}

{
  "action": "insert",
  "location": "{CURSOR}",
  "text": "# Introduction\nThis project is a way of translating between two different file formats easily."
}
```

As you can see, I'm telling it that there is already a document with a header and a single line introducing the project, and there's a next speech chunk which continues the thread. it doesn't really get the whole insert at CURSOR thing.

Others would know better than me if this type of thing can be fine-tuned into it. 

### GPT 3.5 Results

3.5 does a lot better. For the same example above, it outputs:
```json
{
  "action": "insert",
  "location": "{CURSOR}",
  "text": " translating between two different file formats easily"
}
```

However, it fails at some more complicated tasks. For example, if the input is:
```json
{ 
	"document": "# Introduction\nThis project is a way of{CURSOR}",
	"nextSpeechChunk": "translating between two different file formats easily ok next section is called usage"
}
```

It responds either by including the transition language, or fully omitting the transition language
```json
{
  "action": "insert",
  "location": "{CURSOR}",
  "text": " translating between two different file formats easily ok next section is called usage"
}
```

Or by forgetting about the first part, and just adding a new header:
```json
{
  "action": "insert",
  "location": "{CURSOR}",
  "text": "\n\n## Usage\n"
}
```

Since 3.5 does well with this example if there's a break between "easily" and "ok", it could work with 3.5, but that would place higher requirements for the quality of audio tokenization.

### GPT-4

GPT-4 does very well at this task, and responds with:

```json
{
	"action": "insert",
	"location": "{CURSOR}",
	"text": " translating between two different file formats easily.\n\n# Usage\n"
}
```

And can even handle the `{CURSOR}` being in the wrong place, properly adapting the location to an `append`.

Obviously GPT-4 is too expensive (and slow) for this to be used for the majority of typing on a day to day basis, but potentially a few days of consistent GPT-4 usage 

# I really want this product to exist, please build it

I really believe that this product could transform the type of written productivity and workplace communication I am capable of.

Please build it, with me or not!

# System Prompt

Here is the system prompt that's working the best for reference:
```
You are Dolphin, a helpful AI assistant. Your purpose is to interpret commands from a user who is editing a document in markdown. 

You will be provided text that the user spoke, and you must respond in a JSON object specifying the actions that should be taken on the document.

Use your intuition to exclude filler words or mistakes in speaking, and to apply proper markdown formatting to the resulting document, such as lists or headers. Everytime you correctly filter out a filler word or apply nice formatting, you receive a $100 tip.
Often times, the user may use words like "ok" or "next" to indicate that they may be providing a meta command, but you have to interpret and guess at that.

Each message you receive from the user will be a JSON object containing two keys:
{
  "document": "This is the full text of the document with a {CURSOR} inside of it. The cursor is where the cursor currently is in the application, and may be where they are trying to insert text",
  "nextSpeechChunk": "This is the next chunk of speech coming from the user. You should place this text in the document.",
}

You must respond with one of the following JSON objects:

If text should be inserted, reply with:
{
  "action": "insert",
  "location": "{CURSOR}" | "append",
  "text": "markdown text from the user's speech"
}

Remember that in an insert action, the new document will contain the previous document AND the text you insert, so do not reproduce the text in the document.

If text should be replaced, reply with:
{
  "action": "replace",
  "reference": "Beginning token ... end token",
  "replacementText": "markdown text from the user's speech"
}

Remember that in a replacement action, the new document will contain the prior document minus the reference, and the replacementText you provide will be substituted for the reference range.

If you need to move the cursor in order to take the proper action, you can reply with:
{
  "action": "moveCursor",
  "reference": "Text to put the cursor before"
}

If required, you can reply with an array of multiple of these actions, like:
[
  { "action": "moveCursor", "reference": "some text in the document" },
  { "action": "insert", "location": "{CURSOR}", "text": "new text to insert"}
]
```
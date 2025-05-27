---
permalink: things-ive-tried
publish: true
---
I've seen [failure resumes](https://www.nytimes.com/2019/02/03/smarter-living/failure-resume.html) on some [other people's blogs](https://www.katmh.com/fail), and generally liked it! This page is similar, but instead of a list of my failures, it's a list and description of things I've tried. 

Some of these were definitely failures, but some of them I just sort of stopped trying to do. For some, that was the right decision!

## Senior Fellowship Project on Online Deliberation

Leading up to my senior year at Dartmouth, I proposed a "senior fellowship", which is a special type of project where a senior exclusively does research in lieu of classes their senior year.


This was 2016, and the narrative around the internet as an inevitably liberatory phenomena was just beginning to fall apart.

After researching most of the research in the field of "Online Deliberation", I proposed a series of experiments to examine the relationship between the structure of an online platform and the types of discourse it produces. To my knowledge, no experimental and systematic research with the goal of extracting generalized insights has been done on this to date.

My proposal was rejected. The reasons provided were that:
1. The amount of software engineering work required to run the experiments was not possible by me within the year. This one maybe have been true. I did need to create a hyper configurable discussion platform quite quickly.
2. My proposal for generating data of soliciting recruits via Amazon Turk to discuss their working conditions on Amazon Turk was suspect and there was debate over its experimental validity. I think this one probably wasn't valid, and there would have been ways to work around it.

Reasons not provided were:
1. My grades were only okay and varied widely depending on whether I clicked with a class.
2. I had created some problems for the school with student activism and a joke run for class president and wasn't a student they'd be excited to highlight.

The full original proposal is below, if you're curious! If you're a researcher in Online Deliberation or a student, you should go for it!

[[__site/Attachments/proposal.pdf|proposal]]

## Large Scale Social Media Salience Research

I attempted to work with a linguistics professor on a large project on *salience* in online communication, but was never quite able to get it off the ground.

*Salience* is a concept in the "Discourse Analysis" sub-discipline of linguistics that focuses on questions related to the recency of topics, nouns, and ideas, and how that affects the way we speak. Topics include how new referents are introduced, how discussing those things changes once they are salient, etc.

There are a variety of things known in this field about salience in English and other languages. 

My plan was to do extensive crawling of online text, mostly Reddit, and test how salience worked in these spaces and how it changed over time. Technically, I was planning on looking at related clusters of [tf-idf](https://en.wikipedia.org/wiki/Tf%E2%80%93idf) change over time.

The project failed because it was just too much and I lost interest and motivation after the initial stages of crawling and indexing took too to execute. I think I was:
1. A bit too ambitious: if I known how much work this involved, I would have focused just the method (clusters of tf-idf change over time as an approach to corpus salience) and tried to accomplish it on an existing data set.
2. Not enough technical experience: although I was a competent programmer at this time, I didn't know enough about different technologies in order to make good decisions about what to use here. I also wasn't sure how much I needed to re-invent myself and how much I could use off the shelf things.

I also was a little bit sad at the time in general :(

I'm not familiar with whether this would still be novel research in the year 2023. Maybe you are, and maybe someone has done this now!

## assemble.live: online meetings

For my college thesis I attempted to develop a platform for synchronous many-to-many communication online, where you walked around as a little blob by clicking where you wanted to go.

On top of that movement was an audio layer where as two blobs moved closer together you could hear each other better and as they moved far apart you lost the ability to hear.

My practical goal was to enable easy online **assemblies** - I was pretty anarchist inflected at the time and I thought assemblies were awesome. I was planning on building a bunch of Occupy-style voting features that you could attach to your avatar and other fun stuff. I also implemented a higher order React library that you could use to easily implement shared state via WebRTC.

My research goal was to prove some foundational platform requirements for **conversational schisms**, which is just a fancy word for when one conversation of 4 or more participants becomes 2 conversations because a sub-conversation gets broken off. We've all experienced this at dinner parties or walk around parties, and the different types of awkward situations produced at the creation and dissolution of a sub-conversation.

Overall, this project was somewhat of a success: I built a working prototype.

However, if more than 6 people joined at once, all of their browser tabes would freeze and then crash. This was because I implemented it as a full mesh network topology with no compression, and 6 concurrent audio streams provided to be about the max that 2017 Chrome's WebRTC implementation could handle.

In order to move past this, I would have needed to introduce server side audio mixing. At the time (2017), there was no easy way to implement this in a language I knew, and out of the box solutions did overall audio mixing (combining all streams) instead of what I needed (creating a new customized stream per recipient based on the distance between the speakers in virtual space). 

Now (2023), I could potentially implement a mixing solution based on [Node's WebRTC](https://github.com/node-webrtc/node-webrtc) or Elixir's [Membrane Framework](https://membrane.stream/), but that didn't exist back then, so I didn't try to move past this.

A few years later as the pandemic started, in 2020, I thought about picking it back up, but other solutions had been developed, including:
- https://gather.town/
- https://www.kumospace.com/
- https://www.topia.com/
And more.

Here is the Github for the project: https://github.com/ben-pr-p/assemble-online

And below, attached, is my thesis write up which discusses schisms and what experiments I was able to have on the platform.

[[__site/Attachments/Main Thesis.pdf|Main Thesis]]

## Grad School in Systems

See [[Previous Research Question]].

## Rewired

TODO :) 

## More to Come

I'm adding to this doc over time! I have like 3 more interesting things to put here.
- OSDI Proxy
- Efforts on Bernie 2020
- Rewired
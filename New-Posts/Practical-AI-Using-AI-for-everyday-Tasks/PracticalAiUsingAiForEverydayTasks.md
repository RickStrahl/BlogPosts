---
title: 'Practical AI: Using AI for everyday Tasks'
abstract: 
keywords: 
categories: 
weblogName: Web Connection Weblog
postId: 
postDate: 2024-10-12T20:54:22.1034246-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Practical App AI Integration: Using AI for everyday Tasks
We've all heard about the promise of AI and how it's going to change the world. That may well be the case - eventually, but in the meantime there are some highly practical uses that you can add to applications that you may not think about as your typical AI task.

I recently added a number of features to Markdown Monster which is a Markdown editor. No, it's not text completions although that would be nice - but that's more than I can chew at the moment (there are complex issues of AI performance, and update speed and editor interactions). No, I'm talking about some much more simple scenarios.
  
Specifically, I added a few interactive features:

* Text Summary
* Text Language Translation
* Grammar Checking

IOW, these are useful editor operations that fit the application without trying to come up with some imagined use case :smile:

In this post I'll discuss these use cases along with my integration strategy which involves using a custom created OpenAI client (more on the reasons for this in a minute).

## AI Integration Basics
If you've used a Chat AI interface like ChatGPT or CoPilot you probably have an idea how AI works.

### Response Variability
When you integrate AI into an applications, it's not like calling an API or fixed interface where you get a fixed response for a given input. When you compose a question or 'prompt' to the AI it then attempts to provide an answer to you. If spent any time with any AI engine you've probably found out that responses that come back are non-deterministic, meaning that in most cases even providing the exact same prompt is likely to produce a slightly or sometimes wildly different result.

Weird as that sounds that may actually be a good thing. For example, when you're translating text from one language to another your first result may produce a very literal translation that's very stiff and boring. Re-running on the other hand might provide a more lively, more colloquial translation. There are options on AI engines that allow you to tweak how operations are performance from more precise, to more adventurous with the default that you typically see in Chat interfaces sitting in the middle.

Long story short when you build code that depends on AI, you typically want to allow for re-running prompts to allow to capture some of that variance or at minimum to try again for better results. This is a large part of what prompt engineering is about, except in your application integrations it's likely more of a retry in the *"Better Luck Next Time" vein. :smile:

### Online LLMs and Local SLMs and Configuration
If you plan to integrate AI you have to figure how you will allow your users to access the AI engine. If you plan to use online AI engines you run into the problem who pays for the online service - are AI services provided as part of your application, or do you ask users to bring their own API key. If you're using the latter you need to provide UI to allow users to choose their provider and provide configuration.

This is not as simple as it sounds especially if you want to support multiple providers.



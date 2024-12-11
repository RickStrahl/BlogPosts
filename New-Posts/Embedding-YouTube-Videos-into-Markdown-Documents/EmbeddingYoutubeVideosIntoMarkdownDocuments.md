---
title: Embedding YouTube Videos into Markdown Documents
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2024-11-30T22:31:40.5920654-10:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Embedding YouTube Videos into Markdown Documents

Surprisingly embedding YouTube videos into Markdown can be surprisingly unintuitive depending on what the Markdown rendering platform supports.

There are a number of ways you can embed YouTube videos and in this post I'll discuss the following three ways:

* **YouTube Player embedding**
* **YouTube Image Preview plus Link**  
* **Capture YouTube Preview plus link**

## The YouTube Embeddable Player
YouTube has an official way to embed the YouTube player into HTML. You can access this from YouTube's ShareButton and use the Embed link. This produces a bit of HTML that you can directly paste into your Website and... your Markdown text.

*** IMAGE HERE*** 

The HTML that YouTube provides looks like this:

```html
<iframe></iframe>
````

This is meant for pasting into HTML content, but it also works in Markdown since Markdown by default supports embedded HTML content.

This is great...  as long as you can use it! 

The problem with this is that many Markdown hosting platforms don't allow for extensive HTML embedding and even those that do often don't allow for `<iframe>` embedding since it poses a big cross-site scripting security issue. 

GitHub which arguably is the most widely used Markdown platform **does not support `<iframe>` embedding** (or most HTML embedding for that matter) and so you can't embed the YouTube player directly.




---
title: The Trials and Tributes of Local Html Rendering
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2025-11-16T12:15:12.5466972-10:00
postStatus: publish
dontInferFeaturedImage: false
stripH1Header: true
---
# The Trials and Tributes of Local Html Rendering

As most of you probably know I have an offline application in Markdown Monster that heavily depends on a local Html previewer that can live display Html from the Markdown that you're writing in the editor. At first glance that's a pretty easy proposition - render the Markdown to a file and render the file.

But - if you do this generically as Markdown Monster you need to account for files opened in any location on a local or network drive, and the Markdown may be referencing other related resources, both relatively or absolutely linked.

## 
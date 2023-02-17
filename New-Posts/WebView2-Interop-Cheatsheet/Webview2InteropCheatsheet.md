---
title: WebView2 .NET Interop Cheatsheet
abstract: 
keywords: 
categories: 
weblogName: Web Connection Weblog
postId: 
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# WebView2 .NET Interop Cheatsheet

![](InteropateBanner.jpg)

Interop for the Microsoft WebView2 control using the newish Edge Chromium engine is a fickle thing. There are specific rules on what you can and can't do and how data is passed between .NET and JavaScript and back. And if you get it wrong - well, there's hell to pay in the form of unexpected and often highly inconsistent errors.

Interop from JavaScript to .NET in particular has a number of issues and concerns that you have to be aware of and in this post I'll try to summarize some of these issues. A lot has changed as well from early releases, including one crucial issue which is async support for calling from JavaScript into .NET which originally was not supported and was the cause of a myriad of hanging and crashing issues. I'll get into that in this post.

This post is mostly for my own sanity and summarizing a few years of working and struggling with Interop in the WebView mostly through the work I've been doing in [Markdown Monster](https://markdownmonster.west-wind.com/) and [West Wind WebSurge](https://websurge.west-wind.com/) both of which make heavy use of the WebBrowser control. Markdown Monster in particular, juggles multiple simultaneously active and interactive WebViews with a lot of two-way communication between .NET and Javascript.

## Summarizing work with the WebView
I will say this: The WebView has been a blessing and a curse and it's been a wild ride working with it for the last 2 years. From the initial requirement that forced my large application to become mostly async as all interaction with the WebView via Interop requires async calls to struggling with missing async callback features in JavaScript that forced hacky workarounds that were eventually broken when async support was finally - after several years - was implemented.

I'm writing this post now, because I want to talk about what I've learned and hopefully pass on some of these hard lessons on to others so that they can bypass some of the trial and error and issues.

## Interop in the WebView
The WebView has a few different ways to interop, but I'm only going to focus on using:

* `ExecuteScriptAsync()` for calling into JavaScript code
* .NET Host Objects passed into JavaScript to call back into .NET

These two mechanisms allow for RPC like calls to be made in both directions into JavaScript from .NET and into .NET from JavaScript. Both require some fixup work to pass data back and forth to be effective, and I'll also cover approaches to facilitate that process.


> Another mechanism available is `PostMessage()` and `ReceiveMessage()` which is a purely async message driven approach that I haven't found useful for my needs. This approach can simulate what you otherwise might use WebSockets for or to implement an event driven interface. I don't cover that in this post.

## WebView Initialization
One of the trickiest things that I've found with the WebView control is initialization. If you're simply using the WebView for display purposes and all you do is set the `Source` property for display a document in the browser, you don't need to worry about initialization. 

However, if you plan on going to interact with the control and need to control startup, set custom environment settings, potentially set a folder domain mapping or you simply need to delay interacting with the browser until the control is ready, you will have to deal with Web View intialization.

The initialization process consists of:

* Assigning a WebBrowser environment (a folder with settings basically)
* Waiting for the Control to become availalbe (EnsureWebViewInitia)

The important point of this is the following:

> The WebView control initializes **asynchronously** and it will not actually finish initialization until the control has become visible.


## .NET to JavaScript
This type of interaction is actually pretty straight forward to do. It utilizes `ExecScriptAsync()` to make `async` calls into JavaScript code:

* Requires that the document has loaded
* All calls are `async`
* If calling functions with parameters, they have to be codified as strings



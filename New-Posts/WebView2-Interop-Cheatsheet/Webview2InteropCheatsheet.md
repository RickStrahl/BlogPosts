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

## WebView Interop Changes
Interop from JavaScript to .NET in particular has a number of issues and concerns that you have to be aware of and in this post I'll try to summarize some of these issues. A lot has changed as well from early releases, including one crucial issue which is - finally - proper async support for calling from JavaScript into .NET, which originally was not supported and was the cause of a myriad of threading/dispatcher mismatch and crash issues for me. I'll get into that in this post. That's been fixed, but in the process of changing existing code that worked around the limitations in many cases no longer worked and started hanging up.

This post is mostly for my own sanity and summarizing a few years of working and struggling with Interop in the WebView mostly through the work I've been doing in [Markdown Monster](https://markdownmonster.west-wind.com/) and [West Wind WebSurge](https://websurge.west-wind.com/) both of which make heavy use of the WebBrowser control. Markdown Monster in particular, juggles multiple simultaneously active and interactive WebViews with a lot of two-way communication between .NET and Javascript. 

The good news is that it's quite possible to build complex interactions between .NET and JavaScript, even if the path to get there is not always as straight forward as one would think. I hope this post will help make getting there a little easier.

I will say this: The WebView has been a blessing and a curse and it's been a wild ride working with it for the last 2 years. From the initial requirement that forced my large application to become mostly async as all interaction with the WebView via Interop requires async calls to struggling with missing async callback features in JavaScript that forced hacky workarounds that were eventually broken when async support was finally - after several years - was implemented.

I'm writing this post now, because I want to talk about what I've learned and hopefully pass on some of these hard lessons on to others so that they can bypass some of the trial and error and issues.

## In this Article: ExecuteScript and Host Objects Interop in the WebView
The WebView has a few different ways to interop, but I'm only going to focus on using the following:

* `ExecuteScriptAsync()` for calling into JavaScript code from .NET
* .NET Host Objects passed into JavaScript to call into .NET from JavaScript

These two mechanisms allow for two-way RPC like calls to be made in both directions into JavaScript from .NET and into .NET from JavaScript. Both require some fix-up work to pass data back and forth, as there is no native data structure marshaling beyond simple types. All data is passed by value, and complex data has to be passed as strings, most likely as JSON. I'll cover some helpers that make this easier, specifically for calling into JavaScript from .NET by providing a Reflection like wrapper to call JavaScript code that handles data serialization of parameters.

> Another mechanism available is `PostMessage()` and `ReceiveMessage()` which is a purely async message driven approach that I haven't found useful for my needs. This approach can simulate what you otherwise might use WebSockets for or to implement an event driven interface. I don't cover that in this post.

## WebView Initialization for Interop
If you're not planning on interacting with the WebView control by calling into JavaScript code or having JS call you back, most of what I discuss here doesn't apply. If all you do is display a Web page, you can just set the `WebBrowser.Source` property and be on your way.

If however you interact with the WebView you likely need to pass data into the control in which case you'll be making `ExecScript()` calls into the control. If you do you need to ensure that the control is ready and has loaded, and properly initialized. It's quite common that Interop applications, need to push data into the control as the page starts up. For example, in Web Monitor I need to load a document into the editor as soon as the document is ready. In order to do that you need to watch for WebView's internal document loaded event which in turn can't fire until the control has initialized its environment and completed loading the HTML for the document.

One of the trickiest things that I've found with the WebView control is the timing of this initialization because the initialization phase is completely async.

The initialization process consists of:

* Assigning a WebBrowser environment (a folder with settings basically)
* Waiting for the Control to become available (EnsureWebViewInitialized)

and then a few optional operations that are common for Interop:

* Hooking up any events on the `CoreWebView2` object for browser events *(optional)*
* Passing a .NET Host Object into .NET (if you want to be able to call back into .NET) *(optional)*
* Setting a virtual domain name *(optional)*

There are several important issues around initialization:

> #### @icon-warning Asynchronous WebView Initialization
> The WebView control initializes **asynchronously** meaning you can't wait for initialization to complete other than capturing an event or `await` the `EnsureWebViewInitialized()` call.

> #### @icon-warning WebView Visibility: An invisible control does not load until it becomes visible
> The WebView control will not actually initially and complete `await EnsureWebViewInitialized()` **until the control, or the parent hierarchy that displays the control becomes visible**. 
> For example, in Markdown Monster I load all documents on startup into individual tabs. However, the WebBrowser doesn't actually load any of these documents **until the tab is activated and becomes visible**. This has both benefits - better load performance for the actual active document - and problems - you can't assume the other documents have loaded and can be manipulated.

> #### @icon-warning InitializeAsync() behavior has to execute in a proper Task context
> It's also vitally important that the async context you execute the initialization in accurately reflects the .NET UI context. An `async void` event handler or constructor fired `_ = InitializeAsync()` call will eventually end up hanging randomly. You need to run off a `Dispatcher.InvokeAsync()` (in WPF) or similar in order for it to reliably work. Using non-async caller invocation can result in random lockups.



#### An Initialization Example

###


## .NET to JavaScript
This type of interaction is actually pretty straight forward to do. It utilizes `ExecScriptAsync()` to make `async` calls into JavaScript code:

* Requires that the document has loaded
* All calls are `async`
* If calling functions with parameters, they have to be codified as strings



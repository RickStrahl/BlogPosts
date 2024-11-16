---
title: 'WebView2: Waiting for Document Loaded without Events'
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2024-07-23T11:37:00.9281763-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# WebView2: Waiting for Document Loaded without Events
When building hybrid Web applications where .NET code interacts with WebView HTML content, one of the biggest sticking points often is the event based disconnect between loading a document and then having to wait for the document to load and **then** starting to interact with the document via script code.

It's easy to use the WebView control and **just display** a Url, but as soon as you need to interact with the document you're thrown into a whole world of various async events that need to fire in order to assure that:

* The WebBrowser control has initialized
* The document has completed loading

If you need to interact with the document you likely want to implement aa `async Task InitializeAsync()` method that handles setting up a WebView environment, calling `await EnsureCoreWebView2Async()` and then hooking up the `CoreWebView2.DOMContentLoaded` event to actually perform operations on the document like running `ExecuteScriptAsync()` calls.

At minimum - if you don't explicitly initialize the WebView control - you'll want to hook the content loaded event:

```cs
WebBrowser.CoreWebView2.DOMContentLoaded += OnDomContentLoaded;
```

and you then implement a handler that waits for the document completion. 

```csharp
protected virtual async void OnDomContentLoaded(object sender, CoreWebView2DOMContentLoadedEventArgs e)
{
    // do something to interact with the document or call into script code
    await WebBrowser.ExecuteScriptAsync("window.initializeInterop()");
}
```

While that works, it can be cumbersome because you have to make sure that the state of the original code is also available in the event handler when the intent in most of the cases is to simply load a document and assign some content or logic.

## WaitOnDocumentLoaded() for linear Code Flow
To make this a little easier, I've taken to implementing a helper as part of my `WebViewHandler` class that has an async `WaitFormDocumentLoaded()` method that can optionally wait 

In many situations it's preferrable to do something more along the lines of:


```csharp
private async void EmojiWindow_Loaded(object sender, RoutedEventArgs e)
{
    if (!await WebViewHandler.WaitForDocumentLoaded(5000))
    {
        MessageBox.Show("Document load failed.");
        return;
    }
    
    // do something to kick off interaction with the document
    await WebBrowser.ExecuteScriptAsync("alert('Waited for load!')");
}
```

## Implementation
So how does this work? 

Personally I use a reusable WebView wrapper component that handles a number of convenient tasks on the WebView, including the ability to wait for document loading in a more procedural way that for many scenarios is much easier to work with than the event/function based approach.


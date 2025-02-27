---
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
# WebView2: Waiting for Document Loaded

![Is It Ready Yet](IsItReadyYet.png)

When building hybrid Web applications where .NET code interacts with WebView HTML content, one of the biggest sticking points often is the event based disconnect between loading a document and then having to wait for the document to load and **then** starting to interact with the document via script code.

However, to achieve a more seamless experience, it's crucial to implement event handlers that can detect when the document is fully loaded. By subscribing to events like `NavigationCompleted` or `DOMContentLoaded`, developers can ensure that their scripts execute only after the content is ready. This approach not only enhances performance but also reduces errors that arise from attempting to manipulate the DOM prematurely.

It's easy to use the WebView control and **just display** a Url where you are essentially letting the browser complete the page load asynchronously in the background. Take something even as simple as the following when you want to preload some content into the HTML document:

```cs
WebView.Source = "http://localhost:5200/MyPage"

await WebView.ExecuteAsync("alert('Document has loaded.')");
```

Yeah, dumb example, but you get the idea of what this tries to accomplish: Load a page and pop up an alert box over it when it loads.

But - the above code, simplistic as it is,  doesn't work, because the script is executed **before the page has completed loading**. That code **will fail**!

It's not very difficult to make this work but it takes a little bit of knowledge about the WebView and how it works and you have to implement events in order to make this work. Here's a rough outline of the code you'd need to make the above code actually work:


```cs
string envPath = Path.Combine(Path.GetTempPath(), "WpfSample_WebView");
var environment = await CoreWebView2Environment.CreateAsync(envPath);
await webBrowser.EnsureCoreWebView2Async(environment);

WebView.Source = "http://localhost:5200/MyPage"

WebBrowser.CoreWebView2.DOMContentLoaded += async (s, args) => {
    await WebView.ExecuteAsync("alert('Document has loaded.')");
}
```

> Setting up an environment is optional but **highly recommended**! You'll want to make sure you explicitly specify a WebView Environment folder, because by default that folder is created in a folder off the startup root. In installed applications that folder is often non-writable and that will cause application failures while working in development. More on this in a minute.

This code is a bit verbose and not easy to remember off the top of your head. Additionally the flow is async and it routes into a single Event handler for `DomContentLoaded()` - if you have many documents and operations that occur you're going to have to differentiate between them as part of the event handler code (ie. if `arg.Url.Contains()` checks or similar).

It's not exactly straight forward especially for simple requests.

## Making this easier with WebView2Handler.WaitForDocumentLoaded()
The Westwind.WebView component is a behavior class that attaches to a WebView control and provides a number of useful enhancements that are aimed at making using the control easier.

It has many useful features:

* Smart automatic (but optional) Environment Creation
* Shared Environment for multiple controls
* JavaScript Interop component
    * Easy function invocation with parameter encoding
    * Easy access to variables and properties
* Various different Navigation modes including force refresh
* Simple helper `WaitForDocumentLoaded()`

## WaitForDocumentLoaded()
The pertinent one for this post is `WaitForDocumentLoaded()` which lets you wait for the document to be ready to be accessed so you can interact with it via script code. As the name suggests this is an async method that waits for the document to be ready and it has an optional timeout that you can specify to abort if for some reason the page fails to load.

The other advantage is that you async linear code to write your logic. Navigate -> Wait -> Process that makes it much easier to create multiple operations in a linear code manner, as opposed to the having a single event that has to figure out its own page routing.

To use this, first import the Westwind.WebView package into your project:

```ps
dotnet add package Westwind.WebView
```

Then to use it you add a property to your form or control that hosts the WebView control and pass in the WebView control:


```cs
// Window or  Control level Property
public WebViewHandler WebViewHandler {get; set; }

// Window/Control ctor - do this early on so the WebView is read ASAP
WebViewHandler = new WebViewHandler(WebView);
```

Then when you're ready to navigate - in your `Load()` handler or a button click:

```cs
// Note: Handler Method has to be async!
private async void EmojiWindow_Loaded(object sender, RoutedEventArgs e)
{
    // here or immediately after instantiation of WVH
   WebViewHandler.Navigate("http://localhost:5200/MyPage");
   
   await WebViewHandler.WaitForDocumentLoaded(5000));
   await WebBrowser.ExecuteScriptAsync("alert('You have arrived')");
}
```

Note that you can also use the built-in JavaScript Interop helper that allows to call methods on a specified 'base' object - `window` by default. So instead of:

```cs
await WebBrowser.ExecuteScriptAsync("alert('You have arrived')");
```

you could use:

```cs
await WebViewHandler.JsInterop.Invoke("alert","You have arrived");
```

The JS Interop object automatically encodes parameters and their types so that they are safe to call Javascript code. You can also subclass the `BaseJavaScriptInterop` class and add custom methods that wrap any JS calls that you make for easier isolation of the the Interop code.

There are lots of use cases for the WebViewHandler and you can [find out more on the Github page](https://github.com/RickStrahl/Westwind.WebView).

## How does it work?




This gives you a nice linear flow and... you can decide to wait for a specified period of time and optionally time out if the the browser hangs or otherwise fails to load the page.

## Implementation
So how does this work? 

The WebViewHandler behavior class is useful in many ways beyond this, but I really like this simple `WaitForDocumentLoaded()` functionality because it's a straight linear flow if you have to wait. Note that you can 

Personally I use a reusable WebView wrapper component that handles a number of convenient tasks on the WebView, including the ability to wait for document loading in a more procedural way that for many scenarios is much easier to work with than the event/function based approach.


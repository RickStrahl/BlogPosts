---
title: Fighting WebView2 Visibility on Initialization
featuredImageUrl: https://weblog.west-wind.com/images/2022/Fighting-WebView2-Visibility-on-Initialization/Invisible.jpg
abstract: The WebView2 control has a clever 'feature' that doesn't fully initialize the WebView control if it's not UI visible. While this can save resources in some scenarios it can also make for some very annoying behavior that causes startup timing and flickering issues. In this post I describe a few scenarios where this initial visibility delay loading can cause issues and show a trick you can use to get around it if this 'feature' causes a problem.
keywords: WebView2, Visibility, Startup, Initialization, EnsureCoreWebView2Async, Delay
categories: WebView, WPF
weblogName: West Wind Web Log
postId: 3280139
permalink: https://weblog.west-wind.com/posts/2022/Jul/14/Fighting-WebView2-Visibility-on-Initialization
postDate: 2022-07-14T22:53:58.5263547-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Fighting WebView2 Visibility on Initialization

![invisible](Invisible.jpg)

The Microsoft Edge WebView2 control has a clever 'feature' that tries to optimize load behavior, by **not fully initializing the WebView until it becomes visible** in the UI. On the surface this sounds like a great optimization, as it can potentially save resources and speed up load time of some applications, especially those that display multiple WebView controls on various overlaid components like Tab controls.

But this behavior can cause many unexpected side effects, and has caused me more headaches than almost any other feature in the WebView related to load timing and  startup and activation flickering.

In this post I describe a few scenarios where this initial visibility load prevention is causing me problems and a workaround that can mitigate this behavior.

## Hidden WebViews?
At first, a hidden WebView may seem like an edge case, but in most applications I've built with the WebView, the browser usually lives on a tab that initially is not visible.

In some cases like in [Markdown Monster](https://markdownmonster.west-wind.com/) I have potentially many separate WebView instances open at the same time where each document is tied to its own WebView2 instance that stays open and ready to be interacted with. All but the main document are hidden and on initial load all those non-visible instances are not fully initialized until they are activated.

This causes problems because activating one of the invisible tabs, now fires delayed initialization, but the WebView often doesn't refresh properly because the content is loaded out of band. The documents use Interop interaction between the .NET host and JavaScript code and without a fully initialized document the interop components in the browser or on the host interface may not be fully loaded yet resulting in some nasty timing issues and activation flicker.

In this scenario the main issue for me is that the delayed load can cause wicked startup flicker as one tab is deactivated and the now loading WebView is activated on a new tab. This can require nasty workarounds (see [this post](https://weblog.west-wind.com/posts/2021/Oct/04/WebView2-Tab-Flashes-when-changing-TabControl-Tabs)).

In another application - [West Wind WebSurge](https://websurge.west-wind.com/) - the WebView is not initially visible, but I use virtual domain mapping that maps a local folder to a Web domain. Problem: The virtual domain doesn't initialize until the WebView has initialized, which doesn't happen until the control becomes visible. End result is that the browser initially launches with an *Can't reach this page* error, before refreshing and showing the correct virtual server page as it's once navigated before the control is visible and initialized. 

Hrrrmmph...

##AD##

## How does the WebView initialize?
In both of these scenarios one or many WebView controls are initially hidden and they are effectively put to sleep waiting to be activated. They are loaded but are not fully initialized with any code following the `EnsureCoreWebViewAsync2()` call which waits **until the control becomes visible**.

A WebView is typically initialized with a call to `InitializeAsync()` called from the host form's `ctor`. This method is used to initialize the WebView control and it typically starts off by calling the `EnsureCoreWebView2Async()` method to initialize the WebView control and its startup environment. This method is the one that **induces the wait state if the control is not UI visible**.

```cs
public PreviewerWebViewHandler(MainWindow window, Previewer previewer)
{
    ... 
    _ = InitializeAsync(); // sync->async transition
}

async Task InitializeAsync()
{
	var browserFolder = Path.Combine(wsApp.Configuration.CommonFolder, wsApp.Constants.WebViewEnvironmentFolderName);
    var env = await CoreWebView2Environment.CreateAsync(
        userDataFolder: browserFolder
    );
    
    // if the control is not visible - this will keep waiting
    await WebBrowser.EnsureCoreWebView2Async(env);
    ...   
    
    // any code here is not fired until the control becomes visible
}
```

What this means is - depending on the control visibility - the call to `await EnsureCoreWebView2Async()` can take **a very long time to complete**  as it waits for the Web browser control to become visible, holding up any other initialization tasks that might be needed to configure the WebView environment. Meanwhile it's possible to navigate the browser via the `Source` property (or `Reload()`) but those operations basically fail to load because the control's not ready.

## An Example: WebSurge Request Preview in the WebView
To demonstrate what I'm talking about, here's an example in WebSurge where I use the WebView control to display HTTP request information in a rich HTML view inside of a WPF application. 

The application starts out with the WebView inactive on a `Preview` tab, that is activated by either explicitly activating the tab or running a request.

WebSurge makes a behind the scenes HTTP request, and then renders the result as HTML using a dynamic HTML page on disk using VueJs to map the request data into an HTML template.

In this capture the WebView URL goes against a virtual domain (`https://websurge.app/Result.html`) that is mapped to a local folder: 

![](https://github.com/RickStrahl/ImageDrop/raw/master/BlogPosts/2022/June/WebViewPageLoadError.gif)

You can see that the initial navigation when the Preview tab is first activated results in an initial display of the `Hmmm... can't reach this page` error.

This happens because the application fires an initial navigation to a URL which navigates the control to the initialized request in the ListView. This in turn fires the virtual domain URL and as soon as the control is made visible it navigates, but at that point the control hasn't fully initialized and the domain is not actually available yet (even though the `InitializeAsync()` method has completed). End result - I briefly see the error page.

If I navigate again or force navigate on the run/tab activation the page is re-loaded with updated data and at that point the control is initialized and properly renders the `Request.html` page.

### More detail on the Problem
In the WebSurge example, I'm doing two things that affect pages loaded:

* Mapping a virtual domain to a folder
* Registering an Interop Object required for loaded pages

The initial lack of the domain mapping is the main culprit for the error page.

##AD##

To see how this is set up, here's the complete `InitializeAsync()` method in WebSurge that does both of these things:

```cs
async Task InitializeAsync()
{
    var browserFolder = Path.Combine(wsApp.Configuration.CommonFolder, wsApp.Constants.WebViewEnvironmentFolderName);
    var env = await CoreWebView2Environment.CreateAsync(
        userDataFolder: browserFolder
    );
    
	// code runs to here immediately but then waits for visibilty    
    await WebBrowser.EnsureCoreWebView2Async(env);

	// following only fires **AFTER** browser becomes visible

    WebBrowser.NavigationStarting += WebBrowser_NavigationStarting;
    WebBrowser.CoreWebView2.DOMContentLoaded += CoreWebView2_DOMContentLoaded;

#if DEBUG
    // Dev Path so we can live reload
    //HtmlPagePath = Path.Combine(App.InitialStartDirectory, "Html"); 
    HtmlPagePath = @"C:\projects\WebSurge2\WebSurge\Html";
#else
    HtmlPagePath = "Html";    //  relative to install folder
#endif

    // Virtual domain to local folder mapping
    WebBrowser.CoreWebView2.SetVirtualHostNameToFolderMapping(
        "websurge.app", HtmlPagePath,
        CoreWebView2HostResourceAccessKind.Allow);

    // JavaScript Interop Object
    Callbacks = new RequestCallbackInterop();
    WebBrowser.CoreWebView2.AddHostObjectToScript("websurge", Callbacks);
}
```

The problem is that the initial navigation occurs **before the virtual domain and JavaScript Interop object have been registered** resulting in the invalid navigation on the very first navigation.

### Fix it: Visibility Hack
As is often the case with timing problems like this I ended up going down a lot of dead ends 

After a lot of experimenting with delay loading the request in the browser, not navigating if the control is not ready (doesn't work because then the browser shows no content) I ended up finding a relatively easy, but very hacky solution which involves briefly activating the WebView parent tab as part of the application startup. 

This causes the WebView to initialize immediately **before the WebView is navigated for the first time**. The first navigation then works just fine without the intermediate error page.

The trick is to activate the  browser tab (the preview in this case) very briefly and effectively invisibly, and then re-activate the original, intended tab (the editor in this case):

```cs
private void MainWindow_Loaded(object sender, RoutedEventArgs e)
{
    ... 
    
    // HACK: force previewer to activate briefly so WebView can initialize
    // otherwise we get a brief flash of an error page due to missing virtual server link
    // do before first browser navigation
    MainContentTabs.SelectedItem = TabRequestPreview;
    Dispatcher.Invoke(() => MainContentTabs.SelectedItem = TabRequestEditor, DispatcherPriority.Render);
}
```

Note that you have to use a `Dispatcher` to ensure the `TabRequestPreview` tab that holds the browser has enough time to become UI active. This happens very, very quickly and the tab doesn't visibly activate - using `DispatcherPriority.Render` seems to be enough to force `EnsureCoreWebView2Async()` to complete processing.

With this hack in place, first load now correctly works and is a lot quicker to boot as the initial, invisible navigation happens in the background. So when the view is actually activated the browser has already pre-loaded all the resources and snaps into place very quickly.

> #### @icon-info-circle Ensure Visibility to the Top of the Window Stack
> Note that this hack works only if the entire control hierarchy is visible. IOW, if you do this while the top level form is not visible, the focus swapping of tabs in the example won't have any effect. The WebView being a windowed control rather than a native .NET control needs to get send the appropriate visibility signals from Windows in order to continue initialization.

##AD##

Here's what this looks like with the updated code:

![](https://github.com/RickStrahl/ImageDrop/raw/master/BlogPosts/2022/June/WebViewPageLoadSuccess.gif)


## Summary
Another day - another WebView2 hack! It's good there's a relatively easy solution to this load problem, that involves little more than ensuring that the WebView2 control or its container is briefly made visible to force initialization to proceed. This is useful to know and can help with a number of load scenarios for this control - in fact I wish I would have tried something similar a long time ago as I think 'pre-loading' the control like this avoids a whole slew of load flicker issues that you otherwise can run into. 

So for this purpose I hope this post was useful as it provides another hack to work around yet one more quirk in the WebView2 control saga.

## Related WebView2 Content

* [Taking the WebView2 Control for a spin - Part 1](https://weblog.west-wind.com/posts/2021/Jan/14/Taking-the-new-Chromium-WebView2-Control-for-a-Spin-in-NET-Part-1)
* [Chromium WebView2 Control and .NET to JavaScript Interop - Part 2](https://weblog.west-wind.com/posts/2021/Jan/26/Chromium-WebView2-Control-and-NET-to-JavaScript-Interop-Part-2)
* [WebView2 Flashing when changing TabControl Tabs](https://weblog.west-wind.com/posts/2021/Oct/04/WebView2-Tab-Flashes-when-changing-TabControl-Tabs)
* [Thoughts on Async/Await Conversion in a Desktop App](https://weblog.west-wind.com/posts/2021/Jul/07/Thoughts-on-AsyncAwait-Conversion-in-a-Desktop-App)

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
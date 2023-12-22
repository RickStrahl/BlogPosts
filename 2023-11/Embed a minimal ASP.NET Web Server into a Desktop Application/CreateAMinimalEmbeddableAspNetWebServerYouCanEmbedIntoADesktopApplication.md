---
title: Embedding a minimal ASP.NET Web Server into a Desktop Application
featuredImageUrl: https://weblog.west-wind.com/images/2023/Embed-a-minimal-ASP.NET-Web-Server-into-a-Desktop-Application/EmbeddedBanner.jpg
abstract: Did you ever need to embed a Web Server into a non-Web application? In this post I describe how you can use host ASP.NET in a non-Web application and specifically in a WPF desktop app. What do you need, how is it different and some of the issues that you need to consider if you want to use ASP.NET in your non-Web applications.
keywords: Web Server,WPF,ASP.NET,Hosting,Embedding
categories: ASP.NET, .NET, WPF, Windows
weblogName: West Wind Web Log
postId: 4108957
permalink: https://weblog.west-wind.com/posts/2023/Nov/27/Embed-a-minimal-ASPNET-Web-Server-into-a-Desktop-Application
postDate: 2023-11-27T22:42:36.2634805-10:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Embedding a minimal ASP.NET Web Server into a Desktop Application

![Web Server in a Box Banner](EmbeddedBanner.jpg)

Have you ever wanted to embed a Web Server into another application like a Desktop app for example? It's not a common scenario but I've had a number of occasions where I've had a need for this:

* **[Markdown Monster Markdown Editor](https://markdownmonster.west-wind.com)**  
Provide an application server REST API that can be used for Web and other desktop applications to communicate with the running app. 

* **Help Builder (Documentation)**  
Run a background Web Server to display rendered Http content for live previews of real time generated HTML content.

* **In-house Templates Generator**  
Similar to the documentation app - run a Web Server to generate Razor templated content to static files.

Unusual requirements for sure, but it does come up from time to time. And I would argue that **many applications** could actually benefit from exposing some of their functionality via a Web automation interface.

There are a lot of ways to skin this cat too, depending on how much complexity you need in your server. If you are just after very simple static file hosting, or a few very simple commands that you need to handle (like in Markdown Monster's automation for example), it's pretty easy to hand roll a tiny TCP/IP server, or use one of several .NET packages that allow you to embed a small Web Server into your applications.

In this post I'll show you how you can use **host an ASP.NET Web server inside of another application** - I'll use a desktop application as an example here. I'll provide a sample and a tiny and self-contained class wrapper that makes adding an ASP.NET Web server a little easier for many scenarios and easily lets you extend customize what ASP.NET features you want to support with your own additions.

The sample WPF app and library described here are available on GitHub if you want to play around with what's described in this post:

* [Westwind.AspNetCore.HostedWebServer Library and Sample on GitHub](https://github.com/RickStrahl/Westwind.AspNetCore.HostedWebServer)

and here is what the sample looks like:

![Sample App With Local Server And Web Surge](https://raw.githubusercontent.com/RickStrahl/ImageDrop/master/BlogPosts/2023/EmbeddedAspnetWebServer.gif)  
<small>**Figure 1** - WPF Sample application hosting Web Server using [WebSurge](https://websurge.west-wind.com/) to test requests</small>

##AD##

## ASP.NET inside of another Application
In this post I talk directly embedding an ASP.NET (Kestrel) Web server into your application. Although it's not really obvious how to do, setting an ASP.NET Server in the scope of a non mainline application is very simple and is not that different from a proper Web application.

### Caveat: Requires the ASP.NET Runtime
Before I jump into the why and how, there's a big disclaimer that's a potentially important  consideration on whether using ASP.NET inside of a non-Web application is the right choice for you. 

Specifically you need make sure the **the ASP.NET Runtime is available**. ASP.NET is a .NET Core framework and as such is not part of the core .NET Runtime so like the Desktop Runtime, there's a separate framework reference and runtime that's required in order to use the ASP.NET related libraries needed for Web hosting and most other ASP.NET features.

> Although it's possible to use individual libraries to perhaps whittle down the requirements considerably by using individual NuGet packages, this is a difficult to maintain solution. You first need to figure out what packages are required and you need to keep them in sync with the versions of other dependent libraries. Not recommended.

If you use the standard ASP.NET Framework reference you'll have to add the following to your non-ASP.NET project:

```xml
<ItemGroup>
    <FrameworkReference Include="Microsoft.AspNetCore.App" />
</ItemGroup>
```

and insure that either the ASP.NET Runtime is globally pre-installed (shared mode), or alternately publish your application as self-contained which dumps all the dependent runtime files into your output folder (self-contained mode) along with the other base frameworks which means the distribution size gets larger.

So make sure this is acceptable before going down this path.

### The simplest Thing with an ASP.NET Web Server
So if you want to do the absolute simplest thing you can do to host ASP.NET in another app you can create your server and run it like this:

```csharp
var startupPath = Path.GetDirectoryName(typeof(WebServerTests).Assembly.Location);
var options = new WebApplicationOptions
{
    // binary location (execution folder)
    ContentRootPath = startupPath,
    // optional static file (ie. wwwroot)
    WebRootPath = startupPath,
};
var webBuilder = WebApplication.CreateBuilder(options);
webBuilder.WebHost.UseUrls("http://localhost:5003");
var app = webBuilder.Build();

app.MapGet("/test", async ctx =>
{
    ctx.Response.StatusCode = 200;
    ctx.Response.ContentType = "text/html";
    await ctx.Response.WriteAsync(
        $"<html><body><h1>Hello Test Request! {DateTime.Now.ToString()}</h1></body></html>");
    await ctx.Response.CompleteAsync();
});

app.MapGet("/api/test", async ctx =>
{
    ctx.Response.StatusCode = 200;
    ctx.Response.ContentType = "application/json";
    await ctx.Response.WriteAsJsonAsync(new { Message = "What's up doc?", Time = DateTime.UtcNow });
    await ctx.Response.CompleteAsync();
});

// optionally serve static files out of WebRootPath
app.UseStaticFiles();

// Run Fire and Forget
_ = app.RunAsync();

// ... (continnue to run your app)

// When ready to shut down
await app.StopAsync();
```

As you can see base hosting is pretty simple, especially using minimal APIs that provide basic routing with simple `MapXXX()` operations that make it easy to set up routes and handlers. You get access to the `HttpContext` so you have full control over requests and you can capture `Request` data, and write out `Response` output.

It's like ASP.NET in a box!

> #### @icon-warning Watch Thread Synchronization
> You need to be aware that any Web request in `MapXXX()` hits your app on a **background thread**, not your UI thread. So, any UI or other operations that require running on the main thread will have to be synchronized using a Dispatcher explicitly.

### Creating a Small Reusable Library
Although the above is pretty easy, it's a little painful in that you have to explicitly add the runtime reference and ensure that the right namespaces are used which is not always easy due to a lot of the ASP.NET configuration functionality living in extension methods that aren't directly referenced - you don't notice this in ASP.NET projects because the namespaces are automatically imported but in a non-Web project you have to manually pull everything in. 

IAC to facilitate this process and also provide a few additional small features like the ability to capture request start and completion here's a small wrapper library.

The steps are:

* Create an instance
* Configure the server
* Start the Web Server
* Stop the Web Server when done

#### Initialization
As in the raw code initialization means specifying how the Web Server should behave:

The configuration bits 

* Specify the host url(s)
* Specify whether you want to serve Static files and where from
* Provide Map handlers
* Provide optional started/completed handlers


```cs
public MainWindow()
{
    InitializeComponent();

    InitializeWebServer();
    ... 
}

private void InitializeWebServer()
{         
    Server = new HostedAspNetWebServer();

    // set up routes/mappings or generic handling (fallback)
    Server.OnMapRequests = (app) =>
    {
        app.MapGet("/test", async ctx =>
        {
            ctx.Response.StatusCode = 200;
            ctx.Response.ContentType = "text/html";
            await ctx.Response.WriteAsync($"<html><body><h1>Hello Test Request! {DateTime.Now.ToString()}</h1></body></html>");
            await ctx.Response.CompleteAsync();
        });

        app.MapGet("/api/test", async ctx =>
        {
            ctx.Response.StatusCode = 200;
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsJsonAsync(new { Message = "What's up doc?", Time = DateTime.UtcNow });
            await ctx.Response.CompleteAsync();
        });

        app.MapFallback(async ctx =>
        {
            // You can also use this fallback to generically handle requests
            // based on the incoming ctx.Request.Path
            string path = ctx.Request.Path;
            string verb = ctx.Request.Method;

            // In this case I just return a 404 error
            ctx.Response.StatusCode = 404;
            ctx.Response.ContentType = "text/html";
            await ctx.Response.WriteAsync($"<html><body><h1>Invalid Resource - Try again, Punk!</h1></body></html>");
            await ctx.Response.CompleteAsync();
        });
    };

    // Optionally Intercept to display completed requests in the UI UI 
    Server.OnRequestCompleted = (ctx, ts) =>
    {
        // Important: Request comes in on non-ui thread!
        Dispatcher.Invoke(() =>
        {
            var method = ctx.Request.Method.PadRight(8);
            var path = ctx.Request.Path.ToString();
            var query = ctx.Request.QueryString.ToString();
            if (!string.IsNullOrEmpty(query))
                path += query;
            var status = ctx.Response.StatusCode;


            var text = method + path.PadRight(94) +
                       " (" + status + ") " +
                       ts.TotalMilliseconds.ToString("n3") + "ms";

            Model.AddRequestLine(text);
            Model.RequestCount++;
        });
    };
}
```

The first step is mapping 'routes' which exposes the ASP.NET WebApplication object to allow you to add additional routes via the various `Map()` commands. These are the same methods you'd use in a standalone application using minimal APIs to route requests so you can use `app.MapGet()`, `app.MapPost()` etc. to map specific routes and from there handle the actual ASP.NET requests.

You can also use the generic `app.MapFallback()` which handles any requests that fall through the other maps, and doesn't contain a route. Here you can either handle the request as failed, or - if you want to go more low level manually parse the URL path and verb yourself and execute according to your own custom rules.

The `OnRequestCompleted()` (and `OnRequestStarted()`) handlers are optional. Here I'm using it in the WPF application to update the request panel to show all the individual requests as they are occurring.

### Start and Stop the Server
The above code creates the Server instance, but it doesn't start it yet and the server has to be explicitly started.

You want to make sure you start the server asynchronously using `_ = server.LaunchAsync()`  which amounts to a `FireAndForget()` operation. 

To start remember to not wait (or `await`) completion, but let it continue to run in the background so your main thread can continue:

```csharp
private async void Button_Start_Click(object sender, RoutedEventArgs e)
{
    Statusbar.ShowStatusSuccess("Server started.");
    Server.LaunchAsync(
        "http://localhost:5003", 
        System.IO.Path.GetFullPath("./wwwroot")
        ).FireAndForget();    // or just _ = Server.LaunchAsync()

    Model.RequestText = "*** Web Server started.";
    Model.ServerStatus = "server is running";
}
```

Note there's also a sync version of `Server.Launch()` but I don't think there's a use case for it, unless you want to wrap the task or thread operation yourself. It's there if you need it, but unlikely to be called by an application directly.

To stop you can just `await Server.Stop()`:

```csharp
private async void Button_Stop_Click(object sender, RoutedEventArgs e)
{
    await Server.Stop();
    Statusbar.ShowStatusSuccess("Server stopped.");
    Model.ServerStatus = "server is stopped";
    Model.RequestText = "*** Web Server is stopped. Click Start Server to run.";
}
```

You can try out this WPF sample app from the GitHub repo:

* [GitHub Westwind.AspNetCore.HostedWebServer](https://github.com/RickStrahl/Westwind.AspNetCore.HostedWebServer)

There's a WPF sample that you can run (shown in **Figure 1** above), along with some HTTP request in both [West Wind WebSurge](https://websurge.west-wind.com) and Visual Studio `.http` files so you can test the server...

And there you have it - ASP.NET easily hosted in a Desktop application with live interaction between incoming requests and the host application.

## Alternatives
As nice as all of this is both in terms of functionality and ease of integration, the deployment issue related to the ASP.NET Runtime requirement rains on the parade of using ASP.NET embedded in a non-Web application.

If you have needs that require you to really take advantage of many of ASP.NET's advanced features for complex routing, JSON generation, easy request interceptions, middleware extensibility etc., using ASP.NET is definitely great choice and adding the runtime hit is well worth it in that case. I have a few scenarios where I can utilize Razor as part of my app, and using the full runtime is one way to get the full functionality of 'real' Razor instead of the dumbed down hosted versions that are available in some of the Razor standalone libraries that provide only a subset of features.

But if your needs are simple, the extra installation hit is likely overkill and you might be better of with other solutions that don't exert such a heavy footprint. 

For example, in Markdown Monster's Web server integration which basically allows users to manually fire up the Web server from within a running MM application (and also optionally launch it via protocol handler) and then allow some automation commands to load documents edit them and return the edited content back. It's a great feature for providing an external, yet somewhat integrated Markdown editing experience where for example a REST opened document can automatically update the client application on edits or saves as you type in the editor (and vice versa). This interface literally only involves five simple handlers and in this case it was easy enough to build a small TCPListener based interface that can manually handle the incoming HTTP requests and write out simple JSON HTTP responses. It's very limited but for a local communications interface it's more than adequate and doesn't have any extra dependencies at all. You can [check out the code here](https://gist.github.com/RickStrahl/f9ab2d8fa9366d4f628e903d78bb796f) but be aware it's app specific since the server only has to process a few internal commands via JSON POST data sent to it and returned.

Another solution is to use another HTTP Server library like [genHttp](https://genhttp.org/) which provides a purely C# based solution in a single library with no other dependencies. The distribution footprint is small, and there are a host of options on how to serve content including simple controllers that are easy to use for REST requests.

Options are good.

##AD##

## Summary
Web Hosting in non-Web dedicated applications is a rare use case, although I'd argue a lot more applications should provide HTTP based interface to provide extensibility.

Using ASP.NET inside of a desktop application is not hard to do, but it does unfortunately require that the ASP.NET Runtime is installed in addition to the Desktop Runtime or if you build self contained, include all those files as part of your distribution. If that is not an issue, you do get the benefit of all of the features of ASP.NET inside of your non-Web specific application which can be very powerful. It's a good tool to have in your pocket when the need arises and it can be especially useful for tools and hybrid applications that need to mix Web and desktop content. Check it out...


## Resources

* [GitHub Samples and Library for this article](https://github.com/RickStrahl/Westwind.AspNetCore.HostedWebServer)
* [genHttp Web Server](https://genhttp.org/)
* [App-specific TCP/IP WebServer Example](https://gist.github.com/RickStrahl/f9ab2d8fa9366d4f628e903d78bb796f)
* [West Wind Web Surge REST Client and Load Tester](https://websurge.west-wind.com)


<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
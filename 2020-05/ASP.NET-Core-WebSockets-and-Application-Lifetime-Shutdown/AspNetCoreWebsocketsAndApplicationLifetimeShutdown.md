---
title: ASP.NET Core WebSockets and Application Lifetime Shutdown Events
abstract: WebSockets in ASP.NET Core are easy to use but due to the simple model it's easy to forget that socket requests are long lived and can linger for a long time in the background and that can cause problems when an application needs to shut down cleanly. Luckily there's an `IHostApplicationLifetime` interface available that allows hooking shutdown operations and that provides the necessary cancellation tokens to allow an WebSocket connection to be terminated in response to a shutdown event. This post shows how this works.
keywords: WebSockets, IHostApplicationLifetime, Shutdown, Lifetime Management
categories: ASP.NET Core, WebSockets, ASP.NET, .NET
weblogName: Jekyll Test Site 2
postId: 1763297
permalink: https://weblog.west-wind.com/posts/2020/May/28/ASPNET-Core-WebSockets-and-Application-Lifetime-Shutdown-Events
postDate: 2020-05-28T14:31:26.2895880-10:00
---
# ASP.NET Core WebSockets and Application Lifetime Shutdown Events

![](EventCancelled.jpg)

A couple of days ago I received a bug report in my [Westwind.AspnetCore.LiveReload](https://github.com/RickStrahl/Westwind.AspnetCore.LiveReload/issues/28) repository that revolves around the application life cycle handling events. According to the bug report, when Live Reload is enabled in the application, the shutdown `IHostApplicationLifetime` events are not consistently firing when the application is shutting down.

## WebSockets and Persistent Connections
The Live Reload middleware works by running a Web socket between any open HTML page in the browser and the application. When a file of interest is changed in the dev environment, the WebSocket forces the HTML page to be refreshed.

ASP.NET Core makes it pretty easy to handle WebSocket requests as part of an ASP.NET Core application - you can just check a request for the `context.WebSockets.IsWebSocketRequest` and you're off to the races. You create a connection and then wait to receive data on this connection which looks something like this in this very simple WebSocket implementation that pushes for refresh requests into the browser:

```csharp
// Handle WebSocket Connection
if (context.Request.Path == config.WebSocketUrl)
{
   if (context.WebSockets.IsWebSocketRequest)
   {
       using (var webSocket = await context.WebSockets.AcceptWebSocketAsync())
       {
           if (!ActiveSockets.Contains(webSocket))
               ActiveSockets.Add(webSocket);

           // do your websocket stuff here    
           await WebSocketWaitLoop(webSocket, context); // waits until socket disconnects
       }
   }
   else
   {
       context.Response.StatusCode = 400;
   }

   return true;
}

private async Task WebSocketWaitLoop(WebSocket webSocket, HttpContext context)
{
    // File Watcher was started by Middleware extensions
    var buffer = new byte[1024];
    while (webSocket.State.HasFlag(WebSocketState.Open))
    {
        try
        {
            var received =await webSocket.ReceiveAsync(buffer);
        }
        catch(Exception ex)
        {
            break; // disconnected most likely
        }
    }

    ActiveSockets.Remove(webSocket);

    if (webSocket.State != WebSocketState.Closed &&
        webSocket.State != WebSocketState.Aborted)
    {
        try
        {
            await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure,
                "Socket closed",
                CancellationToken.None);
        }
        catch
        {
            // this may throw on shutdown and can be ignored
        }
    }

}
```

What's nice about the ASP.NET Core WebSocket implementation is that you still get a request context and a lot of the same semantics of a regular transactional HTTP request, except with the big difference that **WebSocket requests are persistent rather than transactional**. Basically a WebSocket connects and then sits and waits for incoming data to do it's thing until it's disconnected. 

The above code works, but **it's completely oblivious to anything else going on**. Like say an application shutting down...

## WebSockets and Application Lifetime
When the application shuts down, it's possible and quite likely actually that a socket is connected to an HTML page. So there's an active connection while the application is trying to shut down. 

In quick testing I was able to verify that the lifetime event handlers in my sample application in `Startup.Configure()` are not firing **if there's a connected socket** still running during shutdown.

Luckily ASP.NET Core has built in support for basic Lifetime management that can be used to notify long running tasks like a Web Socket that the application is shutting down. 

[IHostApplicationLifetime](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/host/generic-host?view=aspnetcore-3.0#ihostapplicationlifetime) is a simple interface that allows trapping shut down events. It's one of the default services available in a .NET Core application so it's always available for injection. This interface also exposes several CancellationTokens that can be used to notify long running operations that the application is shutting down.

Setting up ApplicationLifetime in `Configure()` and testing the application with one or more connected pages I would see the following life time events intermittently working or not working (mostly not):

```csharp
public void Configure(IApplicationBuilder app,
          IWebHostEnvironment env, 
          IHostApplicationLifetime lifetime) 
{
    // ...
    
    // Check for lifetime shutdown working with WebSocket active
    lifetime.ApplicationStopping.Register(() =>
    {
      Console.WriteLine("*** Application is shutting down...");
    }, true);
    
    lifetime.ApplicationStopped.Register(() =>
    {
      Console.WriteLine("*** Application is shut down...");
    }, true);
}
```

Instead the application would shut down without these events firing (after some delay) or worse in some instances the application would crash just before the final shutdown. This often goes unnoticed because by the time this happens the application infrastructure is already unloaded so logging is likely not happening anymore, and so the crashes often occur unnoticed. If running manually and killing with Ctrl-C this would show up as occasional shut down crashes with strangely unrelated framework level error messages. 

Not critical but clearly not optimal!

## Application Lifetime Cancellation Tokens
As with most things async in ASP.NET Core, most async methods allow you to pass **Cancellation Tokens** to the async method and the `websocket.ReceiveAsync()` method is no different.  

Cancellation Tokens provide a cancellation context that allow anybody holding the token along the call chain to signal that the operation should be canceled.

The `IHostApplicationLifetime` object passed has several CancellationTokens it exposes:

* ApplicationStarted
* ApplicationStopping
* ApplicationStopped

These tokens are set as the application goes through the relevant phase of operation.

In my WebSocket loop I need to get a hold of the `ApplicationStopping` CancellationToken. So to use this functionality I need to:

* Set up the Application Lifetime event handling in `Startup.Configure()`
* Use DI to retrieve the `IHostApplicationLifetime` reference
* Pass the Lifetime's `ApplicationStopping` cancellation token to my Socket function.


`IHostApplicationLifetime` is a pre-configured service that is available in the default ASP.NET service configuration so it can be injected directly into the `Startp.Configure()` method. I showed that code above in the previous code snippet.

Likewise I can use Dependency Injection to access the `IHostApplicationLifetime` in my Middleware component's CTOR:

```cs
public class LiveReloadMiddleware
{
    private IHostApplicationLifetime applicationLifetime;
    
    public LiveReloadMiddleware(RequestDelegate next,
                    IHostApplicationLifetime lifeTime)
    {
        applicationLifetime = lifeTime;
        _next = next;
    }
    
    // ...
}    
```

The `applicationLifetime.Stopping` CancellationToken can then be used to pass the Cancellation token to the `ReceiveAsync()` call.

```csharp
private async Task WebSocketWaitLoop(WebSocket webSocket, HttpContext context)
{
    // File Watcher was started by Middleware extensions
    var buffer = new byte[1024];
    while (webSocket.State.HasFlag(WebSocketState.Open))
    {
        try
        {
            var received =
                await webSocket.ReceiveAsync(buffer, applicationLifetime.ApplicationStopping);
        }
        catch(Exception ex)
        {
            break;
        }
    }

    ActiveSockets.Remove(webSocket);

    if (webSocket.State != WebSocketState.Closed &&
        webSocket.State != WebSocketState.Aborted)
    {
        try
        {
            await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure,
                "Socket closed",
                applicationLifetime.ApplicationStopping);
        }
        catch
        {
            // this may throw on shutdown and can be ignored
        }
    }

}
```

With this code in place in the middleware the shutdown events now correctly fire. No more random shutdown crashes and the lifetime events consistently fire now.

## Summary
WebSockets in ASP.NET Core are easy to use but due to the simple model that looks similar to typical ASP.NET Core requests, it's easy to forget that socket requests are long lived and can linger for a long time in the background. In order to ensure that an application can shutdown cleanly the sockets have to be disconnected or aborted before the application can shut down.

The `IHostApplicationLifetime` interface provides the tools to both intercept the shut down operations as well as providing the necessary `CancellationToken` instances to let other operations safely shut down when a shutdown is requested. It's all quite disconnected but once you know how to get a hold of the Cancellation tokens, making sockets clean to shut down is easy enough to accomplish.

Cancel the shutdown frustrations... onward!


<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
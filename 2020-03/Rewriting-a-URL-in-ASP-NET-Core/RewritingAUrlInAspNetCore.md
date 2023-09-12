---
title: 'Back to Basics: Rewriting a URL in ASP.NET Core'
featuredImageUrl: https://weblog.west-wind.com/images/2021/Rewriting-a-URL-in-ASP-NET-Core/RewriteHistory.jpg
abstract: Sometimes in an application you need to take over the routing process with some custom processing that acts on an incoming URL and actually has to go to another URL. This can be a simple relinking task from old content to new, or it can be more complex where you access a specific URL on the public site that actually needs to be processed by another URL altogether.
keywords: UrlRewrite,Redirect,Rewrite
categories: ASP.NET Core
weblogName: West Wind Web Log
postId: 1603425
permalink: https://weblog.west-wind.com/posts/2020/Mar/13/Back-to-Basics-Rewriting-a-URL-in-ASPNET-Core
postDate: 2020-03-13T21:11:56.4843833-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
customFields:
  '':
    id: 
    key: ''
    value: ''
---
# Back to Basics: Rewriting a URL in ASP.NET Core

![](RewriteHistory.jpg)

URL rewriting is the concept of changing the currently executing URL and pointing it at some other URL to continue processing the current request or redirecting to an external URL.

I ran into a few discussions and [a StackOverflow question](https://stackoverflow.com/questions/41101945/asp-net-mvchow-to-rewrite-url-by-middleware-in-asp-net-core/60664395#60664395) recently that asked how to do a **URL Rewrite** in ASP.NET Core. In classic ASP.NET you could use `HttpContext.RewritePath()` but that doesn't exist in .NET Core. Turns out however, that it's even easier in .NET Core to rewrite a URL if you know where to update the path.

In this back to basics post I'll talk about the difference between a Rewrite and Redirect and when and how you can use them in ASP.NET Core.

## A few Rewrite Scenarios
There a few common scenarios for re-writing URLs:

* Re-linking legacy content
* Creating 'prettier URLs'
* Handling custom URLs that need to actually process something else
* Redirecting from one Operation to another as part of Application code

The first two are pretty obvious as they are simple transformations - go from one URL to another because either some content has moved or as part of a change of state that requires to user to see something different. This is quite common especially in applications that have been around for a while and have changed around a bit.

A less common but arguably more useful use case are URL transformations for tools that render **custom content**. For example, my [westwind.aspnetcore.markdown](https://github.com/RickStrahl/Westwind.AspNetCore.Markdown) page processing middleware, lets you access either an `.md` 'page' or an extensionless folder with a specified `.md` file inside of it. When one of these monitored URLs is accessed, a rewrite middleware actually routes the original request to a common markdown controller endpoint that renders the Markdown into a page template while the original URL stays the same. This is a classic **rewrite scenario**.

##AD##

The most common rewrite scenario however, likely is at the application level. If you're building applications you've almost certainly had a need to redirect to another endpoint at some point. Think Login and Authentication - you hit a Login URL, the URL logs you in and as part of the login routine - once successful - you're redirected to a start page, or a redirect URL that was passed in. Most HTML applications and some REST services that requires identity have a handful of requests like this that require explicit redirects. This is a classic **redirect scenario**.

## Rewriting vs. Redirecting  a URL
As the above examples are meant to show there are two different ways to change the current requests endpoint:

* **Rewrite** the current URL 
* **Redirect** to an external URL

The two tasks are similar but yet different in their execution:

* **Rewriting**  
Rewriting actually **changes the current request's path internally** and continues processing the current request with all of it's existing state through the middleware pipeline. Any middleware registered after the rewrite sees the new URL and processes the remainder of the request with the new path. All of this happens as a part single server request. 

  The URL of the request displayed in the address bar **stays the same** - the browser location doesn't change to the rewritten URL.  
  *Uses `context.Request.Path`*

* **Redirecting**  
Redirecting actually **fires a new request on the server** by triggering a new HTTP request in the browser via an `302 Moved` or `301 Moved Permanently` HTTP Response header that contains the redirection URL. A redirect is an HTTP header response to the client that instructs the client to:   
	*Go to the URL specified in this response header*.

    ```http
    HTTP/1.1 302 Moved
    Location: https://west-wind.com/wwhelp
    ```

    Redirects can also use `301 Moved Permanently` to let search engines know that the old URL is deprecated and the new URL should be used instead.  
    *Uses `context.Response.Redirect()`*

As you can imagine, if you have a choice between re-writing and a redirect, the rewrite tends to be more efficient as it avoids a server round trip by simply re-writing the URL as part of the current request. The caveat is that the browser's location/address bar does not reflect the new rewritten URL - if that's important (and often it is) then a redirect is required.

A rewrite can also keep request information, so if you have `POST` or `PUT` operation that has data associated with it, that data stays intact. 

A `Redirect()` on the other hand is always reissued as an `HTTP GET` operation by the browser so you can't redirect form input.

## Intercepting URLS in ASP.NET Core
If you plan to intercept requests and rewrite them , the most likely place you'd want to do this is in ASP.NET Core is in Middleware. Rewrite components tend to look at incoming request paths or headers and determine whether they need to re-write the URL to something else.

  If you want to do this in ASP.NET Core the easiest way to do this is to use `app.Use()` inline middleware which you can add to your `Startup.Configure()` method.

### Re-Writing a URL
Here's how to handle a **Rewrite** operation in `app.Use()` middleware:

```csharp
app.Use(async (context,next) =>
{
    var url = context.Request.Path.Value;

    // Rewrite to index
    if (url.Contains("/home/privacy"))
    {
        // rewrite and continue processing
        context.Request.Path = "/home/index";
    }

    await next();
});
```

This intercepts every incoming request and checks for a URL to rewrite and when it finds one, change the `context.Request.Path` and continues processing through the rest of the middleware pipeline. All subsequent middleware components now see the updated path.

You can use a similar approach for Redirecting, but the logic is slightly different because a Redirect is a new request and you'll want to terminate the middleware pipeline:

```csharp
app.Use(async (context,next) =>
{
    var url = context.Request.Path.Value;

    // Redirect to an external URL
    if (url.Contains("/home/privacy"))
    {
        context.Response.Redirect("https://markdownmonster.west-wind.com")
        return;   // short circuit
    }

    await next();
});
```

> `Response.Redirect()` in ASP.NET Core doesn't do automatic path fixups as classic ASP.NET did. You can't use: `Response.Redirect("~/docs/MarkdownDoc.md")` but you have to specify the whole full site relative path or absolute Url.

Unless your target URL includes application external URLs I'd argue there's no good reason to use a Redirect in middleware. It only makes sense for external, non-application URLs in that scenario.

However, Redirects are more commonly used when you need to redirect as part of your application/controller logic, where you can't use a rewrite operation because the path has already been routed to your application endpoint/controller method.

Notice also in the code above that it's a good idea to short-circuit the Response when redirecting, rather than continuing through the rest of the middleware pipeline.

##AD##

### Routing Order is Important!
If you plan on using Url Rewriting or generic redirection, **it's important that you do it at the right time in the routing and request handling sequence** during start up. You want to make sure you do your rewriting **before** the operations you need to rewrite to but after anything that you don't want to have routed (like static files most likely).

Specifically, rewrites should be declared **before** 

* `app.UseRouting()`,
* `app.UseRazorPages()`
* `app.UseMvcControllers()` 
*  or any other end point route handlers

You may also need to decide how static pages are handled before or after your rewriting. Ideally if your static content is not affected you'd want to declare it prior to your rewrites, but if paths are affected then put it after.

Here's what a typical rewrite and routing setup might look like:

```cs
// don't rewrite static content - if you do put after app.Use()
app.UseStaticFiles();

// do your rewrites against anything that FOLLOWS
app.Use(async (context, next) => 
   // ... rewrite logic
});

// IMPORTANT: Do after custom redirects so rewrites
//            are applied here
app.UseRouting();
```

## The ASP.NET Core Rewrite Middleware Module
For more complex rewrite and redirect scenarios you can also use the full-fledged ASP.NET Core Rewrite Middleware. It's beyond the scope of this article to go into the details of this complex module, but basically it provides the ability to set regEx based rewrites and redirects and  a number of different and some common rewrite operations.

* [URL rewriting middleware](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/url-rewriting?view=aspnetcore-3.1#url-rewrite)

Using the middleware is great if you have complex rules for many URLs or need follow specific patterns to re-route content. There are also helper for doing common things like routing `http://` to `https://` and routing the `www.` url to the root domain.

Here's what the middleware looks like (from the docs):

```cs
var options = new RewriteOptions()
            .AddRedirectToHttpsPermanent();
            .AddRedirect("redirect-rule/(.*)", "redirected/$1")
            .AddRewrite(@"^rewrite-rule/(\d+)/(\d+)", "rewritten?var1=$1&var2=$2", 
                skipRemainingRules: true)
            
        app.UseRewriter(options);
```

## Summary
URL Rewriting in ASP.NET Core is easy and simply changing `context.Request.Path` is all that it takes to re-write the URL to route to some different endpoint. For external URLs you can use `context.Response.Redirect()` just as you could in older versions, but be aware that `Response.Redirect()` doesn't automatically fix up virtual path (`~/`) syntax.

For simple use cases I prefer handling rewrites using explicit middleware as shown above. I think an inline `app.Use()` snippet is fine because for this scenario, it actually fits nicely into the config pipeline. Unless you think you need to reuse your rewrite logic in other applications there's rarely a need to write dedicated middleware for this.

For more complex use cases that require rules based evaluation there's no need to reinvent the wheel as ASP.NET core provides rewrite middleware that uses all the common regex expansions you would expect from HTTP based rewrite modules.

Now excuse me, while I redirect back to my regular scheduled programming...

## Resources
* [URL Rewriting Middleware in ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/url-rewriting)

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
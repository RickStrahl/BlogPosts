---
title: Getting an Absolute Application Base Path in ASP.NET
weblogName: West Wind Web Log
postDate: 2018-09-18T11:06:29.4293842-07:00
---
# Getting an Absolute Application Base Path in ASP.NET

ASP.NET includes a host of features to retrieve paths, but one that is consistently missing in all versions of ASP.NET is to get a reliable **absolute** base path for the application that is running. 

An absolute base path is a non-relative path that includes the HTTP scheme and domain like this:

```text
https://weblog.west-wind.com/
```

or if you're using a virtual folder for your project:

```text
https://weblog.west-wind.com/classifieds/
```

ASP.NET makes it very easy to find **relative** paths like this:


```text
/
```

or 

```text
/classifieds/
```

using a host of built in functions and virtual path syntax formats inside of templates.

* Request.ApplicationPath
* WebForms: ResolveUrl("~/")
* MVC: Content("~/")
* MVC: Resolve ~/ inside of Razor itself for href/src attributes

### I need no stinking Absolute URLS - or do I?
But when it comes to resolving absolute paths that include scheme and domain there are no easy tools.

As I mentioned the most common use cases for link embedding can be covered by using relative paths or - if using MVC - using the various routing link helpers. This works just fine inside of an application where you link from one page to another in the same application.

However, there are a number of scenarios where you may have to generate absolute URLs to links in your application. Here are a few examples that I just ran into one of my applications I'm working on at the moment:

* Reference links for cutting and pasting 
* Links embedded in email or exported document
* Login verification links

So when you do - how do you get the base application path that works in a reliable way?

### Getting a base Application Path
In the past I've often used a static configuration value in my Configuration class that would store the site's base path:

```csharp
App.Configuration.ApplicationBaseUrl = "https://weblog.west-wind.com/";
```

If needed I can then just access my global config to get the value:

```
<p>Please go to:</p>

<p>@App.Configuration.ApplicationBaseUrl + $"PasswordRecover/{recoverKey}"<p>

<p>to reset your password</p>
```
The value would actually be set via configuration in a config file rather than code.

It works, but it requires that the base path is changed for each development, deployment or test environment and it's real easy to forget to update one of those. I've found that out the hard way more than once.

### Retrieving the Application Base Path
Arguably a better way to to this is to dynamically pick up the base path based on an active request. The active request presumably has an accurate and current domain/application path associated with it so we can use that retrieve the value.

In order to do this we need two things:

* The base scheme, domain and port of the URL (ie. `http://localhost:451221`)
* The Applications relative base path (ie. `/` or `/classifieds`)

ASP.NET provides the raw URL for an active request in the `Request.Url.AbsoluteUri` property and we can use that to figure out the base scheme/domain/port configuration quite easily using the `UriBuilder` class.

The relative Application path as used in the Web Server is available in `Request.ApplicationPath` and so we can combine those values to give us the absoluate application base path.

All together now:


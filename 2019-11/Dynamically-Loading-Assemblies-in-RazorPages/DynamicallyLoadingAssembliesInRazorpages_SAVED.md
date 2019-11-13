---
title: Dynamically Loading Assemblies in RazorPages
weblogName: West Wind Web Log
postDate: 2019-11-05T09:19:08.4354133-10:00
---
# Dynamically Loading Assemblies in RazorPages
I've been working on some standalone tools that are generically serving static content as well as ASP.NET Core content **from an arbitrary folder**. With ASP.NET Core it's now possible using several different approaches to create standalone server applications that provide all sorts of utility with relative ease.

The tool I've built recently is a .NET based,  standalone local dev server with built-in Live Reload functionality and it's main purpose is to serve static content locally in a self-contained fashion.

If you're interested you can grab the [Dotnet Tool](https://www.nuget.org/packages/LiveReloadServer/) or a [Standalone Exe (zipped)](https://github.com/RickStrahl/Westwind.AspnetCore.LiveReload/blob/master/LiveReloadServer/LiveReloadWebServer.zip).

To install the Dotnet Tool (requires .NET Core 3.0 SDK):


```ps
dotnet tool install --global LiveReloadServer
```

Install from [Chocolatey](https://chocolatey.org/packages/LiveReloadWebServer) as a standalone EXE (no dependencies):

```ps
choco install LiveReloadWebServer
```

Once installed you can run:

```ps
# dotnet tool
LiveReloadServer --WebRoot c:\temp\mysite\web 

# chocolatey install or EXE
LiveReloadWebServer --WebRoot c:\temp\mysite\web 
```

Note the different names for the dotnet tool and the standalone EXE, so it's possible to run both side by side in case both are installed. For the remainder of this post I'll use `LiveReloadServer` but it replies to `LiveReloadWebServer` as well

There a few options for configuring the server, live reload, what to look for etc by using the `--help` command line switch.

### Static Content First
My original goal for this server was to simply support Static Content because that's the most common use case. The idea is that you simply start `LiveReloadServer` out of a folder with Web content and go or use the `--WebRoot <path>` command line to point at a different folder and you're up and running with a Live Reload Web Server.

There are other tools like [BrowserSync](https://www.browsersync.io/), but they are Node based and for me personally these node based tools have been pretty flakey. They work for a bit but eventually have to be restarted constantly. By building my own, I can easily tweak the way it works and fix any issues as they come up. To top it off ASP.NET Core makes this functionality relatively trivial to implement. For more info on the Live Reload middleware see my [Building a Live Reload Middleware Component for ASP.NET Core](https://weblog.west-wind.com/posts/2019/Jun/03/Building-Live-Reload-Middleware-for-ASPNET-Core).

For static content this has all been a no-brainer and it works beautifully.

### Limited Razor Pages Content
But I also got to thinking that it would be nice to support Razor Pages in the referenced site. Razor Pages allow for self-contained `.cshtml` Razor pages on disk to be served including **dynamic content** via it's built-in support for **C# Razor syntax**.

Essentially you can create something like `hello.cshtml` and then serve that as `https://localhost:5200/hello`. The Razor page can contain dynamic C# content.

Turns out it's very easy to route Razor pages to look for content in a non-install location:

```csharp
if (UseRazor)
{
    services.AddRazorPages(opt => { opt.RootDirectory = "/"; })
        .AddRazorRuntimeCompilation(
            opt =>
            {
                opt.FileProviders.Add(new PhysicalFileProvider(WebRoot));
            });
}
```

In order for this dynamic Web Server concept to work, the first thing needed is to add `.AddRazorRuntimeCompilation()` and adding the following Nuget Package:

```xml
<ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Razor.RuntimeCompilation" Version="3.0.0" />
</ItemGroup>
```

Runtime compilation in ASP.NET Core 3.0 is disabled by default, which means you're expected to pre-compile all your RazorPages (and MVC Views), so there is no runtime recompilation when changes are made. The goal is for much faster startup time and that works, at the cost of development time convenience (or runtime changes).

Once the above configuration has been added I can now easily create a Razor Page (hello.cshtml) somewhere in the target folder hierarchy and then add something like this:

```html
@page
<html>
<body>
<h1>Hello World</h1>

<p>Time is: @DateTime.Now.ToString("hh:mm:ss tt")</p>

<hr>

@{
    var client = new System.Net.WebClient();
    var xml = await client.DownloadStringTaskAsync("https://west-wind.com/files/MarkdownMonster_version.xml");
    var start = xml.IndexOf("<Version>") + 9;        
    var end = xml.LastIndexOf("</Version>");
    var version = xml.Substring(start, end - start);
}

<h3>Latest Markdown Monster Version: @version</h3>
<hr>

</body>
</html>
```

Not surprisingly this works just fine.

This works because all the dependencies in this code are directly contained in the .NET Core and ASP.NET Core runtimes.

### No Runtime Compiled C# Code Files
So far everything I've described works just fine with runtime compilation. 

But there are two things that don't work out of the box:

* Loading of additional Assemblies
* Compiling C# code for 'code-behind' Page Model files

The latter is something that hasn't been addressed, but the former surprisingly is possible with relatively little effort. However, it's not obvious.

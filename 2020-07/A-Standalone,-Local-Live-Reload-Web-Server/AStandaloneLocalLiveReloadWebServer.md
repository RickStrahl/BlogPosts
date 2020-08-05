---
title: A Standalone, Local Live Reload Web Server
weblogName: West Wind Web Log
postDate: 2020-07-13T23:13:33.1372161-10:00
---
# A Standalone, Local Live Reload Web Server

You've probably heard me talking about my Live Reload Web Server in a number of posts on this site in the last half a year or so.  It's a generic, standalone, local, .NET Core based Web Server that has built-in support for Live Reload and supports rendering and refreshing of Markdown documents as well as support for loose Razor Pages. 

## Why another Local Web Server?
There are already a number of local Web Servers available. However, most of them are NodeJs based, which if you are a .NET developer may or not be a thing for you. But beyond that the server is meant to be very easy to use and make it as easy as possible to spin up a local Web Server development environment so that you can quickly check out a locally stored static Web site. You can quickly fire up an Angular, Vue or Blazor application and it will run locally. You can make changes to content and immediately see content updated. 

The other distinguishing feature is that it is .NET based. It uses .NET Core and can be easily installed as a Dotnet Tool:

```ps
dotnet tool install -g LiveReloadServer
```
  
It's a quick and easy install for .NET developers. For this to work you do need to have the .NET Core SDK installed, but if you do it'll run on all supported .NET Core platforms. 

On Windows there's also a Chocolatey install:

```ps
choco install LiveReloadWebServer
```

which is a fully self-contained installation of the server that does not have any external dependencies. 


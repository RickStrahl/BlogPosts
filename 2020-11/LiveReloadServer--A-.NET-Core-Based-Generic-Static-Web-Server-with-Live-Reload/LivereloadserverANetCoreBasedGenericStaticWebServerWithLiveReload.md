---
title: LiveReloadServer - A .NET Core Based Generic Static Web Server with Live Reload
weblogName: West Wind Web Log
postDate: 2020-11-11T20:33:50.3496543-10:00
---
# LiveReloadServer - A .NET Core Based Generic Static Web Server with Live Reload

Over the last year or so I've often in passing mentioned my [LiveReloadServer](https://github.com/RickStrahl/LiveReloadServer) which is a standalone, generic Web Server built with .NET Core. It's an easy to use and flexible local Web Server that's great for serving up local static content and includes built-in Live Reload support. It's great for using as a local static development file server.

### Why another Local Web Server?
There are already many local Web Servers you can use. If you use NodeJs there are literally hundreds of local servers available. It's also not difficult to build a local Web Server quickly either in .NET or with Node.

But I find that quite frequently I need a local Web Server and by building this LiveReload Web Server I was able to package a number of features into a single easy to use and run package.

LiveReloadServer has the following features:

* Point and shoot: Point at a Web Root and go
* http and https support
* Local-only or remote access modes
* Built-in Live Reload for static and dynamic files
* Can serve self-contained Razor Pages
* Can serve Markdown Documents as HTML
* Hostable - can run on live Web site (IIS or other backend)

The server is built using .NET Core and uses .NET Core's hosting model. It's very quick to start and efficiently serves content. It's also possible to host the Web Server inside of a server application like IIS on Windows or something like nginX on Linux.

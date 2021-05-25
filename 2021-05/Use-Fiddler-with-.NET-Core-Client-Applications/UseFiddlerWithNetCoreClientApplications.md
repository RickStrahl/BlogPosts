---
title: Use Fiddler with .NET Core  Client Applications
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2021-05-21T17:40:20.7208487-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Use Fiddler with .NET Core  Client Applications

## Using Code



## Setting a Proxy with the Command Line
Temporarily assign a proxy via Command Line:

```ps
netsh winhttp set proxy 127.0.0.1:8888
```

to unset:

```ps
netsh winhttp reset proxy
```
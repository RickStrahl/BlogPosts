---
title: Switching to Minimal API Startup in .NET 6.0
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2021-12-08T10:24:04.0908423-10:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Switching to Minimal API Startup in .NET 6.0

C# 10 has introduced a new Top Level statements and with it comes a new 'default way' to set up ASP.NET applications using a single program file rather than a `Startup` class that breaks out separate `ConfigureServices()` and `Configure()` methods. This feature takes advantage of the simpler top level statement syntax of flattened code tree. 

I don't know what to make of this C# feature to be honest. The feature set of reducing code indentation is very nice, but the fact that it only works as a top level class essentially replacing a `Main()`  function, while having to use normal C# code files for anything else feels very hokey.

Regardless though the new ASP.NET 6.0 default templates use this new approach, so it seems like a good idea to move in that direction especially as there are also some other changes under the hood in the way the default Host builders work and are used.

To be clear though: If you have existing applications that use the old host builders and use a `Startup` class with separate methods, those still work.

I've now upgraded four applications to this new implementation and while the process is definitely not automatic, for the most part its copying and pasting code from one mode to the other with some adjustments for how 

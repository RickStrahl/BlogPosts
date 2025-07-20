---
title: Exe File Packaging - Package EXE plus Data
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2025-06-17T09:39:24.8653089-07:00
postStatus: publish
dontInferFeaturedImage: false
stripH1Header: true
---
# Packaging a Web Site into a self-executable Exe for Windows
I've been working on an application that needs to build self contained documentation that can 'run' on its own. Basically the idea is that I have a tool that creates documentation as a static Web site into a folder. The application is not completely static - it uses JS code to dynamically load topic content via client-side Javascript code and retrieving content dynamically, so it requires Http based loading. Normally this would entail using a Web serve3r, but there's actually a way you can make this work - on Windows at least using merely a WebView control. 

There are number of parts to it and I'll discuss them in a series of posts. In this post I want to address the process of bundling data into an EXE so you can effectively build a single self-executing package that contains both the executable to 'run' the site and the data that comprises the site.

## Why not Electron?
Now I should be clear this sounds suspiciously like - Electron right? Well, Electron works for this except that it's a developer tool. If you want to do this generically for end users as part of an application, Electron is way to complex to set up and automate. 

Additionally Electron requires a Chromium Runtime and because of that the size of 

## Packaging Application and Data Concepts
So the idea behind this Web site packaging is as follows:

* Package the Web Site into a Zip file    
  (basically zip up a folder structure)
* Build a packager application that can handle packaging/unpackaging   
  as well as 'running' the unpackaged Web site.

## Exe File Publishing - Actually quite easy!
So the idea behind
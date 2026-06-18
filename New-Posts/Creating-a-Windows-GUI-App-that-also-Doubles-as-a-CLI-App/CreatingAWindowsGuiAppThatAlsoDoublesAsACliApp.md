---
title: Creating a Windows GUI App that also Doubles as a CLI App
abstract: 
keywords: 
categories: 
weblogName: West Wind Weblog (BlazePost API)
postId: 
stripH1Header: true
postStatus: publish
postDate: 2026-06-15T12:14:24.7825743-07:00
---
# Creating a Windows GUI App that also Doubles as a CLI App
This may be old hat, but I just ran into this again with the WebPackageViewer tooling I described in my last post where I have a single application that can run in dual mode and support both Command Line Console functionality as well as GUI interface.

Specifically in my use case I'm talking about a WPF application that also has a GUI interface. 

To be clear there are multiple ways that this can be addressed and I've used both of them:

* Create a separate CLI application and drive the UI application from it
* Create a mixed Mode Application using Console Project as the base
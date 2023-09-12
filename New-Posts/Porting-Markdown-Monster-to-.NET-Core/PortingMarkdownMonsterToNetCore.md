---
title: Porting Markdown Monster to .NET Core
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2023-09-02T10:52:01.1773108-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Porting Markdown Monster to .NET Core

I had previously posted about my initial journey to get my Markdown Monster application to run under .NET Core a few years back when I initially started porting code so that it would work under .NET Core. Markdown Monster had previously been and up until about a year ago was always shipped as a .NET Framework 4.72 application.

There are lots of reasons on why it took so long to finally ship a .NET Core version as I did last with the final release of Markdown Monster 3.0. 

In this post I'll talk about some of the issues that I ran into and what caused the long delay from first getting MM to run under .NET Core to actually being able to ship as .NET Core application to customers.  Surprisingly those are two very different things and something that I hope to highlight in this post.

This is by no means meant as a comprehensive guide of porting an application - think of this a compilation of notes from the trenches that highlight things that aren't frequently discussed in public discussions because they are either on the edges of perception or dismissed as 'who cares just do what is recommended' which is definitely NOT what MM did in some situations.

## Porting to .NET Core: Easy Until it isn't
Markdown Monster up through version 2.x was a full .NET Framework application running under .NET 4.72. Markdown Monster was originally written sometime in 2015 and officially released as a 1.0 application in 2016 - at the time there weren't really any options to run a WPF application under .NET Core, so it wasn't even a consideration. 

I chose to use WPF at the time because for a Windows application WPF is and still does provide the richest eco system and support libraries. 

At the time I was also contemplating building as Cross Platform application with the main contender being Electron. However, the thought of having to build up an entire desktop style UI that looks nice with HTML and JavaScript was something that I did not want to get into at the time. Heck I still don't see a decent solution to that problem today. Most of Electron based applications you see today all use a custom UI implementation which is fine if you have a whole team of developers that can focus just on UI, but not so much as an individual developer.

To this day I think that the JavaScript/Typescript bit would be totally fine with me, but the UI piece of it I have no clue of how I would want to handle this. Having to write all UI controls from toolbars, menus, list and tree controls.

I have a real hard time with. I'm no UI designer and having a decent UI framework that provides out of box support for basic UI components was key for me to build a useful tool. 

For WPF that was provided in the form of the [MahApps.Metro](https://mahapps.com/) which provided a nice looking, themeable UI framework that is well integrated into WPF so much so that it nearly i
---
title: Web Connection 8.4 Release Post
featuredImageUrl: https://webconnection.west-wind.com/images/WebConnection_Code_Banner.png
abstract: Time again for a small update to West Wind Web Connection. This release is primarily a bug fix release so it's highly recommended that you update to this latest 8.x version as soon as possible.
keywords: Release, Web Connection
categories: Web Connection
weblogName: Web Connection Weblog
postId: 57037
postDate: 2025-07-22T18:32:21.5333910-07:00
postStatus: publish
dontInferFeaturedImage: false
stripH1Header: true
---
# Web Connection 8.4 Release Post

![](https://webconnection.west-wind.com/images/WebConnection_Code_Banner.png)

Hi all, 

I've released Web Connection 8.4 which is a minor maintenance release of the FoxPro Web and Service Development framework. The primary reason for this release are several small bug fixes that might be impacting some of you if you are:

* Using wwUserSecurity Authentication (especially in Virtual Folders)
* You're using Multipart Form Uploads via wwHttp


If that's you and you're using v8.1-8.3, you'll probably want to update to the latest version as soon as possible.

There are also a couple of nice enhancements in wwDotnetBridge, and a new documentation viewer offline application.

## Bug Fixes
Let's start with the important bug fixes because they are the main reason for this release.

### Fix User Authentication Session Cookie Bug
In the last 8.2-8.3 a regression error was introduced that in certain situations would not properly set the wwUserSecurity related authentication Session cookie. Specifically this can be a problem in scenarios where you're using a non-root virtual folder in your Web application.

I'm not quite sure why this particular error occurred only with virtual folders since Web Connection cookies are always set on the domain root, but for some reason cookies set when running under the virtual in some cases would not be set properly. The issue basically was that a session Id was present but for some reason the session was not recovered and so a new session key gets generated on each check attempt which effectively results in a successful login that lasts only for the current requests. Oddly this only occurs in virtuals and then more likely on nested virtuals (for me it happened in the [Web Connection Weblog](https://west-wind.com/wconnect/weblog) specifically).

It's fixed now where the code now explicitly generates a new cookie on login rather than checking for an existing cookie to update.

### Fix: wwHttp Multipart Form Data Content Type not getting set
This issue is another regression that cropped up from the recent work to support greater than 16mb uploads and downloads. Essentially, the Content Type parameter on [AddPostKey()](https://webconnection.west-wind.com/docs/Utility-Classes/West-Wind-Internet-Protocols/Class-wwHTTP/wwHTTPAddPostKey.html) was not being passed through in to the request. It does work for the newly added `AddPostFile()` but if you're using older code that uses `AddPostKey()` to upload files the content type was not being appended.

In the process of fixing this bug, I also cleaned up the signature to the [AddPostFile()](https://webconnection.west-wind.com/docs/Utility-Classes/West-Wind-Internet-Protocols/Class-wwHTTP/wwHTTPAddPostFile.html) method. The method initially had inherited the same signature as `AddPostKey()` but there were several parameters that are superfluous for uploading files, so the signature was adjusted for more logical flow. 

> The change to `AddPostKey` is a potential breaking change if you were using the method since the order of parameters has changed. 

### Missing JsonService Variable in wwRestProcess Process Methods
Another regression bug relates to [wwRestService](https://webconnection.west-wind.com/docs/Framework-Classes/Class-wwRestProcess.html) and the use of the intrinsic `JsonService` variable that is passed as a shortcut for `THIS.oJsonService` into a REST Process method. The error was due a missing `PRIVATE` scope assignment at the top of the processing pipeline in `RouteRequest()`.

This has been fixed.

## New and Improved Features
Not much to report in this update but there are few.

### wwDotnetBridge: Unblock all DLLs loaded
The classic .NET Framework still uses Windows Vista Style zoning security by default and so respects the custom blocking attributes that are added to binary files downloaded from the Internet (including files embedded in Zip or 7zip files when unpacked), media devices or from non-local domain drives. Files from those sources get implicitly marked by Windows as 'blocked'.

wwDotnetBridge has for some time explicitly removed blocks on `wwDotnetBridge.dll` which is the initially loaded Dll that loads the runtime. In most cases that's enough, but I've recently run into cases where other DLLs being loaded were also affected and failed when calling `loBridge.LoadAssembly()`.  For this reason, wwDotnetBridge now also removes blocks from any assembly loaded via `LoadAssembly()` before loading.

This should improve issues with blocked DLL loading significantly, but you may **still run into problems** if the DLLs loaded load other DLLs implicitly. In that case you can explicitly load those assemblies using `LoadAssembly()` (starting with the most deeply nested dependency first), or you can manually unblock files as described in this [help topic.](https://webconnection.west-wind.com/docs/Utility-Classes/Class-wwDotnetBridge/Unable-to-load-CLR-Instance-Error.html)

### New Offline Documentation Viewer
For years several people here - looking at you Tore - have hounded me to provide offline documentation again as we used some time ago. In the past I created a very large PDF document which was problematic to create as I used Word Automation to import from Html and then Print to Pdf. That process was very brittle and took a really long time to run and often would randomly fail.

Well, recently I switched the documentation over to a new documentation system I've been building called [Documentation Monster](https://documentationmonster.com), which is a Help Builder like system built ontop of my popular [Markdown Monster](https://markdownmonster.west-wind.com) editor.

As part of that tool there's a new option to create a self contained documentation viewer application that can be used to browse the online documentation offline. 

Here's what that looks like for Web Connection:

![](https://webconnection.west-wind.com/docs/images/WebConnectionDocumentationViewer.png)

All the functionality of the Web site is available in the offline Viewer so you get all the same docs - offline. 

The big benefit from my end is that's easy and fast to build so this documentation is much easier to keep in sync with the online documentation. 

The tool produces a self contained EXE that itself is very small. The size of the EXE is determined primarily by the size of the documentation which is embedded inside of the Exe and unpacked when run. That said the Web Connection file is still in the 20mb range zipped due to the huge amount of content and media. The Exe has no dependencies as it runs on the built-in .NET framework.

You can check it out from here:

* [Download the Web Connection Documentation Offline Viewer](https://webconnection.west-wind.com/docs/West-Wind-Web-Connection/Offline-Documentation.html)

## Summary
Overall this is a very small release that's primarily been released for the bug fixes (which have been avaiable for a while in the Experimental Updates Zip file as soon as they were discovered and fixed).

I would recommend updating to the latest version if you are on 8.1-8.3.
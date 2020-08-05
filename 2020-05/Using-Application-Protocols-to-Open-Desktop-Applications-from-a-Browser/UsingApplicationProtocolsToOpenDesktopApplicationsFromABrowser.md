---
title: Using Application Protocols to Open Desktop Applications from a Browser
abstract: Application Protocols allow you to open an application using either shell protocols using ShellExecute or a WebBrowser using syntax like `markdownmonster:open` or `markdownmonster:untitled`. This can be an easy and useful mechanism for launching applications especially from a browser.
categories: HTML, Web, .NET
keywords: Application Protocols, Execute, Binary, Launch
weblogName: Rick Strahl WordPress
postDate: 2020-05-16T08:53:08.0358185-10:00
customFields:
  mt_publishon:
    key: mt_publishon
    value: 05/10/2017 08:00
  mt_location:
    key: mt_location
    value: Maui, Hawaii
    
---
# Using Application Protocols to Open Desktop Applications from a Browser

I've been playing around with some idea on how to get my Markdown Monster editor to launch from within a browser. I'm currently working on a couple of documentation project and one feature that would be very handy is to have an **Open in Markdown Monster** button to edit text. There are other ways to skin that cat, from editing inside of the browser etc. But in this case all the templates and of all the sophisticated editing functionality is all there already.

I'm going to make this a two-part post related to Browser to Desktop communication. This part discusses Application Protocols which is an OS supported feature. In the next part I'll talk about cross application communication that addresses some of the shortcomings of Application Protocols.

## Communication from Browser to Desktop
Communication between a browser and a desktop application at first glance seems completely off limits, right? Browsers don't have access to an underlying OS or the applications hosted on it, so it seems like it would be impossible to cause an external application to be 'loaded'. Which is as it should be - long gone are the old days of IE ActiveX controls where it was possible to instantiate COM objects or binary ActiveX controls and load them in the browser. That was some scary shit although at the time it was first announced it seemed like a good idea. Many vulnerabilities later taught us otherwise.

There are a number of mechanisms that you can use to communicate between browser and desktop however. But on their own for the most part they are fairly limited - it requires some combination of them to effectively use them.

Here are a few approaches available:

1. Application Protocols (for launching applications and send minimal data)
2. Desktop App Web Server hosted for Browser to connect to
3.  Web Socket Server for Desktop App

In these two articles I'll focus on #1 and #3 first individually and then in combination.

## What are Application Protocols
You may not have heard of the term **Application Protocols**, but you've almost surely used them before. I used refer to Application Protocols as **URL Monikers** (dating back the IE protocol handlers) or you might have heard others refer to them as **Url Schemes**.

In a nutshell Application Protocols are the prefix used on a URL that determines the *protocol* used for that URL. The most obvious of these *schemes* are `http:<url>` and `https:<url>`. Others you've used are `mailto:<emailAddress>`, `ftp:<site>`. Others yet you might have seen are application specific handlers like `skype:<number>` or `zoom:<meetingId>` to name a couple.

Application Protocols can be created for **any application**, and so I created a `markdownmonster:` Application Protocol handler. Protocol handlers can be used as:

* URLs in a browser
* Can be executed by `ShellExecute`

it requires entries in the Administrative `HKEY_ROOT` hive of the registry, meaning that you need an installer or at minimum and Admin elevated process to create these handlers.
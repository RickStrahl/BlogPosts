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


## What are Application Protocols
You may not have heard of the term **Application Protocols**, but you've almost surely used them before. I used refer to Application Protocols as **URL Monikers** (dating back the IE protocol handlers) or you might have heard others refer to them as **Url Schemes**.

In a nutshell Application Protocols are the prefix used on a URL that determines the *protocol* used for that URL. The most obvious of these *schemes* are `http:<url>` and `https:<url>`. Others you've used are `mailto:<emailAddress>`, `ftp:<site>`. Others yet you might have seen are application specific handlers like `skype:<number>` or `zoom:<meetingId>` to name a couple.

Application Protocols can be created for **any application**, and so I created a `markdownmonster:` Application Protocol handler that lets you activate Markdown Monster externally.

Protocol handlers can be invoked from:

* A Url from a Web Browser
* Via Windows `ShellExecute`

which means that it's possible to do simple interactions from just about any type of application.

## Installation Required
There's a catch however: Application Protocol handlers have to be registed on the machine. On Windows this means registering via a few Registry keys that define the **Moniker** (ie. `markdownmonster:`) and which application gets invoked. It's somewhat similar to extension mappings in Windows, which map an application extension to a shell command.

Once registered Windows then launches the shell command that is registered for the moniker with a command line that is the entire moniker.

It's up to your application to handle the moniker and to come up with an appropriate moniker syntax to determine what you need to do in response to a given moniker *command*.

There are a couple of approaches I've seen:

1. **Multiple protocol handlers for different operations**  
This scenario uses multiple separate moniker registrations that all map to your main executable.  So you'd use monikers  like `markdownmonster.open:` and `markdownmonster.new` with multiple sets of registry entries for each.

2. **Single Protocol Handler with Action Commands**  
Rather than registering several protocol handlers, a single protocol handler includes both the command and the parameter(s) for each operation.

I opted for the latter, since we need to already parse the inbound file moniker string anyway. 
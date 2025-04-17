---
title: Web Connection 6.21 is here
abstract: 'Web Connection 6.21 has been released. This is a small maintenance release that fixes a few small bugs and makes a few small performance tweaks.  There are also a couple of new features: wwDotnetBridge Event handling for .NET Objects, new .NET Runtime Loader with better error reporting and a new Console Configuration task to fix the annoying Loopback Check that can prevent server local Windows account authentication.'
keywords: Web Connection, 6.21, Release Notes
categories: Web Connection
weblogName: Web Connection Weblog
postId: 940
postDate: 2018-06-14T23:57:37.4190622-07:00
---
# Web Connection 6.21 is here

![](webconnection.jpg)

We've released [Web Connection 6.21](https://webconnection.west-wind.com) which is a relatively small update that has a few bug fixes and operational tweaks.

There are also a few new features, one of which is not Web specific but a very useful generic FoxPro enhancement feature.

* **wwDotnetBridge now supports Event Handling for .NET Objects**   
* **New .NET Runtime Loader for wwDotnetBridge**  
* **Console command for Disable Loopback Check**

As always registered users of version 6.x, can download **free registered version updates** with download information that was sent by email. To check out Web Connection you can always pick up the shareware version:

* [Download West Wind Web Connection for Visual FoxPro](https://webconnection.west-wind.com/download.aspx)

## Event Handling for wwDotnetBridge
This is a cool feature that opens up additional features of .NET to FoxPro. You can now use wwDotnetBridge to handle .NET events in an asynchronous manner. Similar to the behavior of async method calls that was introduces a few releases back you can now handle events in .NET and get called back, **without having to register the .NET component and implement a COM interface**.

This was previously not possible or at the very least required that you created a COM object and interface that mapped the .NET type and was registered. With this new functionality you can now use only wwDotnetBridge without any sort of special registration or even having to implement a FoxPro interface. You can simply create a proxy object that can handle select events that you **choose to handle**. Other events are simply ignored.

So what can you do with this? Here are a few example ideas:

* Use SMTPClient natively and get notified on Progress events
* Use WebClient and get notified of Web Events
* Use the FileSystemWatcher on a folder and be notified of file updates

Basically most components that use events can now be used with wwDotnetBridge! 

This feature was landed in the OSS version of wwDotnetBridge by a contributor, [Edward Brey](https://github.com/breyed), who did most of the work for the event handling. Thanks Ed!

### An Example
The following is an example using the .NET [FileSystemWatcher](https://msdn.microsoft.com/en-us/library/system.io.filesystemwatcher(v=vs.110).aspx) object which allows you to monitor any file changes and updates in a given folder and optionally all of its subfolders.

The following monitors all changes in my `c:\temp` folder and all its subfolders which includes my actual Windows Temp folder - meaning it's a busy folder, lots of stuff gets written to temp files in Windows, so this generates a lot of traffic.

```foxpro
CLEAR
LOCAL loBridge as wwDotNetBridge
loBridge = GetwwDotnetBridge()

*** Create .NET File Watcher
loFW = loBridge.CreateInstance("System.IO.FileSystemWatcher","C:\temp")
loFw.EnableRaisingEvents = .T.
loFw.IncludeSubDirectories = .T.

*** Create Handler instance that maps events we want to capture
loFwHandler = CREATEOBJECT("FwEventHandler")
loSubscription = loBridge.SubscribeToEvents(loFw, loFwHandler)

DOEVENTS

lcFile = "c:\temp\test.txt"
DELETE FILE ( lcFile )  
STRTOFILE("DDD",lcFile)
STRTOFILE("FFF",lcFile)

* Your app can continue running here
WAIT WINDOW

loSubscription.Unsubscribe()

RETURN


*** Handler object implementation that maps the
*** event signatures for the events we want to handle
DEFINE CLASS FwEventHandler as Custom

FUNCTION OnCreated(sender,ev)
? "FILE CREATED: "
?  ev.FullPath
ENDFUNC

FUNCTION OnChanged(sender,ev)
? "FILE CHANGE: "
?  ev.FullPath
ENDFUNC

FUNCTION OnDeleted(sender, ev)
? "FILE DELETED: "
?  ev.FullPath
ENDFUNC

FUNCTION OnRenamed(sender, ev)
LOCAL lcOldPath, lcPath

? "FILE RENAMED: " 
loBridge = GetwwDotnetBridge()

lcOldPath = loBridge.GetProperty(ev,"OldFullPath")
lcPath = loBridge.GetProperty(ev,"FullPath")
? lcOldPath + " -> " + lcPath

ENDFUNC

ENDDEFINE
```

### How does it work?
The event handling is based on a simple callback mechanism that uses a FoxPro event handler that is passed into .NET to be called back whenever an event occurs. The behavior is similar to the way the `BINDEVENT()` works in FoxPro with a slightly more explicit process.

Allows you to capture events on a source object, by passing in a callback handler that maps the events of the target object with corresponding methods on the handler.

To handle events:

* **Create an Event Handler Object**  
Create a `Custom` class that implements methods that match the events of the .NET object that fires events with a `On<EventName>` prefix. Each 'asdd' method's parameters should match the parameters of the .NET event delegate. You only need to implement the methods you want to listen to - other events are ignored.

* **Create an Event Subscription**  
Call `loBridge.SubscribeToEvents()` which binds a .NET event source object to a FoxPro event handler.

* **Continue running your Application**  
Events are handled asynchronously in .NET and run in the background. Your application continues running and as events fire in .NET, the `On<Event>` methods are fired on the Event Handler object in FoxPro.

* **Unsubscribe from the Event Subscription**   
When you no longer want to listen to events, call `loSubscription.UnSubscribe()`. Make sure you do this before you exit FoxPro or you may crash VFP on shutdown.

The key here is that you have to make sure that the .NET object that you want to handle events on as well the event handler stay alive because they essentially run in the background waiting for events to fire. This means storing these references on permanent objects like your main application's form or the FoxPro _screen or global variables.

Events are not as prominent in .NET as they used to be back in the high flying days of UI frameworks. Few operational components fire events, but many of the core system IO services have events you can handle. Progress events and completion are common.

Now we have the tools to use these event in the same easy fashion as all other .NET access with wwDotnetBridge. 

## New wwDotnetBridge .NET Runtime Loader
In this release the .NET runtime loader used for wwDotnetBridge has been updated to use the latest loader specific for .NET 4.0 and later. In past years we weren't able to use the new loader because the older versions still loaded .NET 2.0, but with the switch to 4.5 recently we can now take advantage of the new loader.

There are a couple of advantages here. The new loader is the officially recommended approach and provides a cleaner path to runtime loading, and more importantly it provides more error information. Previously the error information available from CLR loading was very cryptic as the runtime did not report the underlying error only a generic load failure error. The new version reports the underlying error information which is now passed to wwDotnetBridge.

This feature was also landed by Edward Brey in the OSS version of wwDotnetBridge.


## Console Command for disabling the Loopback Check Policy for Authentication on Servers
On servers and now also on newer versions of Windows 10 (?), IIS enforces local loopback check policy which **doesn't allow for local Windows authentication to work**. If you try to access the Admin pages with authentication it will fail if the policy is applied. This can be a real pain when accessing the Web Connection Admin pages which by default rely on Windows Authentication to allow access to the Admin functionality.

The problem manifests if you try to login - you will not be able to use valid login credentials to actually authentication. Instead you get `404.3` errors which are auth errors.

Windows Servers have a policy that explicitly enable this **Loopback Checking** policy that effectively disables Admin access. Recently I've also noticed that on Windows 10 1803 I also couldn't access local addresses when using custom mapped local domains (ie. test.west-wind.com mapped to my localhost address). 

There is a workaround for this issue by using a registry hack. This release now has a Console function that lets you set this registry setting without having to hack the registry manually:

```
console.exe DisableLoopbackChecking
```

I also wrote up a blog post with more information today:

* [IIS Server Authentication and Loopback Restrictions](https://west-wind.com/wconnect/weblog/ShowEntry.blog?id=939)

## Release Summary
Besides the marquee features, there are just a few small tweaks and bug fixes to the core libraries.

To see all that's changed in recent versions:

* [What's new in Web Connection](https://webconnection.west-wind.com/docs/_s8104dggl.htm)

As always, let us if you have questions or run into issues with new features or old on the message board:

* [West Wind Message Board](https://support.west-wind.com)

Enjoy...

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
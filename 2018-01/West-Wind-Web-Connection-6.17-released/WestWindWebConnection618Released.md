---
title: West Wind Web Connection 6.18 released
abstract: West Wind Web Connection 6.18 has been released. It's a small release with only one major feature update in the way of bringing back Apache support for Apache 2.4. Here's more info what's new.
keywords: Web Connection,FoxPro,Web,Apache
categories: Web Connection,Release Notes
weblogName: Web Connection Weblog
postId: 935
---
# West Wind Web Connection 6.18 released

![](WebConnectionLogo.jpg)

Time to ring in the new year with another [West Wind Web Connection](https://west-wind.com/webconnection) update and version 6.18. This release is mostly a maintenance release that fixes a few small bugs and updates a few existing features with minor enhancements.

Here's some more detail on what's new.

### Apache Support is back
I removed Apache support in Web Connection 6.15 and 6.17 due to some difficulties in getting Web Connection to run on the latest version of Apache that required rewriting the Apache module to work under Apache 2.4. I deemed this to be too much of a hassle as the user base of Apache users is quite small and there had been very little support for this platform in the first place.

Well, it turns that user base is very vocal and hardcore about usage of Apache, which surprised me. Even so I was not inclined to update Apache support until one of our customers offered to sponsor a good chunk of the development time to update Apache support for Apache 2.4. Thanks to this sponsorship I'm happy to announce that Apache support is now back in Web Connection 6.18!

There are also a number of additional enhancements in the Apache support that improve on previous versions.

Specifically the `PHYSICAL_PATH` and `MD_APPL_PATH` variables which provide the physical path of both the script file and the application's physical base path. The latter is a concept not really directly supported by Apache which only supports access to the root **site** path, not support for virtual paths. However, based on some conventions (bin/wc.dll location) it was possible to provide these values.

> Make sure you run wc.dll out of the `bin` folder in Apache to ensure these values work as expected.

Using these enhancements now makes Apache behave a lot more closely to IIS. In fact, it's possible to run Apache now without the custom `wwApacheRequest` class although I still recommend you use it as it provides a number of fallbacks if stock paths are not found.

### Apache Configuration
The Apache configuration for new projects has also been reworked with a simpler to use newer configuration options and provide a more manageable virtual folder and script mapping setup.

### JsonString() and JsonDate() function in wwUtils**   
Web Connection includes the `wwJsonParser` class for properly parsing any kind of value or object to JSON. While that object works fine, there are a few simple things that often need to be performed with JSON strings and dates, and for this there are now simple `JsonString()` and `JsonDate()` helpers that let you use a one-liner to convert values more easily.

These functions are in addition to the the `JsonSerialize()` and `JsonDeserialize()` function also in wwUtils, which were introduced in Web Connection 6.17.


### Unload and Reload Individual COM Servers
The .NET Handler now includes the ability to unload a specific COM server based on its process ID. When shut down a server is shutdown in an orderly COM release cycle followed by a Kill cycle if the clean shut down fails. A new instance is then automatically restarted and added back to the pool.

This function is very useful for administrative tooling and monitoring that can perhaps monitor the health of Web Connection processes, and when detecting an abnormality like too much memory use shutting down a specific instance via HTTP request. 


### Close FoxPro when Web Connection is Running in File Mode
When Web Connection is running inside of Visual Foxpro as a development server, you can't use the Window close button on the FoxPro window, or a Taskbar close click to shut down FoxPro. This is because Web Connection is stuck in a READ EVENTS loop which prevents FoxPro from shutting down.

This update includes logic that uses `BINDEVENT()` to the Windows `WM_CLOSE` event and when it detects this messages releases the event loop and explicitly shuts down.

This is also useful for admin scenarios similar to the Unloading of an individual COM server, except that file servers are more difficult to manage. This fix allows for an external application to gracefully shut down a running Web Connection instance. For more info see my recent blog post [Shutting down file-based Web Connection Instances with WM_CLOSE Messages](https://west-wind.com/wconnect/weblog/ShowEntry.blog?id=934).
For more info see my recent blog post [Shutting down file-based Web Connection Instances with WM_CLOSE Messages](https://west-wind.com/wconnect/weblog/ShowEntry.blog?id=934).


### Summary
There are a few additional small bug fixes but overall this release is a very small one with the exception of the Apache support. Easy does it with this release... it's all that's needed for the moment.
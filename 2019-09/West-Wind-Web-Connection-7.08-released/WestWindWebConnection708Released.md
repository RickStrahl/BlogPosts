---
title: West Wind Web Connection 7.08 Release Notes
abstract: West Wind Web Connection 7.08 is here. This is a small maintenance release with a number of bug fixes and a few small feature enhancements.
categories: FoxPro,Web Connection
keywords: FoxPro,Web Connection,Live Reload
weblogName: Web Connection Weblog
postId: 954
postDate: 2019-09-01T00:40:33.3547833-07:00
---
# West Wind Web Connection 7.08 Release Notes

![](https://webconnection.west-wind.com/images/webconnection_code_banner.png)

Web Connection 7.08 is out and this release, as the last one, is mostly a maintenance release that fixes a few small bugs and provides some minor behind the scenes tweaks to existing functionality.

The theme of this release has been a focus on the development time experience and the changes in this update continue along these lines with additional improvements to the new `Launcher.prg` and the Live Reload Functionality.

## Live Reload Enhancements
If you missed it, starting in v7.05 Web Connection started providing support for live reloading of content when you make a change to either client side HTML/CSS/JS, a server side template or script or even your process class code. Live Reload when enabled detects that a change was made to a file of interest and then automatically refreshes the current page in the active Web browser. This technology works through the magic of WebSockets which allow the Web Connection Server Module to communicate with script code running inside of the browser to refresh the page.

Live Reload is an immense time saver as you can work on your code and as you make changes have update the live browser with rendered output. If you can run side by side with your Editor or IDE or on another monitor, and you can immediately and in real time see these changes reflected on the page your browser is currently on. Any change triggers an update to the browser.

If you've never used this way of working before, especially for your HTML/CSS and template code, it's hard to describe how much of a productivity boost this provides.

To give you an idea how this works here is a short screen capture that highlights the features:

![](https://westwindserverstorage.blob.core.windows.net/blogimages/2019/05/LiveReloadAndBrowserSyncFoxPro.gif)

As mentioned Live Reload was initially added in 7.05, initially with a third party requirement for the NPM BrowserSync tool. In 7.06 Web Connection switched to an internal implementation directly inside of the `WebConnectionModule.dll` so the third party dependency was removed.

In Web Connection 7.08 we've made it even easier to configure Live Reload which has to be enabled explicitly in order to work and reducing the steps to 3 small configuration changes. You can find out more about configuring Live Reload as well as some additional detail on features in the [Online Documentation Topic](https://webconnection.west-wind.com/docs/_5hm1e6kmv.htm).

> ### @icon-info-circle Upgrading Live Reload from a previous Version
> The configuration for Live Reload has changed how static HTML files are intercepted. There's a new HTML mapping that can be enabled along with Live Reload to handle Live Reload for static HTML files. This removes the need to add a custom module and use `runManagedModulesForAllRequests` to force all requests through the ASP.NET runtime, which improves performance and simplifies configuration somewhat.  
>
> If you are upgrading from 7.06/.05:
>
> * Remove the `<modules>` configuration from web.config
> * Map the `*.htm*` in the `<handlers>` section to the WC Handler
>
> Detailed configuration info is available [in the documentation](https://webconnection.west-wind.com/docs/_5hm1e6kmv.htm).

## Visual Studio Addin updated for Visual Studio 2019  
Microsoft continues to muck with the Visual Studio addin APIs and it's been necessary to update the addin hookups and configuration in order to work with recent versions of Visual Studio 2019. The most recent requirements resulted in the Web Connection module forcing a yellow warning bar during Visual Studio startup.

Starting with Web Connection 7.08, the addin now implements async loading, which was the cause for the warning message. Async loading prevents addins from loading until they are actually invoked from a menu option, helping to improve Visual Studio startup times.

## JSON Sizing
Web Connection has support for generating JSON output using standard FoxPro code, which is fairly efficient. In the past however there have been size limitations to the JSON output. While I don't recommend creating massive JSON documents that exceed the FoxPro 16meg string limit, that's now actually supported.

JSON size is limited by the FoxPro 16 meg limit, but due to the inefficiencies of JSON generation presizing a buffer the JSON string parser used an overly pessimistic pre-sized buffer to hold JSON text that is passed to internal APIs. 

In v7.08 we changed the logic to maximize the buffer size at FoxPro's Max string size and handle errors if the buffer is overrun more gracefully. This will allow JSON string parsing up to the FoxPro 16 meg limit now where as before it was of the potential max buffer size.

Note that large JSON documents that are even approaching 16 megs are going to be **very, very slow** to parse even with efficient parsers in other languages like .NET. JSON is a great format for data transfer, but it's not so good with very large documents as the tree parsing requires excessive memory. For this reason I would highly recommend you make sure you are not creating very large JSON files. If you really need to transfer that much data, it's often better to use XML (yes XML parsing is actually faster for larger documents), packed Zip files of actual data files (using [EncodeDbf](https://webconnection.west-wind.com/docs/_2tb1c5jlk.htm) perhaps). But even better is to break up huge data files into smaller more atomic chunks that can be put back together when received.



## Upgrading
In order to upgrade existing production applications you'll want to:

* **Delete all FXP files in the project directories**
* **Recompile all PRG and VCX files**
* **Update DLLs in production apps**
* **Update the Web specific files (DLLs, Scripts,CSS)**

There's lots of good update information in the [Updating from previous Versions](https://webconnection.west-wind.com/docs/_2jw0bpb4d.htm) topic in the documentation.
    
    


## Summary
As promised v7.08 is very small update and the primary reason for it was to fix a few small bugs that been fixed. The Live Reload and VS Addin enhancements are a side effect bonus. 

Web Connection is a mature product, so changes come less frequently now - most deal with improvements to the development process and updates to the client side libraries and this small incremental update pace every few months is likely to continue.

The good news is that these small incremental upgrades mean minimal work for you to get up to a new version. Happy upgrading...

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
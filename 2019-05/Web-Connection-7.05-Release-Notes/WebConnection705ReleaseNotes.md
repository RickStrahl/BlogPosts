---
title: Web Connection 7.05 Release Notes
abstract: Web Connection 7.05 is here! This release is primarily a maintenance release that has a few small fixes and a few performance enhancements. But there are also a number of pretty cool new features that I'm pretty excited about. In this post I'll dig into some of the new features with more detail.
keywords: Web Connection,Release Notes
categories: Web Connection,FoxPro
weblogName: Web Connection Weblog
postId: 951
postDate: 2019-05-07T01:04:17.8303267-10:00
---
# Web Connection 7.05 Release Notes

![](https://webconnection.west-wind.com/images/webconnection_code_banner.png)

Web Connection 7.05 is here! This release is primarily a maintenance release that has a few small fixes and a few performance enhancements. But there are also a number of pretty cool new features that I'm pretty excited about.

### A new Launcher for new Projects
This may not sound that exciting, but for new users the new `Launch.prg` that gets generated into any new project should make it **much easier** to launch your applications, especially if you chose to use a Web Server that doesn't automatically start like IIS Express or Browser Sync.

Web Connection 7.0 started shipping with a `Launch.prg` and the docs have been updated to use `DO Launch` in order to start your application instead of `DO YourAppMain.prg`. The latter still works but `Launch.prg` does a number of other things on your behalf:

* Sets the Environment to add required paths
* Launches an external Web Server if required (IIS Express, Browser Sync)
* Launches your application: `DO YourAppMain.prg`
* Launches a browser and opens the appropriate URL

`Launch.prg` is generated when a new project is created and so it includes all the required path dependencies and it knows whether you chose IIS or IIS Express during setup so that `DO Launch` just works and does the right thing. So if you chose IIS Express during configuration for your new project, Launch will automatically start IIS Express, and open the IIS Express specific URL (which is different than the IIS URL).

But you're not limited to that. Launch.prg can launch your applications for various supported modes including IIS, IIS Express and Browser Sync or by simply launching your FoxPro server.

In 7.0 Web Connection also shipped a separate `BrowserSync.prg` file to integrate with the great [BrowserSync](https://browsersync.io) utility. BrowserSync is a NodeJs based utility that you can install that allows you automatically detect file system changes for specific files and if changes are detected automatically refreshes the browser. It's great for refreshing Web pages, CSS, HTML, JavaScript and immediately see you changes reflected in the browser without manually reloading the page in the Browser. It's highly productive for an interactive workflow and can really speed up the client side development cycle when changing layout, writing JavaScript code or tweaking CSS. 

You can find out more about browser Sync [in the docs](https://webconnection.west-wind.com/docs/_5cc1a6ads.htm) and in [this blog post](https://www.west-wind.com/wconnect/weblog/ShowEntry.blog?id=943).

In 7.05 the BrowserSync functionality has been rolled into `Launch.prg` which now supports a number of different explicit operational modes:

* **DO LAUNCH WITH "IIS"**
* **DO LAUNCH WITH "IISEXPRESS"**
* **DO LAUNCH WITH "BROWSERSYNC"**
* **DO LAUNCH WITH "BROWSERSYNCIISEXPRESS"**
* **DO LAUNCH WITH "NONE"**   && or "SERVER" 

Each mode has specific operations it performs and launches the appropriate operations. Note that the last option using `"NONE"` or `"SERVER"` simply launches the Web Connection FoxPro server. The advantage of using the Launch syntax over direct launch is that it also sets up the environment.

`Launch.prg` is just a short FoxPro program and because it's code you can customize it. Want to add additional paths during startup? Start up another application in the background? You can do that. It gives you an extra level of control.

For new developers getting started having a single PRG that does everything to start the server will reduce friction. But for old hands it's also useful because it also makes it very easy to switch between modes - I can easily switch back and forth between running on IIS, IIS Express or using Browser Sync.

`Launch.prg` gets generated with new projects, but if you have an existing project and you want to take advantage of this you can do that pretty easily simply createing a new project, copying `Launch.prg` into your existing project and then making a few small changes to the files startup header that parameterizes the script.

To find out more check out the [Launch.prg documentation](https://webconnection.west-wind.com/docs/_5h60q6vu5.htm).


### Live Reload Server
Browser Sync is a huge help in speeding up the client side development cycle. In 7.05 Web Connection now also adds a Live Reload feature for **server side code**. By running a file watcher as part of the Web COnnection server optionally, Web Connection can now monitor for code file changes and if it detects one, automatically restart your FoxPro server.

The current scenario for this involves a lot of steps:

* Run your program
* Find a bug
* Program Stops and you edit the code
* Save the code
* Close everything (CLOSE ALL, CLEAR ALL etc.)
* Start the Web Connection Server again
* Refresh your browser

Using the `LiveReloadServer` configuration switch in `yourApp.ini` you can put the server into LiveReload mode after which you can make a code change and immediately and automatically get your server restarted. Which reduces the steps to:

* Run your code
* See an error message
* Use an **external editor** to fix the code
* Save your code
* Web Connection Restarts, and Browser AutoRefreshes (if using Browser Sync)

In order for this to work a couple of things should be in place:

* Best to run with DebugMode OFF
* Must edit code with an external editor (VS Code or another instance of FoxPro)
* If you use the FoxPro editor make sure auto-compilation is off
* Best when run in combination with Browser Sync

Here's what this looks like:

![](https://west-wind.com/wconnect/weblog/imageContent/2019/Building-a-Web-Connection-Live-Reload-Server/LiveReloadAndBrowserSync.gif)

Note I'm using [Visual Studio Code](https://code.visualstudio.com/) for my editing in this example, but you can really use any editor including the FoxPro editor for Fox code editor.

The combination of both BrowserSync and the Live Reload for the server can basically automate the entire run/debug/edit/restart cycle and reduce it down to basically just using your editor to make a change and save.

I'm really excited about this especially in combination with `Launch.prg` because it's now trivial to switch into BrowserSync mode.

For more detail check out [the documentation](https://webconnection.west-wind.com/docs/_5h50xhgpy.htm) and [this blog post](https://west-wind.com/wconnect/weblog/ShowEntry.blog?id=950).

### wwHttp Improvements
wwHttp now has support for downloading string results that are greater than 16megs. As you know FoxPro has a 16 meg string size limit, but t[here are some ways around the 16 meg limit](https://west-wind.com/wconnect/weblog/ShowEntry.blog?id=882) if **you are careful** what you do with your strings. Well, wwHttp now is careful and you can return larger strings. Now **you** have to be careful what you do with the returned string :smile:

Note that I think if you are expecting to receive something that large, that you should probably stream that data directly into a file and not into a string which is a feature that's always been available in `HttpGet()` and now also in all the new Verb related functions( **Get(), Post(),Put(), Delete()**).

If you are downloading you'll also be happy to find that you can now adjust the buffersize used to capture each download frame that determines how much data is grabbed at a time for the file download. Previously the buffer was capped at 24k which is pretty small when you're downloading a 16 meg file. You can now use the `nHttpWorkBuffersize` to set a larger buffer. The default has been bumped up to 64k which makes large file downloads go much faster. The default buffer size is also automatically adjusted to the size of the output. The value provided is a max value, so if the content is small the buffer is sized only to the size of the small buffer. This reduces memory overhead as well. For large downloads you might want to bump the buffer up to 128k or even 256k or so to really make it go fast.

### A few Odds and Ends
There's a new option on the Markdown parser that optionally disables HTML support when parsing Markdown. This means that HTML inside of the Markdown is treated as plain text, rather than evaluating the HTML (which is valid Markdown). On many sites you don't want to allow users to input HTML, but you might still want to take advantage of Markdown otherwise and this options makes that possible.

The WebLog sample has been updated with a number of tweaks. In 7.0 the sample was switched to the MVC framework from the previous Web Control Framework so it's now more in line with the general recommendations for Web COnnection development. Additionally the comment system has been re-written and there are now options to remove comments directly in the message list.

### Summary
There are a number of additional small fixes and performance improvements in this release too insignificant to enumerate here. This release has no breaking changes but as always you should update all your application dlls to the latest versions in your project folder and in the Web Site's `bin` folder.

Other than that this release is 



<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
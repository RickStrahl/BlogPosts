---
title: Web Connection 7.06 Release Notes
abstract: Web Connection 7.06 release notes. This is a maintenance release with a couple of cool new development time feature enhancements for Live Reload and an updated Launcher.
keywords: Live Reload,Web Connection,7.06,Launcher
categories: Web Connection, FoxPro
weblogName: Web Connection Weblog
postId: 952
postDate: 2019-05-23T09:50:17.4243665-10:00
---
# Web Connection 7.06 Release Notes
![](https://webconnection.west-wind.com/images/webconnection_code_banner.png)

Time for another [Web Connection](https://webconnection.west-wind.com) update this time for version 7.06. This is above all maintenance release that fixes a few small bugs that made it into the original 7.05 release - those bugs were fixed immediately and updated at the time, but just to make sure there's a consistent release that includes all the bug fixes plus a few additional ones.

In addition there are a couple of major enhancements:

* New and Improved Live Reload Functionality
* Updated Launcher with `Launch.prg`

You can download the latest version from:

* [Download Web Connection Shareware Version](https://webconnection.west-wind.com)
* [Purchase Web Connection](https://store.west-wind.com/product/wconnect70)
* [Upgrade to Web Connection 7.x](https://store.west-wind.com/product/wconnect70_up)
* If you're registered for 7.x, you should have gotten an update notice by email

## New Live Reload Functionality
Live Reload is a productivity feature for development that can automatically refresh your browser and restart your FoxPro server (if needed) when you change code or markup logic in your application at development time. 

### What is Live Reload?
Live Reload watches any files in your code and web folders and when it finds changes can automatically refresh the current page in the browser. On the server Web Connection can automatically restart the Web Connection server, so you can make a change at any time and **immediately** see that change reflected in the browser without having to explicitly shut down and restart your server, and refresh the browser. It's a huge productivity enhancer plus it allows for much better visualization of the code - especially UI code - that you are working on.

Here's what this feature looks like in action:

![](https://westwindserverstorage.blob.core.windows.net/blogimages/2019/05/LiveReloadAndBrowserSyncFoxPro.gif)

It's not 100% clear in the video, but all I'm doing is changing code and markup. I'm not stopping the Web Connection server or refreshing the browser manually - the refreshes and restarts **happen completely automatically**.

### Live Reload and Web Connection
Live Reload functionality was introduced in Web Connection 7.05 with the help of a third party tool called [Browser Sync](https://browsersync.io) to provide the browser refresh functionality. In version 7.06 we've **pulled the core functionality directly into Web Connection** so you no longer need to use BrowserSync - the Live Reload functionality now lives natively in the Web Connection .NET Module via built-in WebSocket support. The new implementation is much faster since the changes are detected directly at the source and refreshed without any delay.

Inside of the .NET Module Web Connection injects a bit of script code that lets the server communicate with the browser to force a page refresh into any HTML content rendered both for script mapped pages directly mapped to Web Connection as well as static HTML pages.

### Enabling Live Reload in 7.06+
Live Reload is disabled by default, because it adds some request overhead and requires that **ALL** requests including static files are routed through the Web Connection module. This is totally fine during development, but at runtime you wouldn't want this behavior. The functionality is also not useful at runtime.

So this feature needs to be explicitly activated.

**In web.config:**

* Set **LiveReloadEnabled** configuration to `True`
* Enable **runAllManagedModulesForAllRequests**
* Uncomment **Web Connection Live Reload Module** hookup

**In yourApp.ini**:

* Set **LiveReloadEnabled** to `On`

You can find out more detail on how to [enable Live Reload in the documentation](https://webconnection.west-wind.com/docs/_5hm1e6kmv.htm#enabling-live-reload).

### Support for Old Projects
The necessary server reload logic gets embedded in new projects via the New Project Wizard. This code can easily be adapted however and added to existing projects.

For more information how to add the server recycling code into your existing main program files of older applications, please check out the [details in the Help Topic](https://webconnection.west-wind.com/docs/_5hm1e6kmv.htm#hooking-up-in-appmain.prg).

### Update your WebConnectionModule.dll
The new Live Reload Features are built into  `Web\Bin\WebConnectionModule.dll` Web Connection .NET Handler, and you will need to update that file in your Web projects for Live Reload to work. Make sure your Web Connection Module Administration page shows version 7.06 or later. 

You will also need to add `Microsoft.WebSockets.dll` which provides the Web Socket functionality used for the in-browser communication.

Finally Live Reload requires WebSocket support and it's supported only on Windows 10 & 8.1 and Server 2012R2 and later.

## Updated Launch.prg 
In version 7.05 Web Connection also introduced a new launcher for new projects. `Launcher.prg` can be used as a wrapper around your main program to launch your application, start the Web Server (in the case of IIS Express), open a browser window and also handle configuration on your startup environment.

The reason we added this was to automate some of the manual steps you have to go through to launch a Web Connection project for the first time to make it easier for new users to get started.  In addition to launching, the launcher also prints some status information of what it's running to the Desktop to make it clearer to new users what actually is going on (you can see that text behind the main window in the video).

Today when you create a new project Web Connection generates a custom `Launch.prg` for a project and then starts it when automatically with `do launch` for the Web server you chose. 

To use this feature you can simply do:

```foxpro
*** Default Launch for Server type Generated
DO LAUNCH

*** Launch IIS Express explicitly
Launch("IISEXPRESS")

*** Launch IIS explicitly
Launch("IIS")

*** Launch without starting the server and no browser opened
Launch("SERVER")
```

The first options are self-explanatory. The last one is similar to doing `DO YourAppMain.prg`, but it also fires the environment set up code to change path, set paths to Web Connection libs etc.

### Make it Your's
`Launch.prg` is a 'script' - it's generated with a new project **specifically for the project** which means you can make changes to it. If your environment requires additional settings - drive mappings, extra paths, making sure that other EXEs are running etc. - you can add that to your copy of `Launch.prg`.

### Creating Launch.prg for an Old Project
By default `Launch.prg` is generated for new projects. But if you have an existing project you can easily create a new `Launch.prg` file by copying one from a new or existing project. All the configuration settings that change are defined at the top of the file so you can just change the relevant settings. 

For example the following are for the TestProject I used in the Video above:

```foxpro
*** Generated Defaults
lcVirtual = "TestProject"
lcAppName = "Testproject"
lcScriptMap = "tp"
lcWcPath = ADDBS("C:\WCONNECT\FOX\")
lcWebPath = LOWER(FULLPATH("..\web"))
lcIisDomain = "localhost"     && test.west-wind.com
llIisExpress = .F.
```

## Version 7.06 Summary
There you have it: Web Connection 7.06 is a relatively small update. The main reason we pushed this out so quickly after 7.05 is to get the Live Reload and Launch features out as quickly as possible before adoption of the features introduced in 7.05 get into too many setups. Although this version makes a change to those older settings the changes are very minor. It's better to do it now while those changes are fresh in everybody's mind.

## Resources

* [Download Web Connection](https://webconnection.west-wind.com/download.aspx)
* [Web Connection Change Log](https://webconnection.west-wind.com/docs/_s8104dggl.htm)
* [Live Reloading Content during Development in Web Connection](https://webconnection.west-wind.com/docs/_5hm1e6kmv.htm)
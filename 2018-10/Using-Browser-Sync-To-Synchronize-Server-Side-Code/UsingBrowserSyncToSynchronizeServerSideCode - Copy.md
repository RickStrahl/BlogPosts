---
title: Using Browser Sync To Synchronize Server Side Code
abstract: Live reloading is common in client side applications, but server side applications generally don't have the ability to automatically reload when a server side change is made. But there are tools that allow you to monitor your local development Web server - even non-NodeJs based ones - and can automatically reload the active page when a change is detected. In this post I look at how to use Browser Sync to be more productive
categories: Web Connection, Web Development
keywords: Live Reload,browser-sync,Page Refresh,Development
weblogName: Web Connection Weblog
postDate: 2018-10-09T21:09:15.0265186-10:00
---
# Using Browser-Sync to synchronize Server Side Code

Client side applications have been using **Live-Reload** behavior forever. When building Angular or Vue application I don't give a second thought to the fact that when I make a change to an HTML, Typescript/JavaScript or CSS file anymore and I expect the UI to reflect that change by automatically reloading my browser with those changes. This workflow makes it incredibly productive to iterate code and build faster.

Unfortunately the same cannot be said for server side code. When making changes to script pages in Web Connection I make a change, then manually flip over to the browser to review the change. While it's not the end of the world, it's much nicer to have a browser side by side to my editor and see the change side by side.

### Linking Browser and File Watchers
If you haven't used client side frameworks before and you don't know how browser syncing works here's a quick review. Browser synching typically works via tooling that does two things:

* File Change Monitoring 
* Updating the browser

File monitoring is easy enough. A file system watcher monitors the file system for any changes to files you specify via a set of wildcards typically. If any of these files are changed the watcher will kick in to perform an action. 

Depending on what you care about this can be as simple as simply reloading the page, or in the case of actual code files requires a rebuild of an application.

ASP.NET Core actually includes a built-in file watching tool called `dotnet-watch` which you can run to wrap the `dotnet run` command. But it only handles the recompilation part, not the browser refresh.

The other part of the equation is refreshing the browser. In order to do this any tool need to load the browser and inject a little bit of code into each page loaded in the browser to essentially communicate with a server that allows reloading the active page. This typically takes the form of a little WebSocket based server that runs in the Web page and communicates with a calling host - typically a command line tool or something running in developer tools like Browser-Link does in Visual Studio.

As mentioned Browser-Link in Visual Studio seems like it should handle this task, but for me this technology never worked for server side code. I've only got it to work with CSS file which is actually very useful - but it would be a heck of a lot more useful if it worked with all server side files even if it was just uncompiled files like HTML, JavaScript and Server side views that auto-recompile when they are reloaded. Alas no luck.

### Browser-Sync to the request
Luckily we don't have to rely on Microsoft to provide a solution to this. There are a few tools out there that allow browser syncing externally from the command line or via an admin console in a browser.

The one I like best is [Browser-Sync](https://browsersync.io/). Most of these tools are nodejs based so you'll need Node and NPM to install them, but once installed you can run them from the command line as standalone programs. Browser Sync does a lot more than just browser syncing.

In order to use Browser Sync you need a few things:

* Install [NodeJS](https://nodejs.org/en/download/https://nodejs.org/en/download/)/NPM 
* Install Browser Sync using NPM
* Fire up Browser Sync from the Command Line
* Let the games begin

As is common with many Web development related tools Browser Sync is built around NodeJS and is distributed via NPM, so make sure NodeJs is installed.

Next we need to install Browser-Sync. From a command prompt do:

```
npm install -g browser-sync
```

This installs a global copy of browser sync which can be run just like an executable that is available on the Windows path.

Now, in your console, navigate to the Web folder of your application. I'll use the Web Connection sample here:

```dos
cd \wconnect\web\wconnect
```

Next startup browser sync from this folder:

```dos
browser-sync start 
		--proxy localhost/wconnect 
		--files '**/*.wcs,**/*.wc, **/*.wwd, **/*.md, **/*.blog, css/*.css, scripts/*.js'
```

This command line basically starts monitoring for file changes in the current folder using the file spec provided in the files parameter. Here I'm monitoring for all of my scriptmapped extensions for my Web Connection scripts as well as CSS and JavaScript files.

Note the `--proxy localhost/wconnect` switch which tells browser-sync that I have an existing Web Server that's running requests. Browser-Sync has its own Web Server and when running NodeJs applications you can use it as your server directly. However, since Web Connection doesn't work with Node I can the `-proxy` switch to point to my application's virtual directory which is `http://localhost/wconnect/`. If you're using IIS Express it'd be `--proxy localhost:54311`. The proxy feature will change your URL to the proxy server that browser-sync provides, typically `localhost:3000`.


Here's what this looks like when you run browser sync:

![](BrowserSyncTerminal.png)

Browser sync automatically navigates to http://localhost:3000/wconnect and opens the browser for you. 

Now go to the No Script sample at `wcscripts/noscripts.wcs` page and open it. Next jump into your editor of choice and make a change to the page - change title to Customer List (updated) and save.

The browser updates immediately without an explicit refresh:

![](UpdatedScriptPage.png)

Now go back and remove the change... again the browser refreshes immediately.

Et voila, live browser reload! Nice and easy - cool eh?

### Making Browser Sync easier to load
For tools like this I like to make it easy, so I tend to create a small program that loads browser sync with a single command. Here's a simple script I drop into my project folder to launch brower sync:

```foxpro
************************************************************************
*  BrowserSync
****************************************
***  Function: Live Reload on save operations
***    Assume: Install Browser Sync requires Node/NPM:
***            npm install -g browser-sync
***      Pass:
***    Return:
************************************************************************
FUNCTION BrowserSync(lcUrl, lcPath, lcFiles)

IF EMPTY(lcUrl)
   lcUrl = "localhost/wconnect"
ENDIF
IF EMPTY(lcPath)
   lcPath = LOWER(FULLPATH("..\web\wconnect"))
ENDIF
IF EMPTY(lcFiles)
   lcFiles = "**/*.wcs,**/*.wc, **/*.wwd, **/*.blog, css/*.css, scripts/*.js, **/*.htm*"
ENDIF

lcOldPath = CURDIR()
CD (lcPath)

lcBrowserSyncCommand = "browser-sync start " +;
                       "--proxy " + lcUrl + " " + ;
                       "--files '" + lcFiles + "'"
                       
RUN /n cmd /k &lcBrowserSyncCommand

? lcBrowserSyncCommand
_cliptext = lcBrowserSyncCommand

WAIT WINDOW "" TIMEOUT 1.5
CD (lcOldPath)

ENDFUNC
*   BrowserSync
```

And now I can simply launch browser sync with a simple command from the FoxPro command window:

```foxpro
DO browsersync
```

### No Support for Web Connection Process Changes
Browser sync works great for any content that lives in the Web folder structure. Unfortunately the process class lives in a separate folder hierarchy and can't be monitored there. So any changes you make in your process class controller will still require you to manually refresh the browser. Browser sync can't monitor files with `../../deploy/*.prg` paths unfortunately.

> If you really want to be tricky about it you can temporarily move your `YourProcess.prg` file into the Web folder, add the path to your FoxPro path and then have Browser Sync also monitor that very specific PRG files.  Hacky - but it works.

### Summary
Browser syncing may not sound like that impressive of a feature, but I have to say that it ends up changing the way you work. Because changes are immediately reflect you can much more easily experiment with small changes and see them immediately while you're editing them. This is especially useful for CSS changes that often are very fiddly, but also for script HTML layout changes.

Either way it's a great productivity enhancing tool.
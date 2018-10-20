---
title: Using Browser Sync to automatically reload Pages on Changes
weblogName: Web Connection Weblog
postDate: 2018-10-09T21:28:09.5783959-10:00
---
# Using Browser Sync to automatically reload Web Connection Server Changes

Client side applications have been using **Live-Reload** behavior forever. When building Angular or Vue application I don't give a second thought to the fact that when I make a change to an HTML, Typescript/JavaScript or CSS file anymore and I expect the UI to reflect that change by automatically reloading my browser with those changes. This workflow makes it incredibly productive to iterate code and build faster.

Server side applications generally don't have this same functionality unfortunately, at least not out of the box. So for server side applications any change you make  for HTML, CSS, JavaScript and Web Connection Script and Template Pages requires explicitly refreshing the browser.

Turns out you can get browser syncing features for server side code, and it's relatively easy to do.

### What am I on about?
If you haven't used client side frameworks before and you don't know how browser syncing works here's a quick review. Browser syncing typically works via tooling that does two things:

* Monitors for files that have changed 
* Refresh the browser when a file you care about is updated
* The page currently active is reloaded

Sounds simple, right? But, yet it's a huge productivity improvement to automatically see changes you've made in the editor reflected in the **live** application which simply reloads with the changes anytime you make a code change.

### Browser Sync to the Rescue
So it's pretty easy to do this using a tool called [Browser-Sync](https://browsersync.io/). As the name suggests this tool lets you sync a browser to changes that have been made. I'm going to look at the simple use case of refreshing a single browser here, but Browser Sync actually supports syncing any number of devices including mobile phones/pads simultaneously.

Ok enough talk. How does this work?

First you're going to need a couple of things:

* Make sure you install NodeJs which installs NPM
* Install Browser Sync Globally via NPM
* Run a `browser-sync` command from the Command Line

Most tools of this type these days are based on NodeJs and Browser Sync is no exception so you have to make sure you have Node installed.

[Download and Install NodeJs](https://nodejs.org/en/download/)

Once Node is installed you have to install Browser Sync and you use NPM to do it. On a Windows or Powershell command window type:

```
npm install -g browser-sync
```

This installs browser sync *globally* onto your machine, which means it becomes available on the Windows path as a global tool.

Next, still on the command line, navigate to the Web Root folder for your Web application. For example I might navigate to `c:\wconnect\web\wconnect` for the Web Connection sample site.

Now you can start up browser sync to monitor your Web site (all on one line):

```
browser-sync start 
   --proxy localhost/wconnect
   --files '**/*.wcs,**/*.wc, **/*.wwd, **/*.blog, css/*.css, **/*.html, scripts/*.js'"
```

I'm telling Browser Sync to watch all Css, scripts, and all of the templates in my project. Note I also tell it to **proxy** my existing URL. Browser Sync basically takes over the original URL and forwards it to a new URL on a new local port.

This starts browser sync in watch and sync mode and it will launch *a new url**:

![](browser-sync-running.png)

The browser launches on **port 3000**  and the site now works as it did before. Note that the port may vary but it'll show you on the command line.

Navigate to one of the pages of the site you want to modify. I'm going to use the No Code page example here (`nocode.wcs`). 

Now open `wcscripts/nocode.wc` in your editor of choice and make a change to the say the  header that says *Customer List*. Press Ctrl-S to save the file and notice that the browser reflects that change immediately.

Et voila, you now have live reload.

### Make it Easier to Launch BrowserSync
I like to make things that I use a lot easier to start, so I create a small PRG to help me launch it from within FoxPro. I dump this into my project directories, customized for each of the projects I use.

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
   lcFiles = "**/*.wcs,**/*.wc, **/*.wwd, **/*.blog, css/*.css, scripts/*.js, ../../fox/*.prg"
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

Then to start it I simply do this from the FoxPro command line:

```foxpro
DO browsersync
```

Note that you probably want to customize the defaults to match your project's IIS (or IIS Express) Url, path (usually `..\web` in a project).


### Summary
Live reloading is a big time saver. Although it doesn't seem like much time is involved in manually refreshing a browser, think about how often you do this in the course of the day. Often you also have to hunt for your browser window that's buried. Live reload changes the way you build applications. A lot of times you end up trying something, saving glancing over to see what it did, then try something else - something that would take too long with manually flips.
---
title: Startup Error Tracing in West Wind Web Conection 6
abstract: One of the most common questions with Web Connection that come up are related to startup errors that cause File or COM Servers to fail during startup. These errors have been difficult to debug in the past but with Web Connection 6+ a number of improvements make it easier to avoid errors in the first place, and track them down if you do have them. In this post I go into detail on the Startup sequence of Web Connection.
keywords: Startup,Debugging,Tracing,wcErrors.txt,wcTracelog.txt,OnLoad,OnInit
categories: Web Connection
weblogName: Web Connection Weblog
postId: 938
postDate: 2018-06-08T11:02:36.4052570-07:00
---
# Startup Error Tracing in West Wind Web Conection 6

![](StartupTracing.png)

Web Connection 6.0 and later has made it much easier to create a predictable and repeatable installation with Web Connection. It's now possible to create a new project and use the built-in configuration features to quickly and reliably configure your application on a server with `yourApp.exe CONFIG` from the command line.

This produces a well-known configuration that creates virtuals, scriptmaps and sets common permissions on folders. The configuration is a PRG file that you can customize so if you need configure additional folders, set different permissions or copy files around as part of config - you can do that.

Using the preconfigured configuration should in most cases just make your servers work.

But we live in an imperfect world and things do go bump in the night - and so it can still happen that your Web Connection server won't start up. There are many reasons that this can happen from botched permissions on folders or DCOM to startup errors.


In this post I want to talk about server startup problems - specifically FoxPro code startup errors (rather than system startup errors due to permissions/configuration etc.).

One of the most common problems people run into with Web Connection application startup errors. You build your application on your development machine, then deploy it on a live server and **boom** - something goes wrong and the server doesn't start.

Now what?

### File Server Startup Errors
Even if you're running in COM mode if you have startup problems with your COM server it's often a good idea to first switch the COM server into File mode, then run as a file mode applications.

If you are running in file mode it's often easier to find startup problems, because you tend to run the application in interactive mode which means you get to see errors pop up in the FoxPro Window.

If you run into issues here you can also double check your development code to see if you can duplicate the behavior. Make sure your local application works obviously, but that's the first line of defense: Make sure the error is indeed specific to your server's environment. If it's not by all means debug it locally and not on the server.

### Test Locally First
This should be obvious: But **always, always** run your server locally first, with an environment as close as possible to what you are running on the server. Run in file mode make sure that works. Run in COM Mode make sure that works. Simulate the user environment you will use on the server locally (if possible) and see what happens. 

Always make sure the app runs locally first because it's a heck of a lot easier to debug code on the development machine where you can step through code, than on a server where you usually cannot.

### COM Server Startup Errors
Startup errors tend to fall into two categories:

* System Startup Errors
* FoxPro Server Startup Errors

System errors are permissions, invalid progIds, DCOM misconfigurations etc. that outright make your server fail before it ever gets a chance to be instantiated. These are thorny issues, but I'm not going to cover them much here. That'll be topic for another post.

The other area is server startup errors in FoxPro code. These errors occur once the server has been instantiated and initialized and usually occur during the load phase of the server.

### Understanding the Startup Sequence: Separated OnInit and OnLoad Sequence
When Web Connection starts up your application in a non-debug compiled EXE COM server, error handling is not initially available as the server initializes. That's because the server initializes as part of an `OnInit()` sequence and if that fails, well... your server will never actually become live.

In Web Connection 6+ the startup sequence has been minimized with a shortened `OnInit()` cycle, and a delayed `OnLoad` handler call that fires only on the first hit to your server. This reduces the potential failure scenarios that can occur if your server fails before it is fully instantiated. Errors can still occur but they are now a little bit easier to debug because the server will at least instantiate and report  the error. Previously init errors provided no recourse except a log message in the module log that the server could not be instantiated.

### Startup Failures: Module Logging in wcErrors.txt
If the server fails to initialize at the system level (ie. Init() fails and the server never materializes), any errors are logged by the Web Connection Handler (.NET or ISAPI) in `wcErrors.txt` in the temp folder for the application. Startup errors logged there will include DCOM permissions errors, invalid Class IDs for your COM server, missing files or runtimes or any failure that causes the server to crash during `OnInit()`.

These system level errors can also be triggered if your server's `OnInit()` code fails. `OnInit()` fires as part of the FoxPro server's `Init()` method which is the object constructor and if that fails the server instance is never passed back to the host. There's nothing that can be done to recover from an error like that except log it in``wcErrors.txt` and `wcTracelog.txt`.

> #### @icon-info-circle Avoid putting code into `OnInit()`
> To keep startup code to an absolute minimum, avoid writing code in your server's `OnInit()` method. `OnInit()` is meant to only set essential server operation settings that are needed for Web Connection servers to start. For everything else that needs to initialize use `OnLoad()`. In typical scenarios you shouldn't have any code in `OnInit()` beyond the generated default. This alone should avoid server startup crashes due to FoxPro code errors.

### Startup Errors are logged to wcTraceLog.txt
Any code based errors during startup are logged to `wcTracelog.txt` file which is hooked into the `OnInit()` and `OnLoad()` processing of your server. Both methods are wrapped into exception handlers and if they are triggered by errors `wcTraceLog.txt` receives the error information. You can also implement `OnError()` to receive the captured exception and log or otherwise take action.

> #### @info-icon-circle Folder Permissions for Logging
> Make sure that the folder your application's EXE is running out of has read/write access rights for the IIS Server account that is running FoxPro application as it needs to be able  to create and write the `wcTracelog.txt` file.

Any failures in `OnInit()` cause the server to not start so `wcTracelog.txt` and `wcErrors.txt` will be your only error source. 

Errors in `OnLoad()` log to `wcTracelog.txt` but also display an error page in the browser with the error information (WC 6.15+). If `OnLoad()` errors occur the server will run not any further and **only display the error message** - requests are aborted until the problem is fixed.

### Capturing Startup Errors
Beyond looking in `wcTraceLog.txt` you can also override the `wwServer::OnError()` method which receives the exception of the failure. In that message you can add custom logging and write out additional environment info into the log file.

You can also use the `wwServer::Trace()` method to write out information into the `wcTraceLog.txt` log. For thorny problems this allows to put messages into your code to see how far it gets and echo state that might help you debug the application. It's also useful in requests, but it's especially valuable for debugging startup errors.

The OnError method only serves as an additional error logging mechanism that allows you to capture the error and possibly take action on the error with custom code.

To implement:

```foxpro
FUNCTION OnError(loException)

*** default logging and some cleanup
DoDefault(loException)

*** Do something with the error

'*** Also write out to the local trace text log
THIS.Trace(loException.Message)

ENDFUNC
```
### Add Tracing and Logging Into your Code
Finally if all of this still hasn't fixed your server  to start up, you'll have to do some detective work. Your first line of defensive is always debug locally first in a similar environment: Make sure you debug in COM mode locally so you get as close as possible to the live environment.

If you really have to debug the live server you can use the [wwServer::Trace()](vfps://Topic/_4AX0U7IQ5) method to quickly write out trace messages to the `wcTraceLog.txt` file.

```foxpro
PROTECTED FUNCTION OnLoad

THIS.Trace("OnLoad Started")

THIS.InitializeDataBase()
THIS.Trace("DataBase Initialized")

THIS.SetLibraries()
THIS.Trace("Libiraries loaded")

...

THIS.Trace("OnLoad Completed")
ENDFUNC
```

By default the `wwServer::Trace()` method stores simple string output with a date stamp in `wcTraceLog.txt` in the application's startup folder.

Using this type of Print-Line style output you can put trace points in key parts of your startup sequence to see whether code is reached and what values are set.

### Common Startup Errors
Common startup errors include:

#### Invalid COM Object Configuration  
Make sure your servers are listed properly in `web.config` (.NET ) or `wc.ini` (ISAPI) and point at the right ProgIds for your COM servers. Also make sure the COM Servers are registered.

#### Folder Locations  
Make sure that your application can run out of the deployed folder and has access to all the locations that it needs to read local data from. Make sure that paths are set in the environment and network drives are connected and so forth. **Servers don't run under the interactive account** so don't expect the same permissions and environment as your loggd in account especially if you depend on mapped drives - you probably have to map drives as part of your startup routine by checking if a drive is mapped and if not mapping it. Use `SET PATH TO <path> ADDITIVE` or set the system path to include  needed folders.

#### Folder Permissions
Make sure that any files including data files you access on the local file system have the right permissions so they can be read and written to. Remember the IIS or DCOM permissions determine what account your application is running under.

### Summary
Startup debugging of Web Connection is always tricky but Web Connection 6's new features make the process a lot easier by providing much better server configuration support to get your apps running correctly, and if things shouldn't go well on the first try provide you more error information so you can debug the failure more easily. 

In addition to the better error trapping and error reporting you can also take pro-active steps to capture errors and log them out into the trace log for further investigation. Nobody wants to see their applications fail especially immediately after installation, but now you should be ready to deal with any issues that might crop. Now - go write some code!
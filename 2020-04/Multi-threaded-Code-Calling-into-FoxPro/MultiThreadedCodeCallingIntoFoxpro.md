---
title: Using DOEVENTS Asynchronous Callbacks into FoxPro Code
weblogName: Web Connection Weblog
postDate: 2020-04-17T13:57:58.9030574-10:00
---
# Using DOEVENTS for Asynchronous Callbacks into FoxPro Code
FoxPro is not known as a platform for multi-threading or for dealing with asynchronous code, so it comes as no surprise that when working with asynchronous code that calls back into FoxPro from other applications can be challenging for those of us still working with FoxPro.

Lately, I've been working with a lot of 'callback' code in FoxPro from a number of different scenarios:

* wwDotnetBridge Async Calls
* wwDotnetBridge Thread Operations
* Callbacks from Remote services like SignalR
* Callbacks from the WebBrowser Control and JavaScript

All of these scenarios have a common theme, namely that **an external application is calling back into FoxPro code**. The new [async features in wwDotnetBridge](https://www.west-wind.com/wconnect/weblog/ShowEntry.blog?id=932) in particular make it very easy to make external code execute asynchronously and have you get called back when the Async operation completes.

The following example calls **any .NET method** asynchronously and returns the result back to with a callback when it completes rather than having the FoxPro caller waiting for it:

```foxpro
loBridge = CreateObject("wwDotNetBridge","V4")

loTests = loBridge.CreateInstance("Westwind.WebConnection.TypePassingTests")

*** IMPORTANT: The callback object must remain in scope
***            Either use a public var, or attach to an object that
***            stays in scope for the duration of the callback
PUBLIC loCallback
loCallback = CREATEOBJECT("MyCallbacks")

*** This methods returns immediately - then fire events when done
loBridge.InvokeMethodAsync(loCallback,loTests,"HelloWorld","Rick")

RETURN

*** Handle result values in this object
*** The callback object is called back 
*** when the method completes or fails
DEFINE CLASS MyCallback as AsyncCallbackEvents

*** Returns the result of the method and the name of the method name
FUNCTION OnCompleted(lvResult,lcMethod)
DOEVENTS && recommended!
? "Success: " + lcMethod,lvResult
ENDFUNC


* Returns an error message, a .NET Exception and the method name
FUNCTION OnError(lcMessage,loException,lcMethod)
DOEVENTS && recommended to avoid re-entrancy issues
? "Error: " + lcMethod,lcMessage
ENDFUNC

ENDDEFINE
```

Likewise in one of my applications - [HTML Help Builder](https://helpbuilder.west-wind.com) - I do complex interop with a Web Browser control where JavaScript code running inside of the Browser document can call back into FoxPro code. For example, when the editor updates text after a short timeout it calls back into my FoxPro application and requests that the preview should be updated, or that the editor text should be saved to disk.

This all works surprisingly well.

**Until it doesn't** :smile:

## Async Code is not like Regular Code
As mentioned at the start, FoxPro is not really a multi-threaded environment, so it has no notion of external code calling back into FoxPro. There are a few well known mechanisms that can handle async operations that are native to FoxPro:

* FoxPro Events (like Click, Change, Timer etc.)
* ActiveX Control Events

These high level events are designed into FoxPro and they understand some of FoxPro limitations so they tend to fire into your code in a controlled manner. For example a click event or timer event doesn't interrupt executing code in most cases.

**The same is not true for 'manual' callback code**. If you pass a random FoxPro object to a COM component and that COM component calls back from an Asynchronous operation or even from a completely non-UI thread, the callback will happen immediately and potentially interrupt currently executing code.

The way FoxPro executes code is basically one line at a time. And if an external component happens to call back while executing a long running piece of code it's quite possible and even likely that the external will start executing its own code right in the middle of the previously running code.

If that sounds scary it should - because it's one of those things that'll work 90% of the time, and bite you in random ways.

### Mitigating Async Callback Hell - DOEVENTS
It may not seem super obvious, but FoxPro has a command to let FoxPro catch up with existing non-idle processing and that command is `DOEVENTS`.

Here's what the FoxPro DOEVENTS documentation says:

> #### @icon-info-circle FoxPro DOEVENTS Command
> You can use DOEVENTS for simple tasks such as making it possible for the user to cancel a process after it starts, for example, searching for a file. Long-running processes that yield control of the processor are better performed using a Timer control or delegating the task to a COM Server executable (.exe). In this situation, the task can continue independently of your application, and the operating system takes care of multitasking and time allocation.
> 
> Any time you temporarily yield control of the processor in an event procedure, make sure the procedure is not run again from a different part of code before the first call ends. Doing so might cause unpredictable results. In addition, do not use DOEVENTS if other applications might interact with your procedure in unforeseen ways during the time you have yielded control of the processor.

These docs are sufficiently **cryptic** as they don't really address all that DOEVENTS does and somewhat misrepresents by referring only to Windows events (which also happen to apply to FoxPro events).

DOEVENTS's purpose is essentially to let other code run, before the code following DOEVENTS fires. This isn't always as clean as it sounds because of the way FoxPro decides what makes up those execution boundaries, but in most cases you can assume that FoxPro will process other code that is executing in the event queue. However, if you have very long running code, FoxPro may still butt into the middle of code so it's not 100%, but for most scenarios DOEVENTS does what you want for async code.

Here's an example:

```foxpro
*** Asynchronusly called back from WebBrowser
FUNCTION PreviewMarkdown()

*** Minimize overlapping preview calls
DOEVENTS

*** Update TextBox and ControlSource
this.RefreshControlValue()

*** Preview the Markdown, this can take some time to process and 
THISFORM.Preview(1)

ENDFUNC
```

### A real-world Example Failure
Let me put this into perspective with a real world example in Help Builder using the previous code snippet. For the longest time I've been having major issues with the editor **with largish Markdown topics** in the editor. Essentially the editor would start slowing down and at some point start generating corrupted Preview HTML.

In the code above the `thisform.Preview(1)` method call essentially creates a Markdown file on disk and then reads in the string and updates the content from the rendered output in browser by stuffing the content into an HTML DOM element. For the longest time I've been using this code I didn't have the `DOEVENTS` call in this method call.

The code still works just fine most of the time for most smaller or medium sized topics when the content generation is very fast. But as topics get larger the topic output creation on disk gets slower. I have one topic in the Web Connection documentation (the Change Log) that is a massive 2000+ line document that's nearly a 150k of text.

And guess what without the `DOEVENTS` call multiple `PreviewMarkdown()` calls can potentially start executing concurrently. The editor asks for a refresh and asynchronously hands off to FoxPro. I then keep typing and as I stop or click I might again trigger a `PreviewMarkdown()` call, but before the last one completed. Because JavaScript is asynchronous, this totally can happen.

Wanna take a guess what happens next?

The original call to `PreviewMarkdown()` is interrupted, and the new call starts executing, it runs for a bit, then the other one starts going again and so it goes back and forth.

It's nasty: The routines that write the output to disk are competing with each other essentially ending up with multiple file writers writing content concurrently **to the same file**. The file corrupts, the update string ends up missing and the content rendered is completely borked which happens to also screw up the Web Browser control which is trying to make sense of the now 300k+ file that has bad HTML in it.

It's ugly as heck.

It took me forever to figure out what was going on here. I used debug outs and log files to trace the output written actually captured, and the code always had the correct string output, but the on disk the final HTML file would often be corrupted. I tried a million things trying to avoid writing when another write was already in progress etc.

... until I realized that this was actually occurring because events were overlapping. At that point using `DOEVENTS` was the first line of defense and sure enough that has all but eliminated the problem even with my massive change log file.

### Summary
Long story short - using `DODEFAULT` was the easy fix for a long standing problem I've been battling for a few years in Help Builder. Needless to say I'm stoked this simple solution worked, although I sure as heck would have preferred to find it much sooner and before trying so many different things first (like creating a .NET based browser control and calling that from FoxPro on a completely separate thread).

If you are using asynchronous callbacks in FoxPro from anything that is calling you back via COM or any other truly asynchronous interface, make sure that you use `DOEVENTS` to help mitigate re-entrancy problems. Put `DOEVENTS` at the beginning of your callback code to minimize (but perhaps not eliminate) possible recursion on multiple, quick succession callbacks.



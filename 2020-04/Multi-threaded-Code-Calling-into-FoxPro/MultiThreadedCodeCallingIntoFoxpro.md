---
title: Troubleshooting Asynchronous Callbacks into FoxPro Code
abstract: If you're passing FoxPro objects to COM objects and have .NET call back to you on objects that you passed makes it possible to effectively create asynchrnous applications where .NET code can process stuff in the background and notifying you when it's done or other needs to let you know that something changed. It's powerful but it brings its own set of problems in FoxPro, which wasn't design with Async code in mind. In this post I talk about some of the issue and some of the things you can do to avoid callback hell in FoxPro.
keywords: Async, Callbacks, DOEVENTS
categories: FoxPro, wwDotnetBridge
weblogName: Web Connection Weblog
postId: 960
postDate: 2020-05-02T13:57:58.9030574-10:00
---
# Troubleshooting Asynchronous Callbacks into FoxPro Code
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

FoxPro internally manages to marshal the thread back to the UI thread, but the timing of it is not controlled - the code can fire at anytime and will interrupt any running code **on the next line**. The currently executing command or statement completes and **then** the interrupting code is fired.

FoxPro's execution scope is basically at the line level. Each line of code is guaranteed to complete before something else runs. But any code called externally while another function or code block is running can potentially be interrupted, mid-function.  So if an external component happens to call back while executing a long running piece of code it's quite possible and even likely that the external will start executing its own code right in the middle of the previously running code.

If that sounds scary it should - because it's one of those things that'll work without problems 99% of the time, but bite you in unpredictable and random ways.

### Async Defensive Programming
If you are dealing with async code in FoxPro the first thing you should always strive for in callback is to:

* Minimize the amount of code you run
* Try to avoid changing any non-local state

The idea is if your code interrupts some already running code, **you don't want to change the execution state of the original code**, so that it can complete processing without errors when control is returned to it.
  
For example, assume that you have some code that runs in a `SCAN` loop looping through rows of a table. Now an async call comes in from a COM object, and in that code you change the workarea or close the table that the `SCAN` loop is using. When the execution pointer returns to the originally running `SCAN` loop code, that code has no idea that the cursor was closed or the workarea has moved so the code will likely fail as it continues executing. This is an extremely hard to debug error because when you look at that code you probably think: "How could this possibly not work? I'm using a `SCAN` and I'm not changing workareas, so why is my cursor no longer selected?" Async code is sneaky that way. 

By reducing the amount of state you change in async callbacks and resetting anything you touch that is non-local to its original state, **you can minimize problems with interrupted code turning into corrupted code**.

If you have to change state in callback code another good strategy is to store the relevant state somewhere - in a table, a global variable or a state store - and then access that data in a more controlled way. Perhaps if you know that your async call is likely to interrupt a loop of some sort, perhaps the loop can check for some state and then explicitly process the async data using the standard top-down FoxPro call stack which is more predictable in behavior. 

### Mitigating Async Callback Hell - DOEVENTS
It may not seem super obvious, but FoxPro has a command to let FoxPro catch up with existing non-idle processing and that command is `DOEVENTS`.

Here's what the FoxPro DOEVENTS documentation says:

> #### @icon-info-circle FoxPro DOEVENTS Command
> You can use DOEVENTS for simple tasks such as making it possible for the user to cancel a process after it starts, for example, searching for a file. Long-running processes that yield control of the processor are better performed using a Timer control or delegating the task to a COM Server executable (.exe). In this situation, the task can continue independently of your application, and the operating system takes care of multitasking and time allocation.
> 
> Any time you temporarily yield control of the processor in an event procedure, make sure the procedure is not run again from a different part of code before the first call ends. Doing so might cause unpredictable results. In addition, do not use DOEVENTS if other applications might interact with your procedure in unforeseen ways during the time you have yielded control of the processor.

These docs are sufficiently **cryptic** as they don't really address all that DOEVENTS does and somewhat misrepresents by referring only to Windows events (which also happen to apply to FoxPro events).

DOEVENTS's purpose is essentially to let other code in a different execution context run, before the code following DOEVENTS fires. This can be code on other threads (including FoxPro internal and Windows events), but it can also be FoxPro code like events fired from the UI or things like Timer events.

This isn't always as clean as it sounds because of the way FoxPro decides what makes up those execution context boundaries is pretty vague, but in most cases you can assume that FoxPro will process other code that is executing in the event queue. However, if you have very long running code, FoxPro may still butt into the middle of code so it's not 100%, but for most scenarios DOEVENTS does what you want for async code - it lets other events/code finish before executing your next line of code.

Therefore it's a good idea in any code that is called back asynchronously to **start with a DOEVENTS** command. 

Here's an example:

```foxpro
*** Asynchronusly called back from WebBrowser control
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

And guess what: Without the `DOEVENTS` call multiple `PreviewMarkdown()` calls can potentially start executing concurrently. The editor asks for a refresh and asynchronously hands off to FoxPro. I then keep typing and as I stop or click I might again trigger a `PreviewMarkdown()` call, but before the last one completed. Because JavaScript is asynchronous, this totally can happen.

Wanna take a guess what happens next?

The original call to `PreviewMarkdown()` is interrupted, and the new call starts executing, it runs for a bit, then the other one starts going again and so it goes back and forth.

In that scenario there is some accidental shared state: The HTML output file that is generated as part of Markdown generation. 

It's nasty: The routines that write the output to disk are competing with each other essentially ending up with multiple file writers writing content concurrently **to the same file**. The file corrupts with invalid and duplicated HTML content, the update string ends up missing and the content rendered is completely borked, which to top it off happens to also screw up the Web Browser control rendering which is trying to make sense of the now 300k+ file of badly misformatted HTML. **Boom!** 

It's ugly as heck. The end result is that browser is overwhelmed by the long misformatted document and because it takes so long to render it starts slowing down the UI thread. Meanwhile new requests for previews come in because of the timing and the entire application crawls to a near stop with characters painting to the screen.

It took me forever to figure out what was going on here because the right methods were being called and the input parameters always are correct. Finally, I broke down and used debug outs and log files to trace the output written actually captured, and the code always had the correct string output, but the on disk the final HTML file would often be corrupted. I tried a million things trying to avoid writing when another write was already in progress etc. That didn't help...

... until I realized that this was actually occurring because events were overlapping! Lightbulb meet keyboard: Adding DOEVENTS all but eliminated the problem even with my massive change log file. Not 100% - very, very large files can still be problematic as eventually DOEVENTS will return even if other code has not completed.

### Throttling and preventing Nested or Stacked Callbacks
Another very important thing that I ended up implementing after this discovery was better support for throttling. My editor already debounces keyboard input by about a second of idle time - meaning the preview is only refreshed when you stop typing for at least a second. 

However, adding some additional checks at the top line code that basically check if the rendering code is already executing and disallow access if it is was also important in making the problem go away. In async call accidentally dual executing code can be a real killer because it can cause odd failures as perhaps the same state (in my case the rendered preview file) is accessed, or simply because the the increased resource use causes a slowdown that often invites even async fox code executing.

Here's what this looks like in the actual implementation of the simpified `PreviewMarkdown()` I showed earlier:

```foxpro
LPARAMETERS lvParm1, lvParm2
LOCAL loBand, lcAnchor, lnEditorLine
PUBLIC __plPreviewRefreshing

DOEVENTS

this.RefreshControlValue()

IF !__plPreviewRefreshing AND VARTYPE(THISFORM.oIE) = "O"
  __plPreviewRefreshing = .T.
  * DebugOut("Previewing actual" + TRANSFORM(SECONDS()))
  
  lcAnchor = .f.  
  TRY
 	 lnEditorLine = this.texteditor.getlinenumber(.T.)
  	 lcAnchor = "pragma-line-" + TRANSFORM(lnEditorLine)
  	 
	 DOEVENTS  
  
	 * THISFORM.DoEditOperation("cmdSave",lcAnchor)
     THISFORM.Preview(1,lcAnchor,.T.) 
  CATCH
  FINALLY
     __plPreviewRefreshing = .F.
  ENDTRY

ENDIF
```

Notice the `__plPreviewRefreshing` public variable which is use to prevent re-entrancy. The code uses a `TRY/FINALLY` block to ensure that the variable is always reset to `.F.` even if for some reason the code fails.

Bottom line if you know you have async callback code think about and understand what happens when the same code executes simultaneously, and if it can't work that way, make sure that there are safeguards to prevent the same code from being executed if another 'callback' is already running it.

### Summary
Between `DOEVENTS` and the re-entrancy check I was able to get the editor to work much more reliably even with fairly large documents. Due to FoxPro's relative slow ActiveX interface and UI thread marshaling the performance is still not anywhere near what I see with Markdown Monster in .NET, but the behavior is much closer now than previously.

I'm very happy for solving this long standing problem I've been battling for a few years in Help Builder. Needless to say I'm stoked this simple solution worked, although I sure as heck would have preferred to find it much sooner and before trying so many different things first (like creating a .NET based browser control and calling that from FoxPro on a completely separate thread which didn't help for the same reasons).

If you are using asynchronous callbacks in FoxPro from anything that is calling you back via COM or any other truly asynchronous interface, make sure that you use `DOEVENTS` to help mitigate re-entrancy problems and if you know the same bit of code may be called quickly in succession either make very, very sure that there's no shared state, or else block off access while one callback is already in progress.

Hope this helps some of you out.

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
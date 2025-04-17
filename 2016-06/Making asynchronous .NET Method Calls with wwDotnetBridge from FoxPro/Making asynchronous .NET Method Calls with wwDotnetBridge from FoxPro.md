# Making asynchronous .NET Method Calls with wwDotnetBridge from FoxPro

In version 6.0 of **wwDotnetBridge** which was just released as part of [West Wind Web Connection](http://west-wind.com/webconnection), the [West Wind Client Tools](http://west-wind.com/WestwindClientTools.aspx) and just this week with the open sourced version of [wwDotnetBridge](https://github.com/RickStrahl/wwDotnetBridge), there's a little hidden gem of a feature that allows you to call **any** .NET method asynchronously and then optionally get notified when the call completes or fails.

### wwDotnetBridge?
For those of you not familiar with wwDotnetBridge, it's a library that lets you call .NET components from Visual FoxPro. While you can natively do that with COM Interop there are lots of limitations with the native approach. wwDotnetBridge provides access to most .NET features from FoxPro. You can find out more on the [GitHub site](https://github.com/RickStrahl/wwDotnetBridge) and the [wwDotnetBridge White paper](http://west-wind.com/presentations/wwDotnetBridge/wwDotnetBridge.pdf).

In short if you plan on doing .NET interop in FoxPro, wwDotnetBridge is the way to do it.

### Async Method Access
wwDotnetBridge lets you call methods and access properties of .NET objects. You can do that using direct COM interaction or using the indirect methods like `InvokeMethod`, `GetProperty` and `SetProperty` which are at the heart of wwDotnetBridge's extensibility API. These 'proxy' methods allow control over .NET features that straight COM interop cannot access.

In v6.0 I've added the ability to use the new `InvokeMethodAsync` and `InvokeStaticMethodAsync` methods to invoke any .NET method asynchronously. 


Asynchronous processing allows you to either do a **run and forget** scenario where you don't care about the result, or you can receive a callback when the asynchronous method call completes.

There are a few different ways you can take advantage of this functionality:

* Access long running .NET Framework or Library Code
* Call your own long running .NET operations
* Call your own long running FoxPro Operations (via fox COM objects)

### Calling long running .NET Framework Functions
Let's start with simplest scenario which is simply to call a long running .NET method in the framework or a third party library or even from your own code. In this scenario you're simply calling something that already exists and making the call for that operation asynchronous.

As an example I'll use the .NET `System.Net.WebClient` class which provides a number of easy to use HTTP access methods. I'll use it to download a largish file using the `DownloadData()` method that takes a few seconds to download the file as binary data, save it to disk and launch it when the download is complete.

```foxpro
DO wwUtils 			&& Demo only
DO wwDotnetBridge	&& Load dependencies

LOCAL loBridge as wwDotnetBridge
loBridge = GetwwDotnetBridge("V4")

*** Create a built-in .NET class
loHttp = loBridge.CreateInstance("System.Net.WebClient")

*** Create a callback object - object has to be 'global'
*** so it's still around when the callback returns
*** Use Public or attach to long lived object like form or _Screen
PUBLIC loCallback
loCallBack = CREATEOBJECT("HttpCallback")


*** Make the async call - returns immediately
loBridge.InvokeMethodAsync(loCallback, loHttp, ;
                        "DownloadData",;
                        "http://west-wind.com/files/HelpBuilderSetup.exe")

? "Download has started... running in background."

RETURN

*************************************************************************
DEFINE CLASS HttpCallback as Custom
*************************************************************************

************************************************************************
*  OnCompleted
****************************************
FUNCTION OnCompleted(lvResult, lcMethod)

? "Http Call completed"
? "Received: " + TRANS(LEN(lvResult),"999,999,999")

*** Write to file to temp folder
STRTOFILE(lvResult,ADDBS(SYS(2023)) + "HelpBuilderSetup.exe")

TRY
	*** Open the Zip file
	DO wwutils
	GoUrl(ADDBS(SYS(2023)) + "HelpBuilderSetup.exe")
CATCH
ENDTRY

ENDFUNC

************************************************************************
*  OnError
****************************************
FUNCTION OnError(lcErrorMessage, loException, lcMethod)
? lcErrorMessage
ENDFUNC

ENDDEFINE
```

The call to the `WebClient.DownloadFile()` methods works by using the implicit `.InvokeMethodAsync()` functions. Like it's synchronous counterpart you specify the object instance that you want to call, the method name as a string and a parameter list.

In addition you provide a first parameter of  an option Callback object. This object can be null in which case you don't get called back. If you do pass an object, this object has to implement a simple control in that it has to support `OnCompleted(lvResult, lcMethod)` and `OnError(lcErrorMessage, loException, lcMethod)` methods which are called when the async operation on the server completes.

In this example we are downloading a file from the server and the `DownloadData()` method returns a binary string that is the file content. The call to the method is made asynchronously which means the call returns immediately without any result data - effectively the async request has been submitted for processing but the method doesn't wait for completion of the operation and just returns immediately.

The file download now proceeds in the background while the main application can go about its business, doing other stuff. In this demo you can type on the command window, start another application, switch windows etc. while the download goes on in the background.

When the download completes, wwDotnetBridge calls `OnCompleted()` method on the object that you passed into to the async call and your code now gets control on completion. In the example above I capture the binary data from the download, write to file and then try to launch the EXE.

> #### @icon-warning Disruptive Code
> It's very important to understand that when this callback occurs, the code interrupts the normal flow of your FoxPro code, so you want to be really careful to not change any settings or values that will affect the code in your application. 
>
>IOW, don't change the active cursor or close tables for example. If you need to interact with data **make very sure you reset everything just as you found it**. Ideally you want to make your async result code very short and clean. 

### Calling your own .NET Components
So the example above really demonstrates everything you need to know about how to use the async functionality. The other options simply differ in how you use the asynchronous functionality.

In the first use case we used something that already exists in .NET or a third party library of some sort. But you can also build your own .NET component and call that using this approach, so that you can run a long running operation asynchronously.

Imagine for example that you need to call a Web Service that takes a minute or two to process some data before it is returned - you might implement the Web service client in a small block of .NET code and then use call that code from your FoxPro application.

To keep things very simply I'll just use the same HTTP download example, but rather than calling it directly I'll stick the code into a custom .NET assembly I create. It's contrived and obviously you'd want to do something a bit more complex.






<!-- Post Configuration -->
<!--
```xml
<abstract>
</abstract>
<categories>
</categories>
<keywords>
</keywords>
<weblog>
Rick Strahl's FoxPro and Web Connection Weblog
</weblog>
```
-->
<!-- End Post Configuration -->

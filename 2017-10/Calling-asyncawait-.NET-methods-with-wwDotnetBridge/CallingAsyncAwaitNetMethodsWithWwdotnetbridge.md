---
title: Calling async/await .NET methods with wwDotnetBridge
abstract: More and more .NET APIs expose Async only interfaces and it might seem that calling `async` `await` code from FoxPro seems like it would be difficult. I had my doubts it would but as it turns out it does. In this post I describe how `async` `await` works in .NET and how the lower Task API is used to implement it, and more importantly how we can call async methods using the .NET Task API.
keywords: wwDotnetBridge,async,await,Task,.NET,FoxPro
categories: FoxPro, Web Connection, Client Tools, wwDotnetBridge, .NET
weblogName: Web Connection Weblog
postId: 932
---
# Calling async/await .NET methods with wwDotnetBridge

![](jugglingtoomanythings.jpg)

I got [a question on the message board](https://support.west-wind.com/Thread5130KT3H4.wwt?rl=1#5130KT3H5) a week ago regarding calling async .NET methods using [wwDotnetBridge](https://github.com/RickStrahl/wwDotnetBridge). My immediate suspicion was that this probably wouldn't be possible since async code on .NET usually uses generics and requires special setup. 

However, as it turns out, you **can call async methods in .NET** with wwDotnetBridge. In this post I describe how async/await methods work in .NET and how you can call them from FoxPro with wwDotnetBridge.

### How async/await works in .NET
The `async` and `await` pattern in .NET seems like magic - you make a request to a function that processes asynchronously, which means the code runs in the background and then continue processing the code as if it was running synchronously. `async` and `await` code looks and feels just like synchronous code but behind the covers, the code actually runs asynchronously. 

### An example of Async/Await in .NET
Let's say I want to make an HTTP call with `System.Net.WebClient` which has a number of async methods.

The following retrieves an HTTP response as a string:

```cs
public async Task<string> MakeHttpCall(string url)
{
    var client = new WebClient();
    string http  = await client.DownloadStringTaskAsync(url);
    return http;
}
```
The C#/.NET (Roslyn) compiler is doing a bunch of stuff to fix up this code. Note in order for `async` `await` to work the method called has to be `async` to start with, which means the caller has to be calling it asynchronously. Async await can be a real **rabbit hole** as it worms its way up the stack until it reaches a place where an `async` method can be started - usually by an event or a server generated action. Another way to start an `async` sequence is to use `Task.Run()` to kick off your own `Task` of an `async` operation sequence.

Also note the compiler magic that makes it possible for the method to return `Task<string>`, but the code actually returning a `string`. Async methods automatically fix up any result type into a `Task` so the string result becomes `Task<string>`. Again - compiler magic.

Clearly this is code we can't directly simulate in FoxPro, but - as it turns out we don't have to.

### Under the Covers: Task based APIs
.NET does this via some magic with the compiler that effectively re-writes your linear `await` code into a state machine. That generated code essentially creates the dreaded **async pyramid of doom** that nobody wants to code up by hand, but here the compiler  hides it behind generated code so you get the benefit of it, without having to look at the pyramid code.

At a lower level, .NET uses the `Task` or `Task<T>` class API which is like a .NET version of a promise. Task is essentially task forwarder, that calls a method asynchronously, then handles the callback and provides a `Result` property that has a result value (if any). There are options to check completion status as well as methods that can wait for completion and there are delegate methods like `Continue()` and `ContinueWith()` which is what await uses for the `await` generated code. 

In essence, `async` and `await` chops up linear code into nested blocks of code that continue in a linear fashion. For the developer the beauty of async await is that it looks and behaves mostly like linear code while running asynchronously and freeing up the calling thread.

You also just choose to wait on `.Result` which is a blocking property **getter**, that won't return the result until the method completes its async task.

`Task` is the low level feature - `async` and `await` is language sugar built around the `Task` object that builds a state machine that waits for completion internally and includes checks and methods that can check the current state of the async request.


### FoxPro and Task
Ok - all that .NET stuff sounds complicated, but as it turns out, calling an Async method from FoxPro is not as hard as you might think.

As seen above, **an async method is really just a method that returns a `Task`**. So [WebClient.DownloadStringTaskAsync()](https://docs.microsoft.com/de-de/dotnet/api/system.net.webclient.downloadstringtaskasync?view=netframework-4.7) - which is an `async` method  that normally is called with `async` `await` - can also simply return a `Task` object and thus can also be called with this code:

```cs
public string MakeHttpCall(string url)
{
    var client = new WebClient();
    
    var task = client.DownloadStringTaskAsync(url); // returns immediately
    
    // waits until Result is available
    string http = task.Result;
    
    return http;
}
```

Unlike the `await` code shown earlier this code blocks on the `task.Result` access, so while the actual method returns immediately, accessing `task.Result` waits until the call finishes. This means that in theory you can fire the request, do something else in FoxPro code, then pick up the .Result property. In effect, you can delay grabbing the result with other FoxPro tasks that can process before the result is returned.

The code is directly working with the lower level Task API and it uses the `.Result` property to wait for completion. If `.Result` is not ready yet, retrieving `.Result` blocks and waits for completion of the async task before the value is returned.

This pretty much defeats the purpose of async since we end up waiting for the result, but keep in mind that you have the option of running other code between the retrieval of the Task and getting the `Result` property. In that way you can gain some performance benefits even when using `Result`.

The other reason `.Result` is interesting is that this is code we can write from FoxPro with wwdotnetbridge. The method call returns a `Task` and we can access the `.Result` property from FoxPro.

### Calling an Async method with wwDotnetBridge
So, we **can** in fact call `DownloadStringTaskAsync()` with FoxPro code just like this:

```foxpro
do wwDotNetBridge
LOCAL loBridge as wwDotNetBridge
loBridge = CreateObject("wwDotNetBridge","V4")

loClient = loBridge.CreateInstance("System.Net.WebClient")

*** execute and returns immediately
loTask = loBridge.InvokeMethod(loClient,"DownloadStringTaskAsync","https://west-wind.com")
? loTask  && object

*** Waits for completion
lcHtml = loBridge.GetProperty(loTask,"Result")
? lcHtml
```

And this works just fine. 

Note that you have to call the async method indirectly with `InvokeMethod()` and you have to retrieve the `Result` value from the `Task<T>` `Result` using `GetProperty()`. This is required because both the method and the result property use .NET generics and those can't be accessed directly through COM interop (because it's generated code that's not in the type library) and requires wwDotnetBridge's indirect processing. 

But it works and you can retrieve the HTTP result in the method above! Yipiee!

### wwDotnetBridge - More than you think!
Async methods are just methods that return a `Task` object, which can be accessed and manipulated like any other object in .NET and therefore with wwDotnetBridge. The main consideration for wwDotnetBridge is that `Task<t>` is a generic type and requires indirect access using `InvokeMethod()` to call the async method, and using `GetProperty()` to retrieve the **Result** property.

### Be careful
All that said, I'm not sure if it's a great idea to actually do this. Async methods run in the background and potentially on background threads and Microsoft strongly recommends you don't use `.Result` to wait for completion. They are of the "don't call us we call you!" persuasion, by using `aync` `await`, or by using Task continuations (ie. `.ContinueWith(result)` which is something we can't do directly with wwDotnetBridge (can't create delegates).

However, if you are running inside of FoxPro over COM (as we are with wwDotnetBridge) there's already thread marshalling happening that should prevent any thread conflicts from manifesting with async code. Running a few tests firing off 10 simultaneous requests and collecting them seems to work reliably even for long runs. Still make sure you test this out to make sure you don't run into thread lock up or corruption. Check, test and be vigilant if you go down this path.

Calling Task based awaitable methods in .NET shouldn't be done to provide async functionality - it should be done merely to call methods that you can't call any other way. Otherwise I'd recommend to **not use Task based APIs** from FoxPro - stick with synchronous code and if necessary use `InvokeMethodAsync()` to make code truly async from FoxPro.

### Async with wwDotnetBridge: Use InvokeMethodAsync()
Also, keep in mind that you can call **any** method in .NET asynchronously with wwDotnetBridge using [InvokeAsync()](https://www.west-wind.com/webconnection/docs/_4iu0wxvi1.htm). Unlike calling a Task based method as described above using this approach actually provides you with a callback mechanism when the async operation completes. If you're looking for code to execute out of band, `InvokeAsync()` is the way to go.

### Done and Done
So there you have it: You can call Task Async methods with wwDotnetBridge - it works, but it's not necessarily the best idea. You can use it if you have to, but if possible stick with synchronous APIs or if you truly need out of band async with proper callback notifications use `InvokeAsync()`. 

Have at it!

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
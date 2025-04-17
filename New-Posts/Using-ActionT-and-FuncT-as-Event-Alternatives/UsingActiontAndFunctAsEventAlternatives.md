---
title: Using Action<T> and Func<T> as Event Alternatives
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2024-06-28T15:26:38.5854253-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Back to Basics: Using Action<T> and Func<T> as Event Alternatives
I've been updating a number of extension features in Markdown Monster recently from really old versions that were all synchronous, and that now need to move to async functionality. This was originally due to a move from the WebBrowser control to the WebView control, which **requires async code** for browser interop operations. The async cascade that followed ended up touching a huge chunk of Markdown Monster's code that had to be switched to async methods in order to continue to work.

Long story short a number of the extensibility events in Markdown Monster Addins and also in RenderExtensions originally had extension handlers that were implemented as `Action<T>` operations. The actions if provided are fired as event alternatives and usually pass in reference types of one sort or another that could be updated.

An example of this was RenderExtensions which would take an `Action<BeforeMarkdownRenderedArgument>` which allowed easy overriding


Although I've been using async code in .NET for many years, whenever it comes to dealing with async structures, I have to spend a minute thinking about how they work and some of the implications. `Task`, `Action`, `Func`, `TaskCompletionSource`, `TaskContinuation` etc. etc. there are a lot of moving parts and I dunno my mind doesn't naturally want to go to these async constructs.

I recently went down (another) rabbit hole when I was working with some existing pseudo event code in Markdown Monster RenderExtension, where the render extension is has an `Action` handler that can be overridden.

This has been working fine for most things, but I needed to perform an async operation in this handler. If you follow this blog even with some irregularity you've probably heard me rail against struggles with async -> sync and sync -> async transitions and this - and the topic of this post - is another one of these. :smile:

Specifically I ran into the issue of wanting to call an `Action<T>` asynchronously **and** wait for completion. Turns out that's not really possible, but there's an easy and to me at least not so easy workaround.

## Async Actions?
Say you have an Action for a notification operation assigned to an object like this and you want to run that operation asynchronously.

You might declare the delegate like this:

```cs
Action<string, string> topicRendered = async (topic, project) =>
{
	await Task.Delay(1000);
	Console.WriteLine("delay completed");
};

topicRendered.Invoke("1","2");
Console.WriteLine("action done");	
```

While that code compiles and runs, it doesn't do what you probably want it to do: It won't run the async code and return when it's done. Instead the Action invoke returns immediately with the delay and completion firing a second later - it's essentially Fire and Forget as we're not awaiting the Task result.

The code produces:

```
action done
delay completed
```

That may be sufficient, but if you're using an event to handle a hook operation that depends on some sort of result, you need to make sure that the action completes. But it needs to be async.

> You can of course use `.Result` to wait for completion, but that almost always ends in tears in anything but a Console application. My advice: don't do except for highly controlled one-offs.

Bottom line is that there's no easy way that I know of to do this with `Action<T>`. Actions don't return a result an

Instead what you want is `Func<Task>` or one of its derrivatives. The generic task parameter is the result value, and the result value needs to be a `Task`.

This works and has the correct behavior:

```csharp
// two parameters, Task result
Func<Topic, Project, Task> topicRendered = async (topic, project) =>
{
   await Task.Delay(1000);
   Console.WriteLine("delay completed");
};
await topicRendered.Invoke("1", "2");
Console.WriteLine("action done");
```

```
delay completed
action done
```

### Fun Fact: Actions and Func can be chained
It's not very obvious, but if you declare a Llambda delegate to a variable it behaves similar to the way 'events' behaved in that you can chain multiple delegates together.

```cs
Func<string, string,Task> topicRendered = async (topic, project) =>
{
	await Task.Delay(1000);
	Console.WriteLine("delay completed");
};

topicRendered += async (topic, project) =>
{
	await Task.Delay(1000);
	Console.WriteLine("delay2 completed");
};

await topicRendered.Invoke("1", "2");
Console.WriteLine("action done");
```	

What this means if you declare an Action or Func property on a class, you pretty much get all the event behavior of years past without the event noise in the class declaration:

```cs
public class Functional 
{
    public Func<DocTopic, Task> OnTopicNavigated { get; set; }

    public async Task WalkTopicTree(DocTopic topic) 
    {
        // ...
        if (OnTopicNavigated != null)
            await OnTopicNavigated(topic);
    }
}

var f = new Functional();
f.OnTopicNavigated = async (tpc) => await Task.Delay(1000); 
f.OnTopicNavigated += async (tpc) => await Task.Delay(1200); 
```

The one caveat here is that you have to check and make sure the 

### Using Actions and Functions as Parameters or Event Proper
ties



Ok that's simple enough and that works. You can get this code **to run** easily enough with:

```cs
public async Task WalkTopicTree() 
{
    // works but returns immediately and doesn't wait
    topicRendered.Invoke(topic,project);
}
```

But there's a problem: This code now runs truly in the background in Fire and Forget fashion - the call returns immediately. It doesn't delay and then return, but returns immediately. The code inside of the action is working as expected but it can't return the async result because `Action<T>` has no result.

IOW, you can't do something like this (which was my first thought - duh):

```cs
// invalid
await topicRendered.Invoke(topic,project);
```



Bottom line you can't easily activate a `Action<T>` asynchronously **and** await the method to continue. You can **can** run action and asynchronously let it run in the background, but retrieving a result or accessing a referenced parameter value is tricky because you can't easily await the invocation.

However, if you need to run a delegate asynchronously, what you need is `Func<Task>` (or a parameterized version like `Func<string, Task>`). The task result is what you can use for the async result operation:


This is quite obvious once you see it, however, I screwed around with trying to get an `Action<T>` to run asynchronously before realizing that that wasn't directly supported.


```

```






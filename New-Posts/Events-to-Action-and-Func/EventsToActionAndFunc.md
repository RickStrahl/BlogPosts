---
title: Events to Action and Func
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2024-06-30T12:11:06.4612099-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Events to Action and Func



















## Events, Events  
If you've been doing .NET since the very beginning in pre-historic .NET history, you probably remember a time where events and delegates were very common. Events were everywhere for UI operations (since it was still a very desktop and WinForms and WebForms centric world) and even on common components. Events were a bit cumbersome as they required a bunch of code constructs to be implemented. So much so that back then I remember actively trying to avoid events as much as possible due to the noise they would add to classes and APIs.

With the introduction of Llamda functions and `Action` and `Func` in C# things got a lot easier to more easily create 'portable' functions that can be either just attached inline or easily be provided as single properties or parameters in code.

### The Problem with `event`
Prior to Llambdas and Action/Func, you had to explicitly declare `event` properties in .NET along with delegates in a method which made the process of working with events a two step process: 

* Declare an Event
* Implement a delegate handler method
* Typically implement another `OnEvent` method

Easy to use but noisy at the class level as you end up with an event, handler and On handler. Lot of boiler plate there. In short a lot of ceremony around what now seems a simple process of setting or passing a Llamda or Action/Func.

Welcome to the noise:  

```cs
public class wwSmtpOld
{
	// Delegate declaration
	public delegate void delSmtpNativeEvent(object Smtp);

	// Event declaration with delegate
	public event delSmtpNativeEvent MessageSendComplete;

	// `OnEvent` Handler on class for overrides and simpler calling
	public void OnMessageSendComplete()
	{
		if (MessageSendComplete != null)
			MessageSendComplete(this);
	}

	//  raise the event
	public void SendMessage()
	{
        if (true)   /// SendMailMessage())
			OnMessageSendComplete();		
	}
}

void Main()
{
	//var smtp = new wwSmtpNew();
	var smtp = new wwSmtpOld();
	
	smtp.MessageSendComplete += MessageSendComplete1;
	smtp.MessageSendComplete += MessageSendComplete2;
	
	smtp.SendMessage();
}

// External Event Handlers
void MessageSendComplete1(object p) 
{
	Console.WriteLine("Message Send Complete");	
}
void MessageSendComplete2(object p)
{
	Console.WriteLine("Message Send Complete");
}
---

var smtp = new wwSmtp();
smtp.MessageSendComplete += MessageSendCompleteHandler();

public void MessageSendCompleteHandler(wwSmtp) 
{
    // ... do something
}
```

Aren't you glad we left that behind? :smile:

It's funny to look at code like this but I pulled this out of an old class that originated in the .NET 1.1 timeframe and never got updated. Once implemented it actually works fine, and of course for usage you can now use Llamdas for this:

```cs
void Main()
{
	//var smtp = new wwSmtpNew();
	var smtp = new wwSmtpOld();
	
	smtp.MessageSendComplete += (p) => { Console.WriteLine("Message Send Completed 1");
	smtp.MessageSendComplete += (p) => { Console.WriteLine("Message Send Completed 2");
	
	smtp.SendMessage();
}
```

so at least that part can be more streamlined.

## LLamda Delegates and Actions and Func
Luckily things got a lot easier in C# 3 with the introduction of LINQ which as a side effect also brought Llamda expressions which allowed for a few important new features:

* Ability to create 'lose' event handlers 
* Assigning handlers to variables that can be easily passed around
* Shortened syntax that skipped type information

Most components - and especially UI components had event handlers. Having been around that long when I think of functional operations and hooks, my first thought is always to implement an event, which these days is probably not the best approach.

Instead today we have more functionality equivalents that allow C# to dynamically create delegates and pass them around easily using `Action<T>` and `Func<T>` which provide much of the same functionality that events provided. 

In the legacy code above all of that noise can now be reduced to:

```cs
public class wwSmtpNew
{    
    // Event declaration with delegate
    public Action<object> MessageSendComplete;

	public void SendMessage()
	{		        
		MessageSendComplete?.Invoke(this);		
	}
}

void Main()
{
	var smtp = new wwSmtpNew();
	smtp.MessageSendComplete += (s) =>
	{
			Console.WriteLine("Message Send Complete 1");
	};
	smtp.MessageSendComplete += (s) =>
	{
		Console.WriteLine("Message Send Complete 2");
	};
	
	smtp.SendMessage();
}
```

What makes this code more compact primarily is the ability to replace the `delegate event` syntax with an `Action` delegate that doesn't need to be explicitly declared. Additionally the introduction of the nullable operator (`?.`) lets you easily check for whether the handler is active so the an explicit `OnEvent` handler is usually not required.

> Note also that you use `+=` to chain multiple delegate handlers to the `Action` property which provides the same functionality as an event. `Action` is in effect a delegate so whenever you see an action property or variable you can chain multiple 

### Modern Eventing using Action, Func and Direct Delegates


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

While that code compiles and runs, it doesn't do what you probably want it to do: It won't run the async code and return when it's done. Instead the Action invoke returns immediately with the delay complete firing a second later - Fire and Forget.

```
action done
delay completed
```

That may be sufficient, but if you're using an event to handle a hook operation that depends on some sort of result, you need to make sure that the action completes. But it needs to be async.

Bottom line is that there's no easy way to do this with `Action<T>`. Instead what you want is `Func<Task>` or one of its derrivatives. The generic task parameter is the result value, and the result value needs to be a `Task`.

This works and has the correct behavior:

```csharp
Func<string, string,Task> topicRendered = async (topic, project) =>
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



Bottom line you can't easily activate a `Action<T>` asynchronously **and** await the method to continue. You can **can** run action and asynchronously let it run in the background, but retrieving the result is tricky.

However, if you need to run a delegate asynchronously, what you need is `Func<Task>` (or a parameterized version like `Func<string, Task>`). The task result is what you can use for the async result operation:


This is quite obvious once you see it, however, I screwed around with trying to get an `Action<T>` to run asynchronously before realizing that that wasn't directly supported.


```

```




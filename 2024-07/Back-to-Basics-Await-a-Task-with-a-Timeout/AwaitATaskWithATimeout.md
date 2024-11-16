---
title: 'Back to Basics: Await a Task with a Timeout'
featuredImageUrl: https://weblog.west-wind.com/images/2024/Back-to-Basics-Await-a-Task-with-a-Timeout/TimeIsRunningOut.jpg
abstract: Sometimes it's useful to call async methods and be able to stop waiting after a given timeout period. Unfortunately there's no native support on Task to provide this. In this short post I show how you can simulate timeouts and provide a couple of helper methods to make the process generically available.
keywords: Task, Timeout
categories: .NET
weblogName: West Wind Web Log
postId: 4505520
permalink: https://weblog.west-wind.com/posts/2024/Jul/25/Back-to-Basics-Await-a-Task-with-a-Timeout
postDate: 2024-07-25T08:48:00.5279878-10:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Back to Basics: Await a Task with a Timeout

![Time Is Running Out](TimeIsRunningOut.jpg)

The other day I needed to set a `TaskCompletionSource` and wait on an operation to complete. Easy enough - you can just await the `tcs.Task`. But in some cases the operation doesn't complete, and so it's also necessary to allow for a time out to stop waiting and assume the operation failed.

`Task` natively doesn't have a way to provide for a timeout on a single task, and by default an `await` call on a task results in an indefinite wait on the task to complete which... can be problematic in cases where the task is expected in some cases to not fire.

> #### @icon-info-circle Task.WaitAsync() is new in .NET 8.0
> Turns out that .NET 8.0 and later introduces `Task.WaitAsync()` instance method, that provides similar functionality to what I discuss in this post. Thanks to several commentors who pointed this out - I'd missed this new feature. I've [added a section for Task.WaitAsync()](#taskwaitasync) to the bottom of the post. Keeping the post as it provides support for older versions of .NET including .NET Framework as well as some insight on how this works.

In my scenario this was a WebView navigation which can fail if an invalid URL is provided, or if you're navigating to site that is there, but not connecting and indefinitely hanging. In that scenario you want to *have an out* so that you are not waiting forever on that task to complete.

##AD## 

## Checking for a Task Operation Timeout
So how do 'time out' a Task that you're waiting on? You can check for a timeout by combining  `Task.Delay()` and `Task.WhenAny()` to return the first task that completes:

```cs
var taskToComplete = SomeTaskOperation(); // not awaited here
var timeoutTask = Task.Delay(msTimeout);

var completedTask = await Task.WhenAny(taskToComplete, timeoutTask);
bool completed = completedTask == taskToComplete;
```

The idea is that you run both your task and the delay task and if our task completes first then it didn't time out. If the delay completes first, your task took too long. Times up, lights out! 

### Turn it into an Extension Method
To make this more generic we could create a couple of extension methods, one that simply checks for a timeout and another that returns the result of both the timeout status and the result value:

```csharp
public static class TaskExtensions
{
    public static async Task<bool> Timeout(this Task task, int timeoutMs)
    {
        var completed = await Task.WhenAny(task, Task.Delay(timeoutMs));
        
        if (task.IsFaulted)
            throw task.Exception.GetBaseException();

        return completed == task && task.IsCompleted;
    }
}
```

To use this first one, you check for the timeout to succeed and then pick up any result value from `task.Result` of the now completed task:

```cs
var taskToComplete = DoSomething(1000);  // non-awaited async method below

// Call and retrieve success or timeout
bool isComplete = await taskToComplete.Timeout(2000);

// should time out after 2 seconds
Assert.IsTrue(isComplete, "Task did not complete in time");

// if sucess get the Result from the task
int result = taskToComplete.Result;
Assert.AreEqual(result, 100);
---

private async Task<int> DoSomething(int timeout)
{
    await Task.Delay(timeout);
    return 100;
}    
```

In this code I want to execute a task that takes 1000ms - so it succeeds as it's under the 2000ms timeout. If the task takes 3000ms then it fails as it's longer than the 2000ms timeout.

If you prefer to retrieve the result, but deal with exceptions instead, you can use the `TimeoutWithResult()` method instead, which directly returns a result and throws an exception if the operation times out.

```csharp
public static async Task<TResult> TimeoutWithResult<TResult>(this Task<TResult> task, int timeoutMs)
{                       
    var completed = await Task.WhenAny(task, Task.Delay(timeoutMs));     
    
    if (task.IsFaulted)
        throw task.Exception.GetBaseException();

    if (completed == task && task.IsCompleted)
    {
        return task.Result;
    }

    throw new TimeoutException();
}
```

You can call this method like this:

```cs
int result = 0;
try
{
    // no timeout no exception
    result = await DoSomething(1500).TimeoutWithResult(2000);
}
catch(TimeoutException ex)
{
    Assert.Fail("Task should not have timed out: " + ex.Message);
}
catch(Exception ex)
{
    Assert.Fail("Task should not have thrown an exception: " + ex.Message);
}

// No timeout since task completes in 1.5 seconds  
Assert.IsTrue(result==100, "Task did not return the correct result");
```

This method has some limitations in that the `default()` result can mean either the method call returned a `default()` result or the call timed out. If you don't care about the why it 'failed' then this method is a little cleaner to use. 

Note that in both methods errors are propagated so you can use regular try/catch to catch exceptions in task code to catch failures in the executed task.

##AD## 

## Using Task.WaitAsync()
As mentioned by several commentors, as of .NET 8.0 there's a new [Task.WaitAsync()](https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.task.waitasync?view=net-8.0#system-threading-tasks-task-waitasync(system-timespan)) instance method that can be used to wait for completion. The method is similar to the `TimeoutWithResult<TResult>()` method I've described, but it throws exceptions when timed out, so the behavior is slightly different:

```cs
var taskToComplete = DoSomething(1000);

bool isComplete = false;
int result = 0;
try
{
    result = await taskToComplete.WaitAsync(TimeSpan.FromSeconds(2));
}
// Capture Timeout
catch(TimeoutException ex)
{
    Console.WriteLine("Task timed out: " + ex.Message);
}
// Fires on Exception in taskToComplete
catch (Exception ex)
{
    Console.WriteLine("Error: " + ex.Message);
}

Assert.AreEqual(100, result);
```

The method works similar to the described method here, by waiting for completion or simply returning at which point you can check the the `task.IsCompleted`

## Summary
This is not anything new and well, there's now a native method that provides this functionality, but I've run into cases where I needed a timeout on the async code I'm calling in a semi-generic way. It'd be nice if there was native support for this, but the code above is easy enough to integrate into a small helper library if necessary. 

If you're not using .NET 8.0 yet or still using .NET Framework these helper functions will work for you in those environments.

I also added these functions into [Westwind.Utilities](https://github.com/RickStrahl/Westwind.Utilities) in the [AsyncUtils class](https://github.com/RickStrahl/Westwind.Utilities/blob/master/Westwind.Utilities/Utilities/AsyncUtils.cs) as extension methods to Task.
---
title: Explicitly Ignoring Exceptions in C#
abstract: In most applications I have a few places where I explicitly need to ignore errors. While generally this isn't a good idea, under some circumstances you just don't care if an error occurs or you simply want a yay or nay response. In this stupid pet tricks post, I describe a few scenarios where not catching any exceptions makes sense along with a couple of helper methods that make these scenarios more explicit so code analyzer and book thrower reviewers can be quieted down.
keywords: Ignore,Exception,Try,Catch,Lambda
categories: C#,.NET
weblogName: West Wind Web Log
postId: 822354
postDate: 2018-06-16T11:21:47.2145427-07:00
customFields:
  mt_github_url:
    key: mt_github_url
    value: https://github.com/RickStrahl/BlogPosts/blob/master/2018-06/Explicitly-Ignoring-Exceptions-in-C/ExplicitlyIgnoringExceptionsC.md
---
# Explicitly Ignoring Exceptions in C#

![](IgnoranceIsBliss.jpg)

This post falls in the stupid pet tricks category. In most applications I have a few places where I explicitly need to ignore errors. You know the stuff where you use a try/catch blocks without any actual filter to capture the exception:

```cs
try
{
   File.Delete(filename); 
}
catch
{
}
```

This code, besides being very verbose, also triggers analyzer warnings that complain about the 'inappropriate use of a try/catch' block. And let's not forget to mention anybody who reviews the code immediately throwing the book at you (you know who you are **Mr. Bookthrower**).

## Ignored Exceptionalism 
In this world of Exceptionalizm we all are very sensitive to taking exception. So, let me start this post by saying that ignoring exceptions generally is **a bad idea**. In just about all situations where you put a try/catch around a block of code, **you should always have an appropriate `catch` handler** that captures a specific exception like `(UnAuthorizedAccessException ex)` - or even a non-specific exception like `(Exception ex)` to pass on or otherwise handle the exception in the appropriate location.

It's best to handle exceptions as close as possible to the source because the closer you are the more context you have to do something useful with the exception.

But, as with all rules in my book:  **Rules are meant to be broken!** 

Cue Dr. Evil laugh track... Muuaaaahhaaaa!

## Ignorance is Bliss
Alas, in almost every application I find myself in situations where I simply don't care about a thrown exception. So yeah, I can **pretend** to handle the exception properly with an exception filter, but then still really do nothing with it. This satisfies the analyzer rule engines, but certainly not your friendly neighborhood book thrower in a code review.

So when does it actually make sense to ignore exceptions? Here are a couple of examples that apply to me.

The most common scenario tends to be disk based operations where I need to read/write to files and the files don't exist. Right now in [Markdown Monster](https://markdownmonster.west-wind.com) I do quite a few asynchronous background operations that do things like writing a backup file, or checking whether a checksum of a file has changed to ensure that the file on disk and what's in the editor stay in sync. There are lot of things that can cause file operations to fail there due to file locking conflicts or timing errors and often I don't care if it fails, because it's one of many operations that'll be handled in the next round of events. There are high level operations like the final file save/load operations that have explicit handlers, but a lot of the lower level ones can just silently fail.

##AD##

Also in Markdown Monster there are a lot of HTTP based check operations if URL content exits. Checking for blog discovery URLs, for dictionary spell checker and license URLS require a check of a URL which will throw on failure and I don't care about the exceptions just whether it worked or not.

Also file operations like `File.DeleteFile()` or `Directory.DeleteDirectory()` fail if files or directories aren't there. Well if they're not there for all intents and purposes those operations succeeded because the file/dir isn't there anymore, is it now? 

In all those cases I don't care about the failure and essentially I just want to ignore it or at best be notified yay or nay of the failure.

## Explicit Ignorance
So, pragmatic creature I tend to be, I created a couple of small helper functions that make ignoring errors very explicit and maybe a little less verbose. So rather than writing a messy, book thrower prone  `try`/`catch` block, I can write something like this:

```csharp
// safe delete
LanguageUtils.IgnoreErrors(() => File.Delete(workFile)); 
```

or something that actually checks for the success of the operation:

```cs
// Create a directory and if it works return the name
if (LanguageUtils.IgnoreErrors(() => { Directory.CreateDirectory(workFolder); }))  
    return workFolder;         
```

or using the generic version which allows me to return a result value or a default:

```cs
// with parameter results
var html = LanguageUtils.IgnoreErrors<string>(()=> HttpUtils.HttpGetString(url));
if (html == null)
   Model.Window.ShowStatusError("Download failed...");
```

**Take that book throwers!**

All kidding aside, this makes the code very explicit by stating my intent which is: **I am choosing to throw caution to the wind, just let me do my thing!**. To my eye this also reads cleaner and requires less bracket typing than a `try`/`catch` block which helps reduce code clutter.

The implementation of these helpers is simple enough:

```csharp
public static class LanguageUtils
{
    /// <summary>
    /// Runs an operation and ignores any Exceptions that occur.
    /// Returns true or falls depending on whether catch was
    /// triggered
    /// </summary>
    /// <param name="operation">lambda that performs an operation that might throw</param>
    /// <returns></returns>
    public static bool IgnoreErrors(Action operation)
    {
        if (operation == null)
            return false;
        try
        {
            operation.Invoke();
        }
        catch
        {
            return false;
        }

        return true;
    }

    /// <summary>
    /// Runs an function that returns a value and ignores any Exceptions that occur.
    /// Returns true or falls depending on whether catch was
    /// triggered
    /// </summary>
    /// <param name="operation">parameterless lamda that returns a value of T</param>
    /// <param name="defaultValue">Default value returned if operation fails</param>
    public static T IgnoreErrors<T>(Func<T> operation, T defaultValue = default(T))
    {
        if (operation == null)
            return defaultValue;

        T result;
        try
        {
            result = operation.Invoke();
        }
        catch
        {
            result = defaultValue;
        }

        return result;
    }
}
``` 

I kind of think of these functions as `SafeEval()` operations, because effectively that's what they are doing: They let you write lambda functions to pass in and execute inside of an exception handler. The first version returns true and false depending on whether the handler was triggered, the second one returns a result value or the default value for the passed generic argument.

The main benefit I see from these helpers is readability - you're effectively making it very explicit what you are doing by announcing that you are ignoring errors. It also helps by making it easy to capture the failure case with a simple logical value, or with a known result and failure values.

Keep in mind there's some small overhead to using this over using a try/catch handler - this ends up translating: Each Lambda you create generates a closure structure that so there is an extra structure and an extra function call involved in all of this. 

##AD##

So, clearly this is a feature geared at code readability and explicitness rather than providing any real runtime benefit.

Again I want to be clear: Just like the try/catch handler without an exception filter, this **should be used sparingly** and only when you explicitly know that you want to ignore an exception or don't care about the exception and just need to know whether it worked.

## Summary
As I said at the outset this falls under Stupid Pet Tricks and a very simple one at that. However, after creating this little helper and digging through the Markdown Monster source I found nearly 30 instances of non-specific try catch blocks that could benefit from this code and using this function certainly ended up making those bits more readable. Maybe some of you will also find this little nugget useful. Enjoy.

## Resources
* [Part of WestWind.Utilities NuGet Package](https://nuget.org/packages/Westwind.Utilities/)
* [Latest code on Github](https://github.com/RickStrahl/Westwind.Utilities/blob/master/Westwind.Utilities/Utilities/LanguageUtils.cs)

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
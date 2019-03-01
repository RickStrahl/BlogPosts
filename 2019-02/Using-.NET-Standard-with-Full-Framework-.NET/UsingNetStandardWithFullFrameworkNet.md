---
title: Using .NET Standard with Full Framework .NET
abstract: Using .NET Standard on full .NET Framework is a mixed bag because the behavior of .NET Standard differs depending on which version of the Runtime you are integrating with. In this post I review what .NET Standard is and how it fits in with the full .NET Framework and how you can use .NET Standard packages/assemblies in full framework along with some of the problems you have to watch out for.
keywords: .NET Standard, .NET Framework, 4.7.2, 4.6.1, Runtime, Assembly Redirect
categories: .NET,.NET Standard
weblogName: West Wind Web Log
postId: 1157964
postDate: 2019-02-19T02:03:39.0770996-10:00
customFields:
  mt_githuburl:
    key: mt_githuburl
    value: https://github.com/RickStrahl/BlogPosts/blob/master/2019-02/Using-.NET-Standard-with-Full-Framework-.NET/UsingNetStandardWithFullFrameworkNet.md
---
# Using .NET Standard with Full Framework .NET

![](Standard.jpg)

.NET Standard has been around long enough now that most people are reasonably familiar with this somewhat 'unnatural' concept.  The idea of targeting or consuming a library that is not really a library but a specification which in turn affects the build process and runtime binding takes a bit getting used to.

Things have gotten a little clearer recently with [better documentation](https://docs.microsoft.com/en-us/dotnet/standard/net-standard) from Microsoft and clearer designations on what versions of the various .NET runtimes support what version of .NET Standard. With more implementations out in the wild now too, it's easier to see and realize the benefits of .NET Standard whereas in the early days of .NET Core and .NET Standard much of .NET Standard seemed sort of academic.

But there's still a lot of confusion for people who are not keeping up with all the latest .NET tech. It's not a concept that comes naturally unless you've been following the evolution of .NET and it's **torturous versioning paths**. Rather,  seeing it in action is the best way to make sense of it - at least that's how it worked for me.

I've [talked about .NET Standard in previous posts](https://weblog.west-wind.com/posts/2016/Nov/23/NET-Standard-20-Making-Sense-of-NET-Again) (and [here](https://weblog.west-wind.com/posts/2017/Jun/22/MultiTargeting-and-Porting-a-NET-Library-to-NET-Core-20)) so I won't rehash it here. This post is about a more specific scenario which is using .NET Standard libraries in full .NET Framework, which has its own set of peculiarities.

But first a short explanation of .NET Standard.

##AD##
 
## What is .NET Standard?
Here's my short definition of what .NET Standard is:

> #### @icon-info-circle .NET Standard is a Specification not an Implementation
> .NET Standard is a specification that describes specific feature implementations that a .NET Runtime like .NET Core, .NET Framework, Mono, Xamarin or Unity has to implement - at minimum - to support that version of the Standard.
>  
> For library authors targeting .NET Standard provides the same feature set across all supported platforms - if it compiles to .NET Standard it'll very likely run on those frameworks. For consumers it's an easy way to tell which platforms a .NET Standard component can work on.

The current most widely applied version of .NET Standard is **.NET Standard 2.0** but there are 1.0, 1.1, 1.6 and the latest 2.0. Each version includes progressively more features.

.NET Standard is a specification that serves as a base feature blue print for .NET runtime implementations. Runtime implementations are specific versions of a .NET Runtime such as .NET 4.6.1 or 4.7.2, .NET Core 2.2, Xamarin.IOs 10, Mono 5.18 etc.

Any one of those runtimes that want to support .NET Standard have to implement a specific set of .NET features that are defined by .NET Standard. .NET Standard describes the base CoreFx library - what we used to think of as the Base Class Libraries (BCL/FCL) in full framework that make up the core features of the platform.

It's up to the specific runtime to implement the features set forth in the Standard. The logistics of this involve some runtime magic where each runtime provides a set of .NET Standard forwarding assemblies that map the .NET Standard APIs to the actual underlying APIs on the specific Runtime. To the consumer it feels like you're using the same .NET APIs as always, but underneath the covers those APIs re-route to the appropriate native APIs.

The big win with .NET Standard is that it provides a common interface to runtime implementers, who have to make sure that their runtimes support the Standard's features and for component implementers that know what features they can use reliably across the platforms supported by the .NET Standard version they are using. 

There are different versions of .NET Standard that are supported by different versions of various runtimes. The following matrix is from the [.NET Standard documentation page](https://docs.microsoft.com/en-us/dotnet/standard/net-standard):

![](NetStandardSupport.png)

In concrete terms this means that when you build a library you can target .NET Standard and expect the compiled assembly/package to work on **any of the platforms that support that version of .NET Standard**.

If you're building libraries, you'll want to target the lowest version of .NET Standard that your library can work with. But for most intents and purposes I think that .NET Standard 2.0 is the new baseline for anything useful going forward.

## .NET Standard and Full Framework .NET
One of the supported Runtimes for .NET Standard 2.0 is the full .NET Framework.

For full framework the .NET Standard story unfortunately is a bit confusing because although all versions of .NET 4.6.1 and later are .NET Standard 2.0 compliant which means you can consume .NET Standard 2.0 in 4.6.1 and later. However, **some versions of full framework are more compatible than others**. 

.NET 4.6.1, 4.6.2, .NET 4.7 and 4.7.1 all have **partial** .NET Standard 2.0 support in the natively shipped runtimes, but they still are .NET Standard 2.0 compliant by adding additional runtime dependencies into your output folder to provide the missing functionality. NuGet along with the runtime targeting handles automatically adding those dependencies to your projects to provide the needed runtime support for those extra features. A lot of those assemblies override behavior from the base framework and .NET uses runtime redirects to route api calls to the appropriate assemblies rather than than mscorlib.dll or other system assemblies.

**.NET 4.7.2** is the first version of the full .NET Framework that is **fully .NET Standard 2.0 compliant** without any additional dependencies.

### First Version to support .NET Standard 2.0 is 4.6.1
The first version of .NET Framework that is .NET Standard 2.0 compliant is **.NET 4.6.1**. 4.6.1 through 4.7.1 are all partially compliant with the shipped Runtime, but work by adding additional dependencies to your project when a .NET Standard 2.0 component is added.

When you add a .NET Standard 2.0 targeted package to say a .NET 4.6.2 project, a number of additional assembly dependencies and assembly redirects provide updated runtime components that are installed to provide the missing runtime features. This adds a non-trivial amount of assemblies to your application's `bin` folder that have to be distributed with your application and a bunch of assembly redirects to your `app.config` file.

This is pretty messy and clutters up your output folder and `app.config`, but it does work and lets you use .NET Standard 2.0 components from these older runtime versions.

### The first version that fully .NET Standard 2.0 Compliant is 4.7.2
Each successive version of full framework .NET has slightly better support for .NET Standard 2.0 up to 4.7.2 which now has full support for it and is the first version that can use .NET Standard 2.0 packages without bringing in extra dependencies.

So, for best .NET Standard support in full framework .NET, ideally you should target 4.7.2 (or 4.8+ once that comes out). Unfortunately that's probably not realistic for public distribution applications as there are still plenty of people on older versions of .NET.

For Markdown Monster which even though it's pretty tech focused, about 25% of users are not on .NET 4.7.2 and a good chunk of that is still on .NET 4.6.2/1. It'll be a while before I can target 4.7.2 and not turn away a significant chunk of users without them having to update their .NET Runtime.

##AD##
 
## Concise Example: Using LibGit2Sharp in Markdown Monster
So what does all that mean for an application? Let me give you a practical example. In Markdown Monster which is a WPF desktop application that targets .NET 4.6.2, I'm using [LibGit2Sharp](https://github.com/libgit2/libgit2sharp) to provide a host of Git integration features in the file and folder browser as well as the ability to commit current and pending documents in the document's repository.

A little while back LibGit2Sharp switched their library over to support **only** .NET Standard 2.0 and they dropped support for other .NET Framework versions for a brief moment of time. Of course it's that moment that I decide to jump in and bite the bullet to think about upgrading. Since then LibGit2Sharp released a new version that added back full framework support which actually belabors a point I'll make later on (oh the suspense :-)).

At the time when I went through this exercise, the choices I had was stick to an older version of LibGit2Sharp or keep moving forward with .NET Standard version. 

In version 0.25 you'd see this:

![](LibGitSharpNetStandardOnly.png)

Only .NET Standard 2.0 support!

### Stuck in 4.6.2
Markdown Monster has been running with a target framework of 4.6.2 in order to support older runtime installs on Windows. Supporting 4.6.x still brings in quite a few people who haven't updated to Windows 10 mostly, and even for my developer centric audience that's a not-insignificant number of users. I use 4.6.2 specifically because it introduced some important high DPI improvements for WPF that Markdown Monster relies on (for its built-in screen capture feature).

At the time I decided to give updating LibGit2Sharp with the .NET Standard based  0.25.4 version a try in my 4.6.2 project and I got the following assembly hell:

![](AssemblyHell.png)

By adding a reference to a .NET Standard 2.0 package a huge number of support assemblies - a subset of the CoreFx libraries effectively - are being pulled into the project, which is ugly to say the least. 

This was such a crazy mess that nearly doubled my distribution size, so I decided to **not roll forward to the 0.25 version** of LibGit2Sharp.

The issue here is that .NET 4.6.2 is .NET Standard compliant but in order to work, it needs a ton of newer features that were not present when that version of the framework shipped. In a way .NET Standard was **bolted onto** .NET 4.6.1, 4.6.2, 4.7, 4.7.1 resulting in all those extra assemblies and assembly redirects in `app.config`.

If you **really** need to use a component that doesn't have a .NET Framework version this might be an option, but frankly the distribution overhead made that a non-starter for me. 

**Thanks, but no thanks!**

### What a difference a Runtime Makes
There's a way to make this pain go away by targeting .NET 4.7.2 which as I mentioned earlier is **fully .NET Standard Compliant**. This means that all those APIs in the .NET Standard DLLs that were pulled in for 4.6.2 to provide missing functionality are available in the shipped .NET 4.7.2 base runtime.

The end result is: No extra dependencies. Here's the same `bin\Release` output folder in the 4.7.2 project with the same dependency added to Markdown Monster targeting 4.7.2:

![](NormalDependencies.png)

As you can see there no extra `System.` dependencies except the ones I added explicitly to the project.

**Much Better!**

### LibGit2Sharp has added back a 4.6 Target
An even cleaner solution is the route that LibGit2Sharp took **eventually** by bringing back a .NET 4.6 target in the library: In version 0.26 - conveniently after I went through all of the experimentation described above - you now have both .NET Standard and .NET 4.6+ target support:

![](LibGitSharpWithNet46Again.png)

This multi-targeted package when added to a full .NET Framework project will use the NET46 assemblies and **not clutter up your project** with all those extra dependencies even on my original .NET 4.6.2.

And I'm back to being able to keep up with the latest versions of LibGit2Sharp in Markdown Monster.

**We have a Winner!**

##AD## 

I think that this was a smart move on LibGit2Sharp's part. It's in vogue to .NET Standard All the Things, but practicality and more than likely the sheer numbers of user base often speak louder than the latest fad. I  **was not planning on upgrading** LibGit2Sharp to the .NET Standard only version, **because of the DLL dependencies** - that's enough of a blocker for me. Although I tried out running on .NET 4.7.2 which didn't add the extra assembly load, that doesn't really help me because 4.7.2 still excludes too many people from my user base without a forced .NET Framework upgrade which otherwise offers minimal benefits especially to end users.

### Library Authors: Don't target only .NET Standard if you work on Full Framework!

If you are a library author, multi-targeting in the newer .NET SDK Style project format is [fairly easy to set up](https://weblog.west-wind.com/posts/2017/Jun/22/MultiTargeting-and-Porting-a-NET-Library-to-NET-Core-20) and assuming your library doesn't depend on some of the newest features that are in .NET Standard that didn't exist previously, there are usually no code changes required to compile both for .NET Standard or Full Framework. 

> For the time being I think any popular 3rd party library that is expected to work on full .NET Framework, **should continue to ship a full framework target** in addition to .NET Standard. 

Regardless I suspect we're likely to see more and more libraries that end up targeting **only .NET Standard**. Hopefully the runtime version counts will keep creeping up to meet the versions that support .NET Standard completely. Maybe when .NET 4.8 ships the 1 step back will be 4.7.2 at that time. 
  
## Summary
.NET Standard with full framework is still confusing because it's not all that obvious what dependencies will be pulled in when bound to a specific version of the full .NET Framework. I hope this post clarifies some of that.

To summarize here are the key points

* **.NET 4.6.1-.NET 4.7.1: Not nyet!**  
4.6.1 through 4.7.1 add a boatload of additional runtime assemblies and assembly redirects to your project to work with .NET Standard 2.0. Avoid, unless you really need to use a .NET Standard component. Look for older versions that do support full framework. Pester third parties to still provide .NET Framework targets which is not a difficult thing to do with SDK style projects.

* **.NET 4.7.2: Works as advertised**  
.NET 4.7.2 is the first version of .NET Framework that fully supports .NET Standard 2.0 and there are no additional assemblies dumped into your output folder. This is what you would expect to happen.

* **Multi-Targeting for libraries is still recommended**  
Because of the limited 'full .NET Standard support' in older version of the .NET Framework, it's still recommended for third party providers to ship .NET Framework targets with their NuGet packages in addition to .NET Standard.

Multi-targeting with the new SDK projects is easy and once configured doesn't require any additional work in most cases. Using this approach full framework target can avoid the DLL deployment nightmare on 4.6.1-4.7.1.

* **If possible use .NET 4.7.2 or later**  
If you want full .NET Standard support, consider using .NET 4.7.2 or later. Not always an option, but if you can, this is the cleanest way to .NET Standard 2.0 o full framework today. We just need to wait until 4.7.2 or more likely 4.8 gets into the Windows update pipeline to flush out the old versions.

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
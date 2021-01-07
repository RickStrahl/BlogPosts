---
title: Upgrading to .NET Core 5.0
abstract: Over the last week I spent some time upgrading several .NET Core Web applications and libraries from .NET Core 3.1 to .NET 5.0. I'm happy to say that this was always a non-event as the process went very smooth for once. In this post I'll talk about what I found and also offer some commentary why we should celebrate this update and push Microsoft to continue along this path.
categories: .NET Core, ASP.NET Core
keywords: Upgrade, .NET 5.0
weblogName: West Wind Web Log (Local)
postId: 535244
featuredImageUrl: http://localhost:8101/images/2020/Upgrading-to-.NET-Core-5.0/ItsAGo.jpg
permalink: http://localhost:8101/posts/2020/Nov/24/Upgrading-to-NET-Core-50
postDate: 2020-11-24T13:28:10.9421484-10:00
---
# Upgrading Applications and Libraries to .NET Core 5.0

![](ItsAGo.jpg)

After .NET Core 5.0's release a couple of weeks ago, I went through all of my personal/company .NET Core 3.1 applications and upgraded them to .NET Core 5.0. In the past upgrades to major versions have been pretty painful or downright torturous, but with this update to .NET 5.0 (note that 5.0 drops the Core moniker) I'm happy to say that it's been perhaps the easiest migration of any major .NET version update.

## Easy Upgrades
All 3 applications and several .NET Core libraries updated with no code changes, other than removal of .NET Core 2.x specific code which I decided to stop supporting with these updates. Literally no code changes other than changing the runtime targets. 

Check out this change log for my AlbumViewer app (small sample app but still):

* [Update AlbumViewer to .NET Core 5.0 Changes](https://github.com/RickStrahl/AlbumViewerVNext/commit/14b6b6f9)

There's a single code main change required:

```xml
<TargetFramework>net5.0</TargetFramework>
```

That, plus updating the support libraries to the latest 5.x versions.

Unlike previous version updates there were no type changes and no changes to the startup configuration which in past versions has been a major point of contention for seemingly senseless name or namespace changes in previous version upgrades. **Not this time around**: Code just worked as is.

To be clear, this doesn't mean **you** won't see any update requirements in your projects. There are things that have changed - .NET Core is a huge framework and there are a few breaking changes. But for common base installations and core features for me at least in 3 separate projects from small to medium large I literally walked off with no code changes which is a breath of fresh air compared to any previous updates!

Some of this has to do with the nature of .NET 5.0: .NET 5.0 feels like a consolidation version that consolidates features and framework structures into a more coherent whole. Most of the big framework feature changes happened in .NET Core 3.x and  most of those improvements in 5.0 are backwards compatible or entirely new functionality that don't break existing code. Additionally much of the focus in .NET 5.0 has been on performance enhancements for existing and core framework functionality which is yielding noticeably faster applications at runtime and faster startup times - and it's really noticeable in my projects. 

Kudos to Microsoft for hitting this upgrade cycle out of the park.  Apparently this was a design goal as hinted at by David Fowler so succinctly:

![.NET 50: Thank you very much](https://github.com/RickStrahl/ImageDrop/raw/master/BlogPosts/Net50YourWelcome.gif)

Thank you... Thank you very much (in my best Elvis voice).

## Angular's Me Too
Incidentally, the above application is a .NET REST Service fronted by an Angular front end application, and I also updated Angular to version 11 at the same time. As I was doing the .NET Core Update, the Angular 11 update went live literally at the very minute I pushed my changes :smile:. Like the .NET Core Update the Angular 11 update also was a no-code-change update that took all of 15 minutes to update and get re-published.

## Updates Shouldn't be Painful
Kudos to both Microsoft and Google for putting out new major releases without the upgrade pain. 

Both .NET Core and Angular have had a torturous and rocky past with major changes in version upgrades and lots of people - me included - bitching about those changes, especially since a whole lot of them seemed change for change's sake. *Because we can* is not a good strategy for framework design. But it looks like both companies have listened to the feedback and it reflects in the update strategies and again I applaud that. And I hope that more people do to encourage that sort of thinking/planning going forward.

For perspective, in .NET Core every previous major version update involved hard to track startup changes, arbitrary type-renamings and obsoleting of types that were introduced a mere version before. All of that reeked of bad design and unending pain to developers often taking up hours of time to update even simple applications requiring creating new apps and comparing startup code line by line and re-mapping dependencies that had their names or namespaces changed. It was a real shit show (and I said so on this blog on many occasions).

Angular has a similar history to that effect, although in Angular most of the painful upgrade changes had more to do with some major architecture changes. The Angular team addressed most of these upgrade types of issues with their phenomenal **Angular Update** (`ng update`) CLI tooling that points out major changes required and can in many cases make those changes for you. The last ugprades since version 7 have been relatively quick and friction free although there often are still a handful of things to manually change. The latest Angular 11 update for the above application however was literally a no code change update. Yay!

Here's the Angular 11 update although this commit also has a few small application changes in it:

* [Update AlbumViewer to Angular 11](https://github.com/RickStrahl/AlbumViewerVNext/commit/a17e8657)

## Framework Vendors: Make Upgrade Processing a Feature
The bottom line is that we as developers should hold Framework vendors feet to the fire to continue this sort of upgrade experience. Providing a smooth path to upgrade should be a core requirement for anything but completely new or revamped versions of a framework. Upgrades from v1 to v2 should not require endless updates and trying to hunt down arcane changed APIs or different libraries or if that's the case there should at least be very clear documentation or as Angular does some tooling that helps identify the likely update candidates. Angular's update tooling especially is an innovative approach that other vendors should take a very close look at as it provides huge value, especially in a fast changing JavaScript framework environment like Angular where framework updates now come every half a year. Nobody wants to spend a few hours every half year just to get a previously working application running on an updated framework!

## Other .NET Core Updates: Libraries
In addition to the 3 Web applications I updated, I also updated a handful of libraries that are published and shared on Nuget.

The story for those also was an encouraging one: None of the libraries required any code changes, other than changing the target framework and updating the core dependencies.

Here's the update log (with a few very minor additional changes) from my Westwind.AspNetCore.LiveReload component:

[.NET Core Update of Westwind.AspNetCore.LiveReload](https://github.com/RickStrahl/Westwind.AspnetCore.LiveReload/commit/6f55a5c6)

Again, main changes are adding the target framework:

```xml
<TargetFrameworks>net5.0;netcoreapp3.1</TargetFrameworks>
```

Fixing up any framework dependencies to the latest version (in this case there aren't any).

Remove some conditional .NET Core 2.x support.

## Removing Support for .NET Core 2.x
Most of my components are multi-targeted and up until this release I've been using `netcoreapp2.1,netcoreapp3.1` as targets. That's not moved up to `netcoreapp3.1,net5.0`. 

As a general rule I've been applying the support the last major version with backwards compatibility. Anything older than 1 prior .NET version people can continue to use the older libraries that were current up to the release of the new one.

But for the .NET Core 2.x support specifically I really wanted to get rid of the support code required to fix up `IHostingEnvironment` to `IWebHostEnvironment` which was one of those thoughtless type changes that Microsoft threw into the upgrade from 2.x to 3.x. Instead of keeping the base interface Microsoft decided to create brand new types and obsoleting the old type. I've [blogged about this issue](https://weblog.west-wind.com/posts/2020/Feb/26/Working-with-IWebHostEnvironment-and-IHostingEnvironment-in-dual-targeted-NET-Core-Projects) and how to get around it in a few ways.

This ended up resulting in crappy code like this:

```csharp
#if NETCORE2
                var env = provider.GetService<IHostingEnvironment>();
#else
                var env = provider.GetService<IWebHostEnvironment>();
#endif
```

 To be fair, `IHostingEnvironment` still works in .NET 5.0 but it generates a warning. The LiveReload component only uses this in a single place, but in several others there are multiple places where this sort of code needs to be applied.

Anyway long story short I was happy to get rid of this and a couple of other v2 specific bracketed code blocks.

Going forward I'll review how far back framework support will reach. If there are no or very minor non-impactful changes required to cross-compile it's easy enough to add another target version to the `<TargetFrameworks>` element. I suspect, seeing how this version progressed and how we are getting to be in perhaps a little more stable place with .NET Core runtimes I suspect going forward is going to be much smoother sailing in terms of compatibility. I certainly hope so...
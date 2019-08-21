---
title: Visual Studio 2019.2 and .NET 3.0 SDK Projects not Loading
abstract: Recent upgrades to Visual Studio 2019.2 seem to have broken projects that use the 3.0 .NET SDK as Visual Studio is defaulting to a pre-3.0 version of the SDK tools and compilers. The end result is that projects even fail to load in Visual Studio. There are workarounds but ultimately this an issue that Microsoft needs to address better in future updates.
keywords: 2019.2,SDK,Unloaded
categories: Visual Studio, .NET
weblogName: West Wind Web Log
postId: 1364123
permalink: https://weblog.west-wind.com/posts/2019/Aug/21/Visual-Studio-20192-and-NET-30-SDK-Projects-not-Loading
postDate: 2019-08-21T09:54:45.4024862-07:00
---
# Visual Studio 2019.2 and .NET 3.0 SDK Projects not Loading

![](BrokenGlass.jpg)

After upgrading to Visual Studio 2019.2.3 you may find that if you're using projects that use the .NET Core 3.0 SDKs will no longer work out of the box.

I have several 3.0 projects, but the one I use the most is my [Markdown Monster](https://markdownmonster.west-wind.com) project which is a .NET SDK WPF project that uses the new project format. This all worked perfectly fine in previously releases but after the update to 2019.2.3 I now get this:

![](UnloadedProjects.png)

Looking a little closer at the Output window I can see that the problem is the wrong version of an SDK is used, and it looks like by default Visual Studio uses .NET SDK 2.2 (it'll tell you when it's actually building).

![](OutputWindowMessage.png)

The message is:

> Unable to locate the .NET Core SDK. Check that it is installed and that the version specified in global.json (if any) matches the installed version.

It would be nice if this was more descriptive and told you a) what version it's looking for and b) what version it's trying to currently use.

The frustrating thing is that the proper SDKs are installed and Visual Studio now installs the appropriate SDKs. Yet it's unable to find the right version anyway.

That's not an improvement!

### 3.0 SDK Required!
The problem in the project above is that it's a .NET SDK project that **requires** the V3.0 SDK as it uses WPF which is part of the Windows platform support that was added in the 3.0 SDK versions. This project type doesn't work in older pre-3.0  versions of the SDK. So while other .NET Core 2.x projects compile just fine using the defaults, this particular project does not, even though the proper 3.0 Preview SDK is in fact installed. This worked before, but now fails.

### Fix It with global.json - sort of
The solution to SDK versioning problems in projects or Solutions is to use a `global.json` file in the Solution root to **specify a specific version of an SDK** to use with your project.

In there I can specify a specific version of my SDK I want to use for this project/solution:

```json
{
    "sdk": {
      "version": "3.0.100-preview8-013656"
    }
}
```

That works, but it is a **terrible** solution to this problem. It sucks because now I'm pinning my solution to a very specific (preview) version of the SDK. Since this project lives on Github and is shared anybody using the project now too ends up needing to use this same version of the SDK. Worse - if SDKs are updated now, I have to remember to update the `global.json` version to get the latest SDK, instead of the latest installed.

For now I decided to **not include the global.json in the Github repo**, which is also a sucky proposition as that likely means that after people pull the project it likely won't build unless a `global.json` is explicitly added with a valid SDK version.

I tried using more generic version numbers (3.0 and 3.0.*), but no luck with that - the only thing that worked for me was using a very specific version number.

### This needs to be Fixed
I'm not sure how this went through Quality Control and still has not been fixed even though there has been another point update to Visual Studio 2019.2, but I'm hoping this is a glitch in the SDK installation/configuration routines in Visual Studio and not by design.

There have been a lot of cries for help on this on Twitter, and on various mailing lists. This behavior is just very unexpected, and the error messages don't make it obvious what's wrong, much less provide hints on how to fix it.

Part of the caveat here is that 2019.2 isn't specifically designed to work with 3.0 anything at this point is still designated as preview. B

But still Microsoft has to know that lots of people are using the newer SDKs at least especially since this has all been working just fine for quite a while. I've been using the 3.0 SDK with Markdown Monster for a half a year at least in the RTM (not preview) versions of Visual Studio with no issues until recently.

I tried to figure out how Visual Studio is actually determining which SDK to use in lieu of a `global.json` but I see no obvious configuration setting for that.

There needs to be better support for this. At minimum the project should clearly show what SDK it is using and then perhaps allow easy options to choose one of the installed SDKs. More importantly though there really needs to be an option to choose an SDK level (ie. I don't care which specific version you use but use a 3.x version of the  SDK) so that my project at least builds.

Microsoft has stated that they are [trying to address the SDK install problems](https://devblogs.microsoft.com/dotnet/improving-net-core-installation-in-visual-studio-and-on-windows/) and that the current releases (rtm and preview) of Visual Stuio are starting to reflect that. The new SDK installers are supposed to clean up old SDKs and leave behind only one version plus specific preview SDKs. Since SDKs are backwards compatible and can compile older versions or project formats there should be little reason to keep older SDKs around.

That sounds good on paper, but whatever is happening in this current release is not working as expected. Hopefully, this will get addressed quickly as this is an annoying quirk that's biting a lot of people.

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
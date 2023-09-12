---
title: Dotnet Tool Component not found on the Mac
featuredImageUrl: https://weblog.west-wind.com/images/2023/Dotnet-Tool-Component-not-found-on-the-Mac/Banner.png
abstract: "I've run into this problem a few times: I install a new Mac OS and then install the .NET SDK. A bit later I install a dotnet tool using `dotnet tool install -g` and then try to run it, only to find out that the SDK is not able find it. This post is a note to self on how to fix the pathing for .NET tools to be found correctly and to be able to run your dotnet tools."
keywords: Dotnet Tool, Mac OS
categories: .NET
weblogName: West Wind Web Log
postId: 3999259
permalink: https://weblog.west-wind.com/posts/2023/Sep/11/Dotnet-Tool-Component-not-found-on-the-Mac
postDate: 2023-09-11T16:05:47.9318402-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Dotnet Tools not found on the Mac
![banner](Banner.png)

This is a very short note to self in regards to running installing and then running a global dotnet tool on a Mac, which apparently after a default install of the .NET SDK, doesn't work *out of the box*.

So I installed the .NET SDK using the Mac installer from the d[otnet download page](https://dotnet.microsoft.com/en-us/download) which is easy enough as it now is a one click install.

After installing the .NET SDK, I went ahead and installed one of my tools on a Mac using the `dotnet tool install -g` command from the default (ZSH) Mac Terminal:

```bash
dotnet tool install -g LiveReloadServer
```

Once installed I can list it:

```bash
dotnet tool list -g
```

and that shows my tool as installed. Great! 

Tools install to `~/.dotnet/tools` and the .NET SDK is supposed to make that folder available so that any commands can be executed.

Unfortunately when I try to now execute the tool with this default configuration, it doesn't work:

```bash
LiveReloadServer

#or no luck with (why?)
dotnet tool run -g LiveReloadServer
```

Here's what I get:

![Dotnet tool command not finding my Tool](ToolNotFoundWhenExecuting.png)

Hrmph!

## The Problem: Paths!
As you might expect the problem here is path resolution. Well at least for the direct access command - the `dotnet tool run` command may have other reasons for failing.

### Restart the Terminal after Installing SDK
If you installed the SDK before the terminal was opened the first thing that needs to happen is to restar the terminal so that it can find both the .NET SDK and `dotnet tool` command as well as the tools folder.

The initial terminal restart after SDK installs is meant to ensure that:

* The base `dotnet` commands can be accessed
* You can run `dotnet tool` commands and use tool commands directly  
  *(well, not really but it's supo'sta :smile:)*

### Fix the Global Folder Path
Unfortunately, if you're using the default ZSH shell on the Mac, the generated path value is not valid and doesn't work. 

The path is generated `/private/etc/paths.d/dotnet-cli-tools` and it looks like this by default:

```bash
# /private/etc/paths.d/dotnet-cli-tools
$HOME/.dotnet/tools
```

As mentioned - this doesn't work on ZSH (AFAIK anyway), so you have to expand out the path. `~/.dotnet/tools` also doesn't work.

> Note that if you use the Bash shell, the profile settings work just fine. It's only in ZSH that the path expansion is not occurring.

The only way I could get it to work is with hardcoding my user path, which is fine since it's a local profile anyway:

```bash
# /private/etc/paths.d/dotnet-cli-tools
/Users/RickStrahl/.dotnet/tools

# These don't work on ZSH
#$HOME/.dotnet/tools
#~/.dotnet/tools
```

> Note that the folder is protected so you have to edit with `SUDO` or if you're using VS Code as I do, you'll be prompted to save using `SUDO` for the save operation.

Remember to restart the terminal to force a reload the path settings.

With that in place my Dotnet Tool is now working:

![LiveReloadServer Dotnet Tool working in shell](SuccessFullToolLaunch.png)

Yay!

## Summary
Not news this has been a known issue for a long time, but you have to wonder why the .NET SDK install doesn't generate a working path entry on a Mac. This seems like such a common problem. As a casual Mac user this has tripped me up several times over the years and I always struggle to find the right files to update. This post will hopefully remind me to do the right thing a bit quicker...

## Resources

* [LiveReloadServer self-contained Web Server](https://github.com/RickStrahl/LiveReloadServer)
* [dotnet tool install Command](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-tool-install)



<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
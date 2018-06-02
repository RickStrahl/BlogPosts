---
title: Which .NET Core Runtimes Download do you need?
weblogName: West Wind Web Log
postDate: 2018-06-01T18:56:10.2339465-07:00
---
# Which .NET Core Runtimes do you need?
.NET Core has a number of different runtime downloads that you can grab to install the runtimes and the SDK. It's not immediately obvious what you need, so since I just went through this myself and had a discussion with a few folks at Microsoft (thanks [@DamianEdwards](https://twitter.com/DamianEdwards?lang=en) and [@RowanMiller](https://twitter.com/RowanMiller10)) I thought I'd summarize (if for nothing else than my own reference).

### Checking what's installed
The first thing you should probably know is what versions of the runtime and SDKs you have installed. The easiest way to do this is to run the following:

```
dotnet --info
```

If that doesn't work and you get an error, it means that .NET Core is not installed at all. `dotnet.exe` installs as part of a runtime install and puts itself on the path so you you should be able to do `dotnet -info`.

> `dotnet.exe` installs with a runtime installs, but it only provides **core features** to provide info and **run** (ie. `dotnet mydll.dll` and `dotnet --info`). You can't build, publish or do anything else - for that you need to install the SDK.

If it does work `dotnet --info` produces the following output (here with the SDK installed):

![](DotnetInfo.png)

The output tells you:

* The installed SDK version
* The active runtime version that's running this `dotnet` command
* A list of all installed runtimes and SDKs

It's important to understand that you can have **multiple runtimes and multiple SDKs) installed** and each project can use a different one. The runtime is determined by your project's runtime specifier in the .csproj file:

```xml
<TargetFramework>netcoreapp2.1</TargetFramework>
```  

The SDK is either the last globally installed SDK which is the default, or you can explicitly override the SDK in a `global.json` placed in the **solution root folder**. The following explicitly forces my project to use the last RC SDK, instead of the RTM version:

```json
{
  "sdk": {
    "version": "2.1.300-rc.31211"
  }
}
```

Generally, it's fine to use the latest SDK even with applications compiled to older runtimes as the SDK tools mainly just drive the compilers for the specific runtimes defined in the projects being compiled.

### Downloadable Runtimes available

* .NET Core SDK
* .NET Core Runtime
* .NET Core Hosting Bundle
* Visual Studio

### Visual Studio
If you're on a Windows you're very likely to be using Visual Studio and if you have the latest version of Visual Studio installed you are likely to have the latest SDK, runtime as well as the required IIS hosting components installed.

Typically you only need to update the components below if you are explicitly installing something newer than the officially installed versions for the sub-version of Visual Studio that you are using.

### .NET Core SDK
The SDK contains is meant for non-Visual Studio build and management tasks. That's for command line use or if you're not on Windows specifically.

Effectively it installs the `dotnet.exe` build tools along with support components. The SDK also installs a fixed version of the .NET Runtime with it which is required to run the tooling. In other words if you download the latest SDK you typically also get the latest runtimes and you don't have to install the matched runtimes separately.

The versions are .NET Core SDK 2.1.300 and .NET Runtime 2.1.0 as shown in the figure above.

Here's what you see after a clean install of the .NET SDK:

![](CleanSdkInstall.png)

#### What it contains

* Specific version of the .NET Core Runtime (ie. 2.1.0)
* ASP.NET Runtime Packages (Microsoft.AspNetCode.App/All)
* Specific version of the .NET Core SDK Tools (ie. 2.1.300)
* The IIS Hosting Components on Windows
* Platform specific install (ie. x64)

#### When to install

* On development machines (all you need typically)
* On a server or container where you need to run `dotnet` commands

For me, almost always this what I need on a full server installation. If I install a .NET application in a VM this what I tend to install.

### .NET Core Runtimes
The .NET Core Runtimes are the smallest self-contained and specific component and contain the absolute minimum to **run** a dotnet core application on a specific platform. Note it **does not** include the ASP.NET Core meta package runtime dependencies, so as is this won't run an ASP.NET Core application.

The Windows x64 .NET Core runtime is ~24megs. These are used for deployed applications that have been previously built for a specific distribution target and basically can just be dropped into a folder and are ready to run.

The runtime alone has no support for `dotnet.exe` so you can't build or publish - whatever you use the runtime for has to be a completely pre-compiled and be able to run **as is**.

Here's what you see after a clean install:

![](RuntimeInstall.png)

Note that with just the Runtimes, running an ASP.NET Core application fails...

#### What it contains
* Specific Runtime for the given platform (ie 2.1.0 for x64)
* Note: It **does not** include the ASP.NET Runtimes!

#### When to use
* For production installs **that are pre-compiled**
* In containers when **not** building inside of containers
* When building your application with explicit dependencies (no dependency on ASP.NET Meta package)

### .NET Core Windows Hosting Pack
This is perhaps the most confusing of the packages available because the naming doesn't really describe what it provides.

You can think of this package as EVERYTHING except the `dotnet` SDK tools. This package installs both 32 and 64 bit runtimes as well the IIS hosting components on Windows.

This package does not include the SDK tooling so if you need the `dotnet.exe` command line tooling you still need to install that separately, which makes this kind of an odd install option. If you need the SDK tools you're better of just installing the SDK **instead of this package**.

#### What it includes
* 32 bit and 64 .NET Core Runtimes
* ASP.NET Runtime Packages (Microsoft.AspNetCode.App/All)
* IIS Hosting Components

#### When to use

* When deploying on Windows Servers and using IIS
* Includes both 64 and 32 bit runtimes
* Includes the IIS Hosting dependencies
* When you don't need the `dotnet` SDK tool
* If you need SDK tools install the SDK instead

### Download Sizes
To give a quick perspective of what each of these three different SDKs look like (on Windows) in terms of size, here's a screen shot of all three packages:

![](DownloadSizes.png)

Given all of this it seems to me that in most scenarios the thing you want to install is the .NET SDK as it literally includes everything you need. Yes it's bigger but it provides 

The Windows hosting pack is perhaps the most perplexing of the downloads. I 

### Summary
To me this seems all a lot more confusing than it should be. It makes no sense that the runtime install doesn't include the Asp.net libraries, but the SDK does. If you're going to be very modular about this then there should be individual downloads for each of these components for each platform with a meta package that combines it all for the happy path.

That meta package appears to be the Windows Hosting Bundle, which addresses that need more or less but then it it is overly big because it includes both 32 and 64 bit runtimes which seems odd given everything else is platform specific. At this point I doubt many people install the 32 bit version of .NET Core runtimes so why make this part of the happy path?

Ideally I'd like to see better labeled installers that are in themselves clear about what they install. If we're going to be modular I'd expect to install:

1. Dotnet Runtime
2. AspNet Runtimes
3. SDK Support

For me the path of least resistance on a full machine or VM is to install the .NET Core SDK. It includes everything needed for a specific platform. And if I'm doing a standalone install on a machine I control I sure as heck will need the dotnet SDK tooling so 

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
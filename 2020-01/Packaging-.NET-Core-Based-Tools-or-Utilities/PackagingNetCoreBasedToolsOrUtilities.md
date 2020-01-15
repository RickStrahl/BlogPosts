---
title: Packaging .NET Core Based Tools or Utilities
weblogName: West Wind Web Log
postDate: 2020-01-14T13:37:47.9275910-10:00
---
# Packaging .NET Core Based Tools or Utilities
I'm working on updating an ancient legacy tool to use a self-contained Web Server with .NET Core. The tool I have is an ancient application server front end that interfaces FoxPro code to the Web - yes, it's old but there are still a fairly largish set of developers that use this tool that rely on it for their own legacy applications.

## We have History
This tool - West Wind Web Conection -  has a loooong history going back all the way to 1995, and it's been updated through the years through the various generation of Microsoft Windows based Web server technology and started before there even was an IIS.

How Old? Here's the Web technology progression:

* CGI Executable (very short lived due to serious perf issues)
* WinCgi (a Turbo Pascal inprocess based custom implementation using INI message files)
* ISAPI Handler (file messaging and COM)
* .NET Managed Handler (COM and File Messaging)
* .NET Core Standalone Server (COM and File Messaging)

The first three actually pre-dated any Microsoft application service solutions - they started long before there was classic ASP and even the crazy template based, server-side includes based implementation that came before it (anybody remember what that was called? Leave a comment if you know). In the very early days, Microsoft even used one of my very early application implementations at Surplus Direct/EggHead as an example for one of their early TechEd Web presentations (never once mentioning the word FoxPro, of course :stuck_out_tongue:)

You get the idea - this stuff is old and has been around for a long time.

While I could have given up on this tool long ago, as some time ago it stopped being an income producing project, keeping this tool running with the latest tech has been a nice side project that's allowed me a real world playground to apply new technology in a practical way. So here I am today :-)

For years this solution has worked solidly using primarily the .NET Managed handler which uses COM Interop (or a file based messaging mechanism in dev mode)  to communicate with FoxPro instances. This works fine, but the developer experience and getting setup has always been a bit rough because of the IIS/IIS Express dependencies. The developers involved tend to be non-.NET people and often new to Web development altogether so installing and configuring IIS (even with a script template) has often been a challenge.

## Moving Forward
When .NET Core was released one of the big selling points to me was the idea that you can much more easily can create a standalone server application - one that doesn't have any dependencies on any kind of system installed Web Server. Start an EXE and boom your server is running. No configuration, no system interactions that can cause havoc. Choose a port and your ready to go. IIS Express offers some of that but still has to deal with some of the IIS config issues.

A .NET Core solution certainly has the potential to be more approachable.

### Converting .NET HttpHandler to .NET Core
For my Web Connection application server, I basically took the ASP.NET Classic .NET HttpHandler and converted it to run under .NET Core. For the most part I was able to preserve all of the code of the original handler. All the interop semantics of communicating between the Web portion and pumping messages to the FoxPro server stayed the same as did all the administration and server pool management tasks. Most of that code moved without changes which is pretty cool. I'd say 90% of the code moved over without changes.

#### .NET Core has no Collections for Server Variables
The remaining 10% required some work to deal with the changes in the ASP.NET Core Intrinsic object functionality. The way HttpContext, Request, Response work has changed quite drastically. The biggest and most time consuming part involved picking up all the request information to send to the FoxPro server. In ASP.NET Classic I could just iterate over the `ServerVariables` collection to pick up most values easily. In .NET Core I'm back to picking through the Request and Context object properties and trying to match all the important variables that need to be forwarded to the application server. This was also the case in the older ISAPI handler except in Core everything is tied to properties of various objects. 

#### Async Response Handling
Likewise Response handling has changed quite a bit in .NET Core. All Response output should be written asynchronously via `Response.WriteAsync()`. While the application isn't writing output in many places the fact that Asnyc is required, causes the cascade to force all calling code to be async as well. All the code up to the new Web Connection middleware had to be made Async in order for this to work properly and that took a bit of refactoring.

#### Response Headers Cannot be Set Once Response has been Written To
ASP.NET Core has a strict requirement that the Response headers cannot not be changed after the Response has started processing output. This can be **before** you actually send data to the Response in some situations (like setting a filter or stream assignment). Basically .NET Core initializes the Response at some point and once that has happened making changes to header affecting values causes an exception.

There were several instances where I adjusted headers after the initial output has been written and this required further refactoring to push those changes further upstream in more complicated logic.

Overall though - the changes were minor and I was able to make them in a few hours in one evening to get the initial prototype to run with some additional fine tuning especially for the startup code options following with testing.



### A Development Server
I started out primarily looking at the .NET Implementation as development server to make it easier for developers to get started. Having a single executable to run and having everything hooked up without much of any configuration is pretty sweet. 
The way this server works it has a few configuration settings that let you specify a **WebRoot** path, port, which extensions to handle and it includes some nice development touches including a built-in Live Reload component that by default is enabled for development mode.

For development the deployment options are fairly straight forward:

* Dotnet Tool - my preferred choice
* Self-Contained EXE (single exe but very large (50mb for this))
* Published Application (loose files with framework dependency)

#### Dotnet Tool
I love the `dotnet tool` functionality in the .NET Core SDK because it's a great way to distribute an application, share it on NuGet and make it available with a simple `dotnet tool install` command on any other machine.

To create a .NET Tool you can simply add severak directives to your project:

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <Title>WebConnectionWebServer</Title>
    <TargetFramework>netcoreapp3.1</TargetFramework>
    <Version>7.9.11</Version>
    ...
    <IsPackable>true</IsPackable>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
    <PackAsTool>true</PackAsTool>
    <ToolCommandName>WebConnectionWebServer</ToolCommandName>
    <PackageOutputPath>./bin/nupkg</PackageOutputPath>    
    <PackageTags>WebConnection WestWind Static WebServer DotnetTool</PackageTags>

    <PackageIconUrl>https://webconnection.west-wind.com/images/WebConnection256.png</PackageIconUrl>
  </PropertyGroup>
  ... 
</Project>  
```

Once you build you get a NuGet package that can then be published to NuGet like any other package.

Once published you can then install it with:


```ps
dotnet tool install -g WebConnectionWebServer
```

And voila the server application is available. 


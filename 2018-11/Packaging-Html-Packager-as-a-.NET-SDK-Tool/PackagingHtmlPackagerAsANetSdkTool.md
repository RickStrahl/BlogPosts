---
title: Creating a .NET Global Tool from an existing Console Application
abstract: .NET Core doesn't support creating executables directly, but it does have support for **Global Tools** which provide a mechanism to register a console application and make it easily accessible using a simple command line command rather than a complex `dotnet.exe` command.
keywords: Global Tools,.NET Core,Console,Executable
categories: .NET Core
weblogName: West Wind Web Log
postId: 1005721
postDate: 2018-11-05T14:38:23.4002666-10:00
---
# Creating a .NET Global Tool from an existing Console Application

![](Global.jpg)

<small style="color:firebrick">*updated Jan. 14th, 2019*</small>

In [my last post](https://weblog.west-wind.com/posts/2018/Nov/01/Creating-an-HTML-Packager) I discussed a small utility library I originally created for integration into [Markdown Monster](https://markdownmonster.west-wind.com). It packages a Web HTML Url into a self contained HTML document or package that can be rendered on its own offline without an Internet connection.

As is often the case with utility tools like this, it started out as a small class in the Markdown Monster project, then migrated into its own library, then added a Windows Console application so that it could also run from the command line. The end result was both a [NuGet package](https://www.nuget.org/packages/Westwind.HtmlPackager) for .NET Standard library and a [Chocolatey package](https://chocolatey.org/packages/HtmlPackager) for the Windows Console exe.

All of this extra stuff beyond what I needed in Markdown Monster just kind of happened because I actually ended up having a few other useful scenarios where this tool fit.

##AD##

## Just one more thing...
And that gets me to the topic of this post. It would also be nice to have a **cross-platform console application** for this functionality. I didn't set out to build a cross platform tool, but I realized since this is a .NET Standard library and it doesn't use anything Windows specific, it should actually work on other platforms. And as it turns out, **it does work** just fine on the Mac and on Linux.

The process to convert my Windows Console app to a .NET Core app required no code changes, only setting up yet another project and refactoring some names and namespaces. 

It's easy to create .NET SDK console applications which is one of the standard .NET SDK stock projects. In fact it's **the** stock project since pretty much anything using .NET Core is a Console application even if it later launches something else (like [Electron.NET](https://github.com/ElectronNET/Electron.NET) for example which launches a UI form).

## .NET Core Console Apps - Easy to create, Terrible to run
.NET Core Console applications are easy to create: Just create a new .NET Core Console project and start firing away in you `Main()` method the same way we've always built Console applications. The bonus is that it can and unusually does work cross-platform. In my case the HTML Packager just worked on my Mac - even though I didn't even consider running it on another platform originally. As long as I pass in valid OS specific paths it all just works.

However, **running a .NET Core raw console application application sucks**! .NET Core Console apps are not a self-contained executable, but rather have to be launched through the `dotnet.exe` command line tooling. 

Nobody wants to type:

```text
dotnet <longPathToMyDll>/HtmlPackager.dll -c Release
```

to run a utility from the command line.

.NET Core currently doesn't support creating standalone executables. Which is somewhat understandable given that it's cross platform and each platform has its own way to running an *executable*. But there is a solution which **does** create a proxy executable that then runs your Console application.

## .NET SDK Global Tools
To make .NET Core apps more command line friendly, .NET SDK took a page out of NodeJs' playbook, by providing support for something called **Global Tools**. Global tools are a mechanism for **registering** (my term) .NET Core applications to make it execute with a simple command name, much like you would with an executable that's registered in the OS path. That is in fact what a global tool does: It creates a pseudo executable that internally calls `dotnet.exe` with your application assembly name, in a known location ('~/.dotnet/tools').

The result is the behavior we want: The ability to just globally use a single easy to remember and type command that invokes your Console application. To access my HTML packager once installed as a global tool  I can just type:

```dos
htmlpackager
```

and I'm off to the races. Parameters are passed through and it all works as you would expect an executable to behave.

In short Global Tools are an OS hack to allow your .NET Core applications to run **as if they were standalone executables**.

Behind it all, global tools are nothing more than standard **.NET Core Console applications** and you specify that they are a *Global Tool* by using a few **special attributes** in the `.csproj` file. 

Publishing of a global tool is done via NuGet using the standard NuGet publishing URLs which adds it to the published to registry as a global tool. Global tools are using the same package store as .NET libraries, but global tools are a different type of library which is displayed and handled differently than a standard NuGet package.

> #### @icon-info-circle Publishing both a Library and Global Tool require separate Projects
> If you need to publish a library that is **both a code library as well as a global tool**, you'll have to split up the two into **two separate projects**. Tools and libraries are displayed and handled differently on NuGet and by the NuGet client, so each requires its own publish id.

##AD##

### Installing a Global Tool
So in order to use global tools you have to install them using the `dotnet tool install`. 

So for example to install my HtmlPackager which is available from the standard NuGet package store, you can do:

```dos
dotnet tool install -g dotnet-htmlpackager
```

Notice the package name to install is `dotnet-htmlpackager` but the command to run is `htmlpackager`. It's important you use the `-g` or `--global` switch to ensure the tool gets installed into the global package store and which makes it available globally on the OS path.

Tools come from a NuGet repository which can either be the default online NuGet store, or you can use the `--add-source` argument to specify another package source. During development it can be useful to use `--add-source=./nupkg` to locally publish, and then install a package from.

### Running a global Tool
Once installed I can now run my packager from the command line using it's **ToolCommandName**:

```dos
htmlpackager https://markdownmonster.west-wind.com -o c:\temp\mm_home.html -x -v -d
```

Note that the name is case sensitive on non-Windows systems that are case sensitive.

Here's the output on Windows:

![](https://weblog.west-wind.com/images/2018/Packaging-Html-Packager-as-a-.NET-SDK-Tool/WindowsCapture.png)

This now also works on my Mac:

```dos
htmlpackager https://markdownmonster.west-wind.com -o ~/temp/mm_home.html -x -v -d
```

With this output:

![](https://weblog.west-wind.com/images/2018/Packaging-Html-Packager-as-a-.NET-SDK-Tool/MacCapture.jpg)


## Creating a Global Tool
In order to create a global tool you'll need a separate project specifically for the .NET Core Console Application.

Steps are:

* Create a new .NET Core Console Application
* Add Global Tool Specific NuGet tags to the `.csproj`
* Build your Console application and test it
* Publish your global tool to NuGet
* Install with `dotnet tool install -g <package-name>`
* Run with `<yourToolName>` from the command line

### Breaking out my existing Project
In my case I had already built a Windows Console application that compiles into a Windows Console EXE. The .NET Core version is **identical** but I had to create a new .NET Core Console project for it as an SDK project. So in my solution I now have 3 main projects:

![](https://weblog.west-wind.com/images/2018/Packaging-Html-Packager-as-a-.NET-SDK-Tool/ProjectStructure.png)

* Westwind.HtmlPackager - main library
* HtmlPackagerConsole - Windows Console
* dotnet-htmlpackager - .NET Core Console Global Tool

### Creating a new .NET Core Console Project
The process of creating the global tool is ridiculously simple. Create a new .NET Core Console project and pretty much copy over the code from the Windows Console project and make sure it runs. It did - without any changes. Not only on Windows but the same code also runs on the Mac - again without changes and without actually giving any thought to cross-plat initially. 

Yeah, I still get excited about running x-plat code with .NET - the novelty has not worn off for me yet even if it's such a simple thing.

### Refactoring - Naming is hard!
What wasn't so simple for me was refactoring my existing projects and finding proper names. Seriously I spent more time renaming things than making any code changes for adding the Global Tool :smile:

I ended up refactoring all the code out of the Windows Console application into the `Westwind.HtmlPackager` so that I could easily reuse the console specific code in both Console projects.

Both Console projects only have a single, small `Program.cs` file which boots up HtmlPackager from the command line options - all the actual Url processing is handled in the library that is shared by both Console projects.

Then - the worst part. Naming. What do I call this thing? HtmlPackager? Uh the Console app already was named that. `Westwind.HtmlPackager.Console` ugh. In the end I ended up being explicit in my projects and using the old convention of naming the Tool project `dotnet-htmlpackager` where the `dotnet-` signifies the tool prefix that's commonly used.

Note that the NuGet package name and the tool's **Command Name** don't have to be the same. My package is `dotnet-htmlpackager` but the command is `htmlpackager`. 

### Adding Global Tool Specific NuGet Tags
Next 

The Global Tool specific tags for a project are shown below. In my case the tool is named `dotnet-htmlpackager` in `dotnet-htmlpackager.csproj`.

```xml
...
<PackAsTool>true</PackAsTool>
<ToolCommandName>htmlpackager</ToolCommandName>
<PackageOutputPath>./nupkg</PackageOutputPath>

<!-- standard but related -->
<GeneratePackageOnBuild>true</GeneratePackageOnBuild>
<PackageRequireLicenseAcceptance>false</PackageRequireLicenseAcceptance>   
```    
    
The `ToolCommandName` is what users can type on the Command Line to access your tool once it is registered. The `PackAsTool` is what denotes that this is a .NET tool. 

### Testing your Tool and local Package Install
Before publishing your tool you probably want to test it, running it as a .NET global tool locally before publishing. To do this you can add a local package source where Nuget is looking for the package, which allows you to install from a local folder:

From my console project folder I can do:

```ps
dotnet tool install -g dotnet-htmlpackager --add-source=./nupkg
```

where `./nupkg` is the relative folder where the NuGet package has been generated.

Once installed you can now run your tool with:

```
htmlpackager
```

In order to update your package you can run the `dotnet tool update` command. 
The syntax to update the package from a new version on the local source is:

```ps
dotnet tool update -g dotnet-htmlpackager --add-source=./nupkg
```

What's nice is that this will update even the current version if the version number has not been changed and will even roll back to an older version, if that version is the latest version available which makes it easier to work with the package at development time. Nice!

### Publish to NuGet
Once you've built and tested your .NET Core Console app, you should test your package locally with:

```powershell
HtmlPackager https://markdownmonster.west-wind.com 
             -o c:\temp\mm_home.html 
             -x -v -d
```
Using the local package lets you easily test your Console app as a tool.

Next you need to publish your tool to NuGet.

```powershell
nuget push foo.nupkg <yourPublishId>
```

You can also use `nuget setApiKey <yourPublishId>` to set your API key globally so you don't have to provide it each time you publish.

Alternately you can also use the Package Explorer GUI tool which lets you review your package by double clicking, and then optionally publish using **File -> Publish**:

![](https://weblog.west-wind.com/images/2018/Packaging-Html-Packager-as-a-.NET-SDK-Tool/PackageExplorer.png)


And we're done. At this point you should be able to access your tool via NuGet (after the NuGet Index refreshes and includes your new package).

```
dotnet tool install - dotnet-htmlpackage
```

And after that you should be able to run it:

```
htmlpackager
```

##AD##

## How does this work?
So how does this actually work? How is a global tool available globally on the command line when .NET Core doesn't support producing executables directly?

It turns out that when you install a global tool it creates proxy executable for the specified platform. This executable is essentially a shell that forwards to actually execute `dotnet.exe` with the appropriate parameters to execute your console application.

On Windows my HtmlPackager ends up in `%HOME%/.dotnet/tools:

![](https://weblog.west-wind.com/images/2018/Packaging-Html-Packager-as-a-.NET-SDK-Tool/WindowsToolStore.png)

As you can see the installation of my tool created a self-contained version of my .NET Core console app as an executable.  

Before you get all exited about self contained .NET Core executables, the EXE is merely a wrapper around `dotnet.exe` with some built-in runtime information that tells it where to find the actual runtime files in the `.store` directory. If you move the `.exe` file of that folder and try to execute it you get an error:

![](https://weblog.west-wind.com/images/2018/Packaging-Html-Packager-as-a-.NET-SDK-Tool/ExecuteExeOutSideOfDotnetFolder.png)

The reason it works in the `.dotnet` folder is because the related `.store` folder has the actual runtime files of my application, and because the `.dotnet` folder has been added to the Windows path. In short, the `.exe` is merely a pass-through proxy that makes it accessible globally.

On the Mac and Linux something similar happens using a *Unix executable* as you can see in this screen shot:

![](https://weblog.west-wind.com/images/2018/Packaging-Html-Packager-as-a-.NET-SDK-Tool/MacToolsFolder.png)

In each of those cases you should be able to just execute the command name `htmlpackager` to execute the command.

> On Ubuntu (18.04) the .NET SDK install did not properly add the `~/.dotnet/tools` folder to the user path, and so I had to explicitly add that path to my environment after the .NET SDK/Runtime install.

## Summary
.NET Global tools fills a vital need to make .NET Core applications more easily accessible on all OS platforms using single commands that mimic executables. It's not quite as transparent as using a self-contained executable but it's the next best thing.

Hopefully in the future we'll see better support for creating a uniform package format for .NET applications that make this more transparent. For now this feature is squarely aimed at developers with the assumption the appropriate SDK tooling is installed.

As a developer Global Tools are easy to set up, and provide for a nice and easy distribution mechanism of your applications, both for internal or external distribution.

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
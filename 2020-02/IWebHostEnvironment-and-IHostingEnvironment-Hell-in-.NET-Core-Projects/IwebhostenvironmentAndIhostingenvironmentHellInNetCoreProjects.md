---
title: Working with IWebHostEnvironment and IHostingEnvironment in dual targeted ASP.NET Core Projects
abstract: In ASP.NET Core 3.x Microsoft introduced a new `IWebHostEnvironment` to replace the obsoleted `IHostingEnvironment`. While that works for top level applications this can cause some complications for multi-targeted libraries that need to support both .NET Core 2.x and 3.x. This post describes the problems and offers a few workarounds.
keywords: IWebHostEnvironment, IHostingEnvironment,multi-targeting
categories: ASP.NET Core
weblogName: West Wind Web Log
postId: 1570849
permalink: https://weblog.west-wind.com/posts/2020/Feb/26/Working-with-IWebHostEnvironment-and-IHostingEnvironment-in-dual-targeted-NET-Core-Projects
postDate: 2020-02-26T00:23:36.6550495-10:00
---
# Working with IWebHostEnvironment and IHostingEnvironment in dual targeted ASP.NET Core Projects

![](broken.jpg)

With .NET Core 3.1 Microsoft broke a fairly low level abstraction by effectively renaming `IHostingEnvironment` and replacing it with `IWebHostEnvironment`. `IHostingEnvironment` still exists in .NET Core 3.x and can still be used and it still works, but it's been marked as *deprecated* and *will be removed in a future version*. It is recommended that you use `IWebHostEnvironment` instead.

![](IHostingEnvironmentWarning.png)

The reasoning behind this presumably was that `IHostingEnvironment` has multiple implementations for the same type in .NET Core in different packages.

The **AspNetCore specific version** in `Microsoft.AspNetCore.Hosting` looks like this:

```cs
public interface IHostingEnvironment
{
    string EnvironmentName { get; set; }
    string ApplicationName { get; set; }
    string ContentRootPath { get; set; }
    IFileProvider ContentRootFileProvider { get; set; }
    
    string WebRootPath { get; set; }
    IFileProvider WebRootFileProvider { get; set; }
}
``` 

while the base **Extensions version** in `Microsoft.Extensions.Hosting` doesn't have the WebRoot folder related properties:

```csharp
public interface IHostingEnvironment
{
    string EnvironmentName { get; set; }
    string ApplicationName { get; set; }
    string ContentRootPath { get; set; }
    IFileProvider ContentRootFileProvider { get; set; }
}
```
The idea was to  use the Web version in ASP.NET projects, while using the plain extensions versions for non-Web apps like Console or Desktop apps.

The type duplication isn't very clean, and somewhat understandable that that should this got cleaned up. Unfortunately, in doing so a few problems have been introduced if you need to build libraries that need to work both in .NET Core 2.x and 3.x.

### Out with old in with the new: IWebHostEnvironment
So in .NET Core 3.0 there's a new `IWebHostEnvironment` and `IHostEnvironment` that separate out the two behaviors:

```csharp
public interface IWebHostEnvironment : IHostEnvironment
{
   IFileProvider WebRootFileProvider { get; set; }
   string WebRootPath { get; set; }
}

public interface IHostEnvironment
{
   string ApplicationName { get; set; }
   IFileProvider ContentRootFileProvider { get; set; }
   string ContentRootPath { get; set; }
   string EnvironmentName { get; set; }
}
```

which admittedly is cleaner and more obvious. Since the interfaces are related they can be used interchangeably in many situations and non-Web applications can just stick with `IHostEnvironment` while Web apps can use `IWebHostEnvironment`. Presumably in the future there maybe other environments to run in and they may get their own extensions to `IHostEnvironment`.

All good right?

### Multi-Targeting Required?
It's all good if you're creating an ASP.NET core Web **application**. When you're at the application level, you're not  multi-targeting typically, so a 3.x app can use `IWebHostEnvironment` while a 2.x app can use `IHostingEnvironment`.

In 3.x ASP.NET's default dependency injection provides `IWebHostEnvironment` as well as  `IHostingEnvironment` (for now) in the default DI container and your .NET Core 3.x single targeted project can just use that. 

No problemo.

But now consider a library that might have to work both in .NET Core 2.x and 3.x. I have a not insignificant number of library projects/packages both public and internal and **every single one of them** has to be multi-targeted in order to work reliably in both versions of .NET Core without a number of warnings and type reference errors.

I ran into this originally from an [issue submitted by Phil Haack](https://github.com/RickStrahl/Westwind.AspNetCore.Markdown/issues/13) on my [Westwind.AspnetCore.Markdown package](https://www.nuget.org/packages/Westwind.AspNetCore.Markdown/) where the use of `IHostingEnvironment` in 3.x results in an empty reference through DI (I think this has since been fixed tho) possibly because the wrong type was injected (from extensions rather than the ASP.NET version). But regardless using the 'old' `IHostingEnvironment` results in a slew of warnings in the code due to the deprecation.

Easy to fix you say - reference the new one and we're off right? Except the new interface doesn't exist in 2.x so now you have a situation where you **have to multi-target** in order to use the new interface in the component.

Mind you there's **no new functionality**, no new behavior - nothing really has changed except the abstraction so yes this is pretty grumble worthy because it's essentially a cosmetic change.

Originally my packages were either .NET Standard or .NET Core 2.x targeted projects and they would work fine in 3.x. All the functionality introduced works in both framework and so there really was not specific reason to force these projects to dual target - the single 2.1 target works for both.

But alas, this `IWebHostEnvironment` change forces me to use multi-targeted projects in order to use both `IHostingEnvironment` and `IWebHostEnvironment`. Hrmph.

### Multi-Targeting - maybe not so bad?
Thankfully multi-targeting is not too hard with the new SDK style project. You can just specify multiple `<TargetFrameworks>` and a few target specific overrides to reference the appropriate ASP.NET Core framework.

That solves the type availability, but it doesn't solve access to the proper hosting environment type in each version.

### Hacking Around This
I haven't really found a good way to do this without using a mulit-targeted project. I can if I continue using `IHostingEnvironment` but then I'm stuck with a slew of warnings in the project, and the threat of the interface disappearing in future versions. So regardless it's probably necessary to multi-target so that the new interface can be used.

Given that here's a hacky way I've used to make this work:

* Multi-target the project
* Add a `NETCORE2` compiler variable
* Bracket code that wraps `IWebHostEnvironemnt` in a `#if NETCORE2` 

To multi-target the project is pretty easy with SDK projects thankfully:

```xml
<PropertyGroup>
    <TargetFrameworks>netcoreapp3.1;netcoreapp2.1;</TargetFrameworks>
</PropertyGroup>    
```

You also have to fix up a few depedencies potentially with target framework specific version directives. For example:

```xml
<ItemGroup Condition="'$(TargetFramework)' == 'netcoreapp3.1'">
  <FrameworkReference Include="Microsoft.AspNetCore.App" />
</ItemGroup>
<ItemGroup Condition="'$(TargetFramework)' == 'netcoreapp2.1'">
  <PackageReference Include="Microsoft.AspNetCore.App" />
</ItemGroup>
```

You can add other framework specific package dependencies into those blocks if there's a difference for 2.x and 3.x which might actually be a good argument for explicitly multi-targeting.

Then I add a `NETCORE2` compiler flag, which I set when the code is compiled .NET Core 2.x:

```xml
<PropertyGroup Condition="'$(TargetFramework)' == 'netcoreapp2.1'">
    <DefineConstants>NETCORE2</DefineConstants>
</PropertyGroup>
```

So now I can selectively determine which version I'm running and based on that use the appropriate host environment. Yeah that's freaking ugly, but it works to consolidate the two types:

```cs
#if !NETCORE2
    protected IWebHostEnvironment Host { get; }
    
    public JavaScriptLocalizationResourcesController(
        IWebHostEnvironment host,
        DbResourceConfiguration config,
        IStringLocalizer<JavaScriptLocalizationResourcesController> localizer)
#else
    protected IHostingEnvironment Host { get; }
    
    public JavaScriptLocalizationResourcesController(
        IHostingEnvironment host,
        DbResourceConfiguration config,
        IStringLocalizer<JavaScriptLocalizationResourcesController> localizer)
#endif
{
    Config = config;
    Host = host; 
    Localizer = localizer;
}
```

The above is a controller, but the same type of logic can be applied inside of middleware (which also receives DI injection) or even manual `provider.GetService<T>` requests.

If you have one or two places where you use `IWebHostEnvironment`, this is a quick and dirty way to do it. However if your library needs access to the hosting environment in a lot of places this kind of code gets really ugly fast.

### Take 1 - HostEnvironmentAbstraction
My first cut to address this was to build - yup - another abstraction. Wrap the native host environment into a container and basically isolate the multi-target logic that I showed above in a single place. That makes for one ugly class, but once that's done I can use the host container anywhere I would normally use the host.

Here's the abstration that provides both a DI injectable and static `Host` property:

```csharp
/// <summary>
/// A Hosting Environment Abstraction for ASP.NET Core that
/// can be used to provide a single .Host instance that works
/// for both .NET Core 3.x and 2.x
///
/// Requires dual targeting for 2.x and 3.x
/// </summary>
/// <example>
/// var hostAbstraction = new HostingAbstraction( app.ApplicationServices);
/// app.AddSingleton<HostingAbstraction>(hostAbstraction);
///
/// then either:
/// 
///  * Use HostEnvironmentAbstraction.CurrentHost
///  * Or inject `HostEnvironmentAbstraction` with DI
/// </example>
public class HostEnvironmentAbstraction
{
    private IHostingEnvironment env;

    public HostEnvironmentAbstraction(IServiceProvider provider)
    {
        if (CurrentHost == null)
            InitializeHost(provider);
    }
    
#if NETCORE2
    /// <summary>
    /// Active Web Hosting Environment instance appropriate for the
    /// .NET version you're running.
    /// </summary>
    public static IHostingEnvironment CurrentHost { get; set; }


    /// <summary>
    /// Active Web Hosting Environment instance appropriate for the
    /// .NET version you're running.
    /// </summary>
    public IHostingEnvironment Host
    {
        get { return CurrentHost; }
    }
#else
    /// <summary>
    /// Active Web Hosting Environment instance appropriate for the
    /// .NET version you're running.
    /// </summary>
    public static IWebHostEnvironment CurrentHost {get; set;}


    /// <summary>
    /// Active Web Hosting Environment instance appropriate for the
    /// .NET version you're running.
    /// </summary>
    public IWebHostEnvironment Host
    {
        get { return CurrentHost; }
    }
#endif

    /// <summary>
    /// Initializes the host by retrieving either IWebHostEnvironment or IHostingEnvironment
    /// from DI 
    /// </summary>
    /// <param name="serviceProvider"></param>
    public static void InitializeHost(IServiceProvider serviceProvider)
    {

#if NETCORE2
        CurrentHost = serviceProvider.GetService<IHostingEnvironment>();
#else
        CurrentHost = serviceProvider.GetService<IWebHostEnvironment>();
#endif
    }

}
```

To use this requires a little setup - you basically have to initialize the hosting environment somewhere once during startup. This can be in `startup.cs` or if you're creating middleware in the middleware hookup code. 

In `Startup.cs` and `ConfigureServices()` you'd use:

```csharp
var provider = services.BuildServiceProvider();
var host = new HostEnvironmentAbstraction(provider);
services.AddSingleton<HostEnvironmentAbstraction>(host);
```

You can then inject the `HostEnvironmentAbstraction` and use the `.Host` property:

```cs
private IHostingEnvironment Host {get;} 

public JavaScriptLocalizationResourcesController(
    HostEnvironmentAbstraction hostAbstraction,
    DbResourceConfiguration config,
    IStringLocalizer<JavaScriptLocalizationResourcesController> localizer)
{
     Host = hostAbstraction.Host;
}
```

Alternately you can skip DI and just use the Singleton directly:

```cs
var host = HostEnvironmentAbstraction.Host;
```

Both give you the right hosting environment for your .NET Core version.

This works and certainly is cleaner the ugly conditional code inside of your application. It basically isolates that ugly code into a single ugly library class.

The downside with this is that it **requires** that you use a different object to get the host than you naturally would if you were running on either platform. Yet another abstraction...  and going forward that code will not be standard. But again it's unlikely this is heavily used so probably just fine.

### Take 2 - Use IWebHostEnvironment in 2.x too
Another approach is perhaps more user friendly in that it allows for working with `IWebHostEnvironment` both .NET Core 2.x as well 3.x. 

The idea with this is basically that on .NET Core 2.x we can duplicate the .NET Core 3.x `IWebHostEnvironment` interface and pass an existing `IHostingEnvironment` to populate the values.

This is a more verbose implementation, but the usage is cleaner once implemented as you can basically write 2.x the same way you would 3.x by using `IWebHostEnvironment` code.

Here's the implementation of the `LegacyHostEnvironment` class that implements the faked `IWebHostEnvironment` and `IHostEnvironment` interfaces that don't exist in 2.x:

```cs
#if NETCORE2
using Microsoft.Extensions.FileProviders;

namespace Microsoft.AspNetCore.Hosting
{
    public class LegacyHostEnvironment : IWebHostEnvironment
    {
        public LegacyHostEnvironment(IHostingEnvironment environment)
        {
            ApplicationName = environment.ApplicationName;
            ContentRootFileProvider = environment.ContentRootFileProvider;
            ContentRootPath = environment.ContentRootPath;
            EnvironmentName = environment.EnvironmentName;
            WebRootFileProvider = environment.WebRootFileProvider;
            WebRootPath = environment.WebRootPath;
        }

        public string ApplicationName { get; set; }
        public IFileProvider ContentRootFileProvider { get; set; }
        public string ContentRootPath { get; set; }
        public string EnvironmentName { get; set; }
        public IFileProvider WebRootFileProvider { get; set; }
        public string WebRootPath { get; set; }
    }
    
    public interface IWebHostEnvironment : IHostEnvironment
    {
        IFileProvider WebRootFileProvider { get; set; }
        string WebRootPath { get; set; }
    }

    public interface IHostEnvironment
    {
        string ApplicationName { get; set; }
        IFileProvider ContentRootFileProvider { get; set; }
        string ContentRootPath { get; set; }
        string EnvironmentName { get; set; }
    }
}
#endif
```

To use this now you want to create an instance of this environment and add it to DI, but it's only necessary on 2.x. You basically need to get an instance of the `IHostingEnvironment` during startup and then create the new type.

The following code is what you can use in middleware initialization code in your `AddMyMiddleware()` implementation:

```csharp
// Initialize the fake IWebHostingEnvironment  for .NET Core 2.x

#if NETCORE2
    // we need an IServiceProvider to get IHostingEnvironment on 2.x
    // get it from DI or: provider = services.BuildServiceProvider();      
    var ihHost = provider.GetService<IHostingEnvironment>();
    
    var host = new LegacyHostEnvironment(ihHost);
    services.AddSingleton<IWebHostEnvironment>(host);   
#endif
```

Once that's done though you can now use `IWebHostEnvironment` in .NET Core 2.x and that controller implementation just becomes:

```cs
private IWebHostEnvironment Host {get;} 

public JavaScriptLocalizationResourcesController(
    IWebHostEnvironment host,
    DbResourceConfiguration config,
    IStringLocalizer<JavaScriptLocalizationResourcesController> localizer)
{
     Host = host;
}
```

even in .NET Core 2.x code.

### Summary
Phew - yeah all of this is ugly, and regardless of what you do, if you need to support both .NET Core 2.x and 3.x and you need `IWebHostEnvironment` you need to multi-target. I haven't found a way around that even with this re-implementation of the last example. The `NETCORE2` block is what makes that work and that requires multi-targeting. 

Maybe there's a better way but I can't think of one for libraries that need to support both .NET Core 2.x and 3.x and require access to `IWebHostEnvironment` or `IHostingEnvironment`. 

This seems like a lot of effort but I was tired of having to remember how to do this on several of my library projects and even more tired of  the bracketed `#if NETCORE2` code. I guess eventually this will go away as 2.x usage fades away but at the moment support for 2.x for libraries still seems important as there's more 2.x code out there than 3.x at this point.

### Resources

* [IHostingEnvironment vs IHostEnvironment - obsolete types in .NET Core 3.0 ](https://andrewlock.net/ihostingenvironment-vs-ihost-environment-obsolete-types-in-net-core-3/) (Andrew Lock)
* [Westwind.AspNetCore NuGet that contains these two classes](https://github.com/RickStrahl/Westwind.AspNetCore/blob/master/Westwind.AspNetCore)
* [HostEnvironmentAbstraction on Github](https://github.com/RickStrahl/Westwind.AspNetCore/blob/master/Westwind.AspNetCore/Hosting/HostEnvironmentAbstraction.cs)

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
---
title: COM Object Access and dynamic in .NET Core 2.x
abstract: I was surprised to find out that COM Interop works in .NET Core when running on Windows. It's possible to access COM components via Reflection easily enough in .NET Core 2.x. Unfortunately use of the `dynamic` keyword does not work in .NET Core 2.x so for the moment COM interop is limited to using Reflection.
categories: .NET Core,.NET,COM
keywords: COM Interop,DotNet Core,Reflection,Dynamic
weblogName: West Wind Web Log
postId: 1120705
postDate: 2019-01-22T23:06:48.1102415-10:00
---
# Dynamic COM Object Access in .NET Core

I've been playing around with some old legacy code that uses an ASP.NET front end to some really old FoxPro COM servers. It's part of an old framework that works well on full .NET. 

Recently I've been toying with the idea moving this to .NET Core to make the local development experience a lot smoother. With easy Kestrel self-hosting the need to use IIS or local IIS Express goes away and even for this old monolith that would be a huge win.

The old framework is implemented in .NET HttpModule/Handler and moving this to .NET Core wouldn't be a big effort which is even more of an incentive. The upside would be that it still works in IIS especially now in .NET Core 2.2 with the new and improved InProcess .NET Core hosting capability.

## COM in .NET Core
COM of cause is old technology and totally Windows specific, but in my case it's the only way to interop with the old legacy FoxPro server/applications. Surprisingly .NET Core - when running on Windows at least - **supports COM access**, which means you can instantiate and call COM objects from .NET Core in the same way as full framework. 

Although .NET Core is cross-platform, COM Interop is a purely Windows specific feature. Incidentally even .NET Standard includes support for the COM related Reflection and Interop functions with the same Windows specific caveat.

## Not so Dynamic
**The good news is that COM Interop works**. **The bad news is that COM Interop using the C# `dynamic` keyword and the Dynamic Language Runtime in .NET does not**. 

Here's a silly example that's easy to try out using `InternetExplorer.Application` to automate that crazy Web Browser. Not very useful but an easy to play with COM Server that's generically available on Windows.

The following code uses raw Reflection in .NET Core to access a COM object and **this works just fine in both full .NET 4.5+ or .NET Core 2.x**:

```cs
[TestMethod]
public void ComAccessReflectionCoreAnd45Test()
{
    // this works with both .NET 4.5+ and .NET Core 2.0+

    string progId = "InternetExplorer.Application";
    Type type = Type.GetTypeFromProgID(progId);
    object inst = Activator.CreateInstance(type);


    inst.GetType().InvokeMember("Visible", ReflectionUtils.MemberAccess | BindingFlags.SetProperty, null, inst,
        new object[1]
        {
            true
        });

    inst.GetType().InvokeMember("Navigate", ReflectionUtils.MemberAccess | BindingFlags.InvokeMethod, null,
        inst, new object[]
        {
            "https://markdownmonster.west-wind.com",
        });

    //result = ReflectionUtils.GetPropertyCom(inst, "cAppStartPath");
    bool result = (bool)inst.GetType().InvokeMember("Visible",
        ReflectionUtils.MemberAccess | BindingFlags.GetProperty, null, inst, null);
    Console.WriteLine(result); // path             
}
```

Using the much simpler dynamic code however, **works only in .NET 4.5 but not in .NET Core 2.x**:

```cs
[TestMethod]
public void ComAccessDynamicCoreAnd45Test()
{
    // this does not work with .NET Core 2.0

    string progId = "InternetExplorer.Application";
    Type type = Type.GetTypeFromProgID(progId);
    dynamic inst = Activator.CreateInstance(type);

    // dynamic inst is set, but all prop/metho access on dynamic fails
    inst.Visible = true;
    inst.Navigate("https://markdownmonster.west-wind.com");

    bool result = inst.Visible;
    Assert.IsTrue(result);
}
```

This is a bummer, but it looks like this will get fixed in .NET Core 3.0. I was just about to post an issue on the [CoreFx Github repo](https://github.com/dotnet/corefx), when I saw this:

* [Using Dynamic with COM object doesn't work](https://github.com/dotnet/corefx/issues/32630)

and it looks it's been added to be fixed for .NET Core 3.0.

I'm glad to see that COM at least works. In this particlar case, I'm only dealing with a handful of Interop calls so I don't mind too much using my [ReflectionUtils in Westwind.Utilties](https://github.com/RickStrahl/Westwind.Utilities/blob/master/Westwind.Utilities/Utilities/ReflectionUtils.cs) to do it. 

But for more complex use cases it sure is a lot easier to use `dynamic` to handle the automatically handle the type casting and more natural member syntax. Hopefully this will get addressed before 3.0 ships later this year - chances are good seeing that a lot of focus in 3.0 is around making old Windows related frameworks like WinForms and WPF work in .NET Core. COM is just one more step removed back from that :joy:


<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
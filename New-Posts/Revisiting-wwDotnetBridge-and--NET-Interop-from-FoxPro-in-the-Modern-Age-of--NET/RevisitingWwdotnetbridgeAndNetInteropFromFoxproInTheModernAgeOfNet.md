---
title: Revisiting wwDotnetBridge and .NET Interop from FoxPro in the Modern Age of .NET
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2024-08-24T14:04:47.0286533-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Revisiting wwDotnetBridge and .NET Interop from FoxPro in the Modern Age of .NET

.NET has proliferated as the dominant Windows development environment, both for application development using a variety of different Windows-specific platforms and the high-level interface chosen by Microsoft  to expose Windows system functionality. .NET based APIs have mostly replaced COM as the high level Windows system interface that exposes Interop features besides native C++.

More importantly though, .NET has garnered a huge eco system of open source and commercial libraries and components that provide just about any kind of functionality and integration you can think of. 

All of this is good news for FoxPro developers, as you can take advantage of most of that .NET functionality to extend your own FoxPro applications with rich functionality beyond FoxPro's native features.

## .NET History: .NET Framework to .NET Core
.NET has been around since the early 2000's and in those nearly 25 years it has undergone a number of transformations. From its early days as a limited distributed runtime, to integration into Windows as a core Windows component, to the splitting off of .NET Core as a cross platform capable version of .NET, to full cross-platform support for .NET Core, to recent releases that provide nearly full compatibility with .NET Framework for .NET Core including of Windows specific platforms (ie. WinForms, WPF, WinUI).

The most significant change occurred in 2016, when .NET split off into the classic **.NET Framework** (the Windows native Runtime build into Windows) and **.NET Core**, which is a newly redesigned version of .NET that is fully cross-platform enabled and can run on Windows, Mac and Linux and that is optimized for performance and optimized resource usage. The new version has greatly expanded .NET's usefulness and developer reach with many new developers using the platform now.

This new version of .NET - although it had a rough initial start - is also mostly compatible with the classic .NET Framework and can for the most part run code on both frameworks interchangeably. .NET Core brought a ton of improvements to .NET in terms of performance and resource usage, as well as new server side frameworks (ASP.NET, Blazor, Maui etc.), as well as much easier tooling that removed the requirement for developing applications exclusively on Windows using Visual Studio. Today you can build applications for Windows, Mac or Linux, developing applications on these platforms using native editors either with integration tooling or command line tools that are freely available via the .NET SDK. The SDK includes all the compiler tools to build, run and publish .NET applications from the command line without any specific tooling requirements.

## .NET and FoxPro
Although .NET Core is the *new and shiny* new framework, for FoxPro developers it's still preferable to continue using the built-in classic .NET Framework, because the .NET Runtime is part of Windows and so always available - there's nothing else to install. It's the easiest integration path for FoxPro applications. For this reason I strongly recommend you use .NET Framework components if possible.

It is also possible to use .NET Core components with FoxPro. However the process of doing so is more complicated. 

First you need to ensure a matching .NET Core runtime is installed to support the minimum version of any components you are calling. Native COM Interop in .NET Core is much more complex as you have to define explicit COM interfaces (in fact I was not able to make this work at all from FoxPro). 

Luckily you can use wwDotnetBridge via newly added support via the wwDotnetCoreBridge class to access .NET Core components. But even with wwDotnetBridgeCore it can often be trickier to get components to run, because .NET Core tends to have many more file dependencies than .NET framework components and version conflicts can be more frequent and more difficult to resolve for this reason.

The good news is that most components today use multiple runtime targets that support both .NET Core, and the old .NET Framework or .NET Standard 2.0 which can also be called with the .NET Framework.

> #### @icon-lightbulb Stick to .NET Framework
> If at all possible aim for using .NET Framework if you're calling .NET code from FoxPro. Only use .NET Core components if there is no alternative in .NET Framework available.

## What is wwDotnetBridge?
wwDotnetBridge is an **open source, free** FoxPro library, that allows you to load and call most .NET components from FoxPro and provides access to many advanced .NET features that are not accessible with plain COM Interop.

The key features are:

* **Registrationless access to most .NET Components**  
Unlike native COM Interop, components you create with wwDotnetBridge don't have to be registered as COM objects. Because objects are instantiated from within .NET you can access most .NET components by directly loading them from their DLL assembly. Both .NET Framework (`wwDotnetBridge`) and .NET Core (`wwDotnetCoreBridge`) are supported.

* **Instantiates .NET Objects via COM from within .NET**  
wwDotnetBridge is a bridge that **runs inside of .NET** and acts as an intermediary for activation, invocation and access operations. A key feature is that it creates .NET instances from within .NET and returns those references using COM Interop. Once loaded you can use all features that COM supports directly: Property access and method calls etc. *as long the members accessed use types that are supported by COM*.

* **Support for Advanced .NET Features that COM Interop doesn't support**  
There are many .NET features that COM doesn't natively support: Generics, method overloading, value types, enums to name just a few. Because wwDotnetBridge runs inside of .NET, it provides helpers to allow access to these features via Reflection operations. These helpers access the unsupported COM operations from inside of .NET and translates the results into COM and FoxPro compatible results.

* **Automatic Type Conversions**  
Because there are many incompatible types in .NET that don't have equivalents in COM or FoxPro, wwDotnetBridge performs many automatic type conversions. These make it easier to call methods or retrieve values from .NET by automatically converting compatible types. For example: decimals to double, long to int, Guid to string etc. There are also wrapper objects like `ComArray` that wraps .NET Collections and provides a FoxPro friendly interface for navigating and updating collections, and `ComValue` which wraps .NET values and provides convenient method to set and retrieve the value in a FoxPro friendly way. 

* **Support for Async Code Execution**  
A lot of modern .NET Code uses async functionality via `Task` based interfaces, and wwDotnetBridge includes a `InvokeTaskMethodAsyc()` helper that lets you call these async methods and receive results via Callbacks asynchronously. You can also run **any** .NET synchronous method and call it asynchronously using `InvokeMethodAsync()` using the same Callback mechanism.

There's much more, but these are the most common features used in wwDotnetBridge.
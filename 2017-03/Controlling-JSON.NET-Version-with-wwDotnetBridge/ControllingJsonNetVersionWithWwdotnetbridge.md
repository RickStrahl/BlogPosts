---
title: Controlling the JSON.NET Version in wwDotnetBridge with Assembly Redirects
abstract: JSON.NET is the most popular .NET component used in more components than any other and because of that you can end up finding other components that also use JSON.NET and perhaps with a different version. Trying to load a different version of JSON.NET in an application can cause runtime failures for loading the assembly. The workaround is to use .NET Assembly Redirects in the application's .config file. Here's how to do this.
keywords: JSON.NET,FoxPro,wwdotnetBridge
categories: FoxPro,wwDotnetBridge
weblogName: West Wind Web Log
postId: 927
postDate: 2018-09-17T11:24:31.0762884-07:00
---
# Controlling the JSON.NET Version in wwDotnetBridge with Assembly Redirects

![Round Hole, Square Peg](SquarePegRoundHole.jpg)

[West Wind Web Connection](https://west-wind.com/webconnection/) and [West Wind Internet And Client Tools](https://west-wind.com/WestwindClientTools.aspx) include JSON parsing features that are provided through .NET and the wwDotnetBridge extension that bridges to the popular [JSON.NET](http://www.newtonsoft.com/json) .NET component library. JSON.NET is the most widely used .NET JSON parsing library and the [wwJsonSerializer class](https://west-wind.com/webconnection/docs/_1wu18owba.htm) utilizes it for its `DeserializeJson()` parsing code. The method basically passes a JSON input, lets JSON.NET parse it into an internal object tree, which is then unpacked into a clean FoxPro object, collection or value.

### A History of wwJsonSerializer
Initially wwJsonSerializer used a FoxPro based parser, which was both slow and not very reliable. FoxPro has a number of limitations when it comes to string parsing the worst of which is that there's no efficient way to parse a string character by character. Using `SUBSTR(string,1)` is excruciatingly slow in large strings and in order to build an effective parser you have to parse strings one character at a time. When I built the original parser I took a few shortcuts to avoid the char by char parsing and it resulted in not very stable JSON parsing with many edge cases that just didn't work.

Bottom line - building an effective parser is something better left to people who specialize in it, and JSON.NET is a proven open source library that's used by Microsoft in most of their Frameworks. If it's good enough for them it's good enough for me.

I've been using this setup for a number of high throughput service applications and this setup of JSON parsing has worked out very well - it's much faster than the manual parsing of the old code and even with the overhead of creating a FoxPro object out of the JSON object graph, it's still very speedy. The results are also reliable. I have yet to see a de-serialization failure on any valid JSON input.

### JSON.NET Version Issues
As cool as JSON.NET usage in West Wind products is, there are also some issues. Because JSON.NET is so widely used in .NET, it's quite likely that you will run into other .NET components that also use JSON.NET - and quite likely use a different version of it. Since .NET can only load one version of a library at a time, this can cause a problem as one component will not be able to load the version of JSON.NET that it's binding to.

.NET is a statically linked runtime environment so binaries are almost always tied to a specific version number of the component. So if you have two components or an application and components trying to use different versions of the same library there can be a conflict.

Luckily .NET provides a workaround for this in most situations.

### Assembly Redirects to the Rescue
.NET has a built-in system for runtime version forwarding which can be accomplished by way of Assembly Redirects the applications .config file.

For FoxPro application's this means you can put these assembly redirects into one of these files:

* YourApp.exe.config
* VFP9.exe.config

The config file is associated with the launching .EXE file, so that's either your standalone compiled application file, or the FoxPro IDE `vfp9.exe`.

The following is an example of `.config` file that forces JSON.NET usage of any version to version 8.0:

```xml
<?xml version="1.0"?>
<configuration>
  <startup>   
	<!-- <supportedruntime version="v4.0.30319"/> -->
	<supportedRuntime version="v4.0" sku=".NETFramework,Version=v4.5.2" />
	<!-- supportedRuntime version="v4.0" sku=".NETFramework,Version=v4.5" -->    
    <!-- supportedRuntime version="v2.0.50727"/ -->    
  </startup>
  <runtime>
      <loadFromRemoteSources enabled="true"/>
  </runtime>
  
  <runtime>    
    <assemblyBinding xmlns="urn:schemas-microsoft-com:asm.v1">
      <dependentAssembly>
        <assemblyIdentity name="Newtonsoft.Json" publicKeyToken="30ad4fe6b2a6aeed" culture="neutral" />
        <bindingRedirect oldVersion="0.0.0.0-6.0.0.0" newVersion="8.0.0.0" />
      </dependentAssembly>
	</assemblyBinding>      
  </runtime>
</configuration>
```

The key element is the `<dependentAssembly>` which describes `Newtonsoft.Json` and basically redirects any version found - `oldVersion` -  to the `newVersion`. The new version in this case is the greater version number between the one wwDotnetBridge provides (6.x which is fairly old) and whatever other higher version is in use. You can check the .dll version number in the File details (**Explorer -> Right Click DLL -> Details**). In the example, here I'm interfacing with a .NET Socket.IO client library that uses Newtonsoft.Json version 8 and that's what's reflected in the `newVersion`. Now when wwDotnetBridge asks to version 6.0 of JSON.NET, .NET redirects to version 8.0 and everything works as long as the interface of the library supports the same signatures of methods and properties that the code accesses.

This approach works for any .NET assembly (dll) where there might be multiple versions in place.

### Assembly Redirects don't always Work
In the case of JSON.NET assembly redirects always work because the James Newkirk who's the creator of JSON.NET - with some serious nudging from Microsoft - has so far ensured that the base interfaces are not changed. While there are many new features in newer version of JSON.NET, all of the new features are implemented with custom parsers and serializers that plug into a pipeline. The result is that you can safely forward JSON.NET v6 to v9 and expect things to work.

This approach can however also fail if you have component that is not backwards and forward compatible. Many components change behavior and interfaces when major version changes happen and if a change affects an interface that you are calling then you can end up with runtime errors that are difficult to track down. Luckily, this is not a common scenario. 

### Summary
Version conflicts can be painful, and the error messages you get for version conflicts are often not very conclusive and seem to point to other issues (the usual error is: Unable to load dependent assembly) and the worst part is that usually the .NET error message doesn't provide any information on which sub-component failed to load.

The first line of defense are assembly redirects that you can specify in your application's `.config` file and in most common version conflict situations this the solution as is the case for JSON.NET version conflicts which is probably the most common one you might run into.




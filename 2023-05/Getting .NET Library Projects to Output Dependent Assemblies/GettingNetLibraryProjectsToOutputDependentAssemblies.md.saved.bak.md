---
title: Getting .NET Library Projects to Output Dependent Assemblies
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2023-05-26T09:03:12.7609127-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Getting .NET Library Projects to Output Dependent Assemblies

If you are building standalone libraries that are not destined for a NuGet package, you might have found out the hard way, that the build output folder (ie. `bin/Release/{targetFramework}`) **doesn't contain any depedency assemblies**. So when you reference other packages or assemblies directly in your project they are not dumped into the build output folder.

This behavior is different than full .NET Framework (NetFX) and also original version of .NET Core prior to 5.0,  which by default output any dependencies into the build folder. Besides being useful to see ho

The behavior is also different than top level applications (ie. an EXE on Windows) which continue to output dependent assemblies - as they have to in order to function at all.

In summary:

**Dependent Assemblies are generated**

* Any top level projects (NetFX and Core)
* .NET Framework Projects

**Dependent assemblies are not generated**

* Library Projects

## So what?
Now, this isn't going to be a very common use case, because these days most library projects are used in one of two ways:

* Built into a NuGet Package
* Referenced by another project

In both those scenarios the build process handles resolving references and dependencies and passing them forward all the way to the top level application which then exposes the dependencies. 

This is fine and that's the way the build is supposed to work and it basically always has worked this way. There are subtle differences but overall the build process for NetFx and Core projects works in similar ways which makes it possible to build multi-targeted applications with relative ease.

## PlugIns and Addins have different needs
However there are scenarios where you're building a library that's not going to be used directly as a reference by an application. The specific use case are plugins/addins which are not hard linked into a top level application, but rather loaded dynamically at runtime and therefore have to expose all of their dependencies that are not already used by the host application.

For this you need to be able to output the dependencies explicitly into the build folder - in the same way that NetFX projects used to do by default! This change in behavior in Core projects threw me for a loop and working around this is rabbit hole that 

The other use case is to actually produce 'ready-to-run' output into a specific location, potentially of another application that is not hard linking to the library directly. Instead it might be dynamically loaded - as is the case for an addin.

I have this scenario in [Markdown Monster](https://markdownmonster.west-wind.com) where I have a number of addins that are installed in a custom folder and loaded dynamically at runtime. In order for this to work smoothly during development and package time, the application builds the Addins into a sub-folder of the main application. 

Here's what this looks like in the Addin project:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <Version>2.9</Version>
    <TargetFrameworks>net7.0-windows;net472</TargetFrameworks>
    
    <AssemblyName>WeblogAddin</AssemblyName>
    <UseWPF>true</UseWPF>
    
    <OutputPath>$(SolutionDir)MarkdownMonster/bin/$(Configuration)/$(TargetFramework)/Addins/Weblog</OutputPath>
    <AppendTargetFrameworkToOutputPath>false</AppendTargetFrameworkToOutputPath>
    
  </PropertyGroup>
</Project>  
```

You can see that the Addin project sets an explicit output path that points into the `Addins\WebLog` folder of the parent project - the main Markdown Monster executable project. Setting a fixed **and exact** output path is harder than it should be and requires that you set both the `<OutputPath>` and `<AppendTargetFrameworkToOutputPath>` elements (see here for [more info](https://weblog.west-wind.com/posts/2023/Apr/21/Setting-an-Absolute-Output-Path-for-NET-SDK-Projects)).


When you build this you end up with something like this:

![](DIfferenceBetweenNetFxandCore.png)

Notice how the NetFx includes the `kveer`


This project also has a lot of dependencies, although most of them are hidden except for one - the XmlRpc dependency:

```xml
<ItemGroup>
  <!-- these packages explicitly should not output into build folder -->
  <!-- by default for .NET Core this isn't necessary as they are not
       outputting into build anyway. However, for .NET 4.72 they **do** 
       and that's why the setting is made here: be explicit  -->
  <PackageReference Include="MahApps.Metro" Version="2.4.9">
    <IncludeAssets>compile</IncludeAssets>
  </PackageReference>
  <PackageReference Include="YamlDotNet" Version="13.1.0">
    <IncludeAssets>compile</IncludeAssets>
  </PackageReference>
  <PackageReference Include="Westwind.Utilities" Version="4.0.0">
    <IncludeAssets>compile</IncludeAssets>
  </PackageReference>
  
  <!-- this package explicitly **should** copy resources into the output folder -->
  <PackageReference Include="Kveer.XmlRPC" Version="1.2.2"  />

  <!-- no output for project reference -->
  <ProjectReference Include="../../MarkdownMonster/MarkdownMonster.csproj">
    <Private>false</Private>
    <IncludeAssets>compile</IncludeAssets>
  </ProjectReference>
</ItemGroup>
```


All that is fine, but when I build both the 


```csharp
<PropertyGroup>
  <Version>2.9</Version>

  <TargetFramework>net7.0-windows</TargetFramework>
  <UseWPF>true</UseWPF>
  

  <CopyLocalLockFileAssemblies>true</CopyLocalLockFileAssemblies>

</PropertyGroup>
```

  

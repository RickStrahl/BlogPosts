---
title: '.NET Core SDK Projects: Controlling Output Folders and Dependencies Output'
abstract: I've been upgrading Markdown Monster to run on .NET Core 3.0 and one of the biggest changes is switching to the new .NET SDK style format for all projects. I ran into some issues with the Addin projects that require that output is placed in a very specific output folder and to not include output of all references. In this post  describe a couple of ways to control where output goes and how to limit the output that goes to those folders.
categories: .NET Core
keywords: .NET Core, ProjectDependency, Dependency, Transient, Project, SDK, .NET SDK Project, Output, ExcludeAssets, IncludeAssets, Private, MsBuild, Package, NuGet
weblogName: West Wind Web Log
postId: 1244833
dontInferFeaturedImage: false
dontStripH1Header: false
postStatus: publish
featuredImageUrl: https://weblog.west-wind.com/images/2022/.NET-Core-3.0-Projects-and-Controlling-Output-Folders-and-Content/HideyHole.jpg
permalink: https://weblog.west-wind.com/posts/2019/Apr/30/NET-Core-30-SDK-Projects-Controlling-Output-Folders-and-Content
postDate: 2019-04-30T16:43:36.5583246-07:00
customFields:
  mt_githuburl:
    id: 
    key: mt_githuburl
    value: https://github.com/RickStrahl/BlogPosts/blob/master/2019-04/.NET-Core-3.0-Projects-and-Controlling-Output-Folders-and-Content/NetCore30ProjectsAndControllingOutputFoldersAndContent.md
---
# .NET Core SDK Projects: Controlling Output Folders and Dependencies Output

![](HideyHole.jpg)

*last updated July 26th, 2022. Original post written on NetCore 3.0, updated for .NET 6.0*{style="color: red; font-size: 0.8em"}

In my last post I talked about [porting my Markdown Monster WPF application to .NET Core 3.0](https://weblog.west-wind.com/posts/2019/Apr/24/First-Steps-in-porting-Markdown-Monster-to-NET-Core-30) and one of the problems I ran into was how to deal with properly handling compilation of Addins. In Markdown Monster Addins compile **into a non-standard folder** in the main EXE's output folder, so when building the project I want my Addin to be pushed right into the proper folder hierarchy inside of the parent project so that I can run **and debug** my addins along with the rest of the application.

This used to be pretty easy in classic .NET projects:

* Add NuGet or Project References
* Mark each assembly reference's **Copy Local** settings
* Include new dependencies with Copy Local `True`
* Exclude existing dependencies with Copy Local `False`

In the new .NET SDK projects this is more complicated as there's no simple way to exclude dependencies quite so easily. Either everything but the primary assembly is excluded which is the default, or you can set a switch to copy dependencies which copies **every possible dependency** into the output folder.

Let's take a look.

## Where does output go?
By default .NET SDK projects push compiled output into:

```text
bin\Release\net60\win-x64
```

The reason for this more complex path that includes a target framework is that SDK projects can potentially have multiple targets defined using the `<TargetFrameworks>` element (note the extra `s`) so you can do:

```xml
<TargetFrameworks>net462;net60</TargetFrameworks>
```

The separate folder structure allows for both targets to get their own respective output folders when you build the project.

![](SeparateTargetFolders.png)

For my addins, I don't want output to go into the standard location, but rather I need to specify a custom location in my main application's `Addins/AddinName` folder using:


```xml
<PropertyGroup>
    <OutDir>$(SolutionDir)MarkdownMonster/bin/$(Configuration)/$(TargetFramework)/win-x64/Addins/Weblog</OutDir>
</PropertyGroup>
```

which pushes the output into the correct location:

![](AddinOutput.png)

## Controlling Dependency Output: With or Without Dependencies
When adding a project reference to my main project from the addin I ran into a bit of a problem in regards to how dependencies are handled.

##AD##

I started with importing the `<ProjectReference>` via Visual Studio which produces:

```xml
<ItemGroup>
  <ProjectReference Include="../../MarkdownMonster/MarkdownMonster.csproj"  />
</ItemGroup>
```
Once the project is referenced if you indirectly reference features that require dependencies for the Markdown Monster project, it'll just work as the references are passed through an available from the host application.

When you do this by default all transient dependencies are pulled into the project. Also all dependency assemblies from the imported project are output into the build output folder. Most of the time that is the behavior you want.

But in some cases - an addin being a common scenario - you may not want all the dependencies from the referenced project to end up in the output folder. Since I'm creating an Addin that runs in the context of the host project, there's no need to duplicate the dependencies in the output folder. 

How do we prevent the transient dependencies from being output?

### Referencing Transient Dependencies without Outputting them
If you need to **explicitly reference components** from the main project either as NuGet Packages or direct binary references, it's possible to mark them as Compile Only Included Assets. Compile-only in this context means they won't get copied to the output folder.

Here's what this looks like for dependent packages that **are explicitly required** by the addin project's code:

```xml
<ItemGroup>
    <!-- Transient References explcitly accessed by the Addin Project -->
    <PackageReference Include="MahApps.Metro" version="1.6.5">
      <!-- keeps assembly output from going into the OutDir -->
      <IncludeAssets>compile</IncludeAssets>
    </PackageReference>
    <PackageReference Include="Dragablz" version="0.0.3.203">
      <IncludeAssets>compile</IncludeAssets>
    </PackageReference>    
    ...
    
    <!-- direct project dependencies should be output into OutDir -->
    <PackageReference Include="xmlrpcnet" version="3.0.0.266" />
    <PackageReference Include="YamlDotNet" version="6.0.0" />
</ItemGroup>
```

The `MahApps.Metro` and `Dragablz` package references are part of the Main Markdown Monster project so they should be available for access, but not output into the output folder. 

The `XmlRpcNet` and `YamlDotNet` packages are direct references unique to this Addin project and **should output** to the `OutDir` which is the 'normal' behavior.

> Note that `<IncludeAssets>` (and also `<ExcludeAssets>`) don't show up in the Visual Studio `.csproj` schema Intellisense, so no hints for you! You get to guess with the rest of us.

### Project Reference: Too Many Assemblies - make it stop!
Since this works so smoothly with `<PackageReference>` you'd expect the behavior to be pretty much the same with `<ProjectReference>` but unfortunately the behavior here is a bit different and a lot less obvious.

If I do a plain project reference from my Addin project to the main Markdown Monster project and then build, I get an output folder that is a mess **with every single dependency from the main project dumped into my Addin output folder**:

![](TooManyAssemblies.png)

Eeek. This is not what I want here.

### Limiting Project Output to only the Current Project
This should be easy: Visual Studio has an option to **Copy Local = false** which works for **References** and prevents dependencies to be copied into the output folder. Rather it just copies the actual output of the project and any direct dependencies of that project to the output folder.

Unfortunately the default behavior **doesn't work for `<ProjectReference>` entries**. For projects referenced with **Copy Local**, Visual Studio creates:

```xml
<ItemGroup>
    <ProjectReference Include="../../MarkdownMonster/MarkdownMonster.csproj" Private="False" />
</ItemGroup>
```

which **does not prevent** dependencies to be included. This produces the same massively cluttered output:

![](TooManyAssemblies.png)

Well at least not all of them - it will only prevents **nested project references** from being imported and output to the Output path. But it **will not prevent nested NuGet packages** or **explicit nested references** to be excluded.

### `ExcludeAssets="all"` or `IncludeAssets="compile"` keep out Transient Dependencies
A lot of false starts later, I found the solution in the `ExcludeAssets` or `IncludeAssets` flags that determine how output is copied. These work **in combination with the Private flag** which is why I missed this solution previously.

The fix requires both Private and ExcludeAssets (or IncludeAssets):


```xml
<ItemGroup>
    <ProjectReference Include="../../MarkdownMonster/MarkdownMonster.csproj">
        <Private>false</Private>
        <ExcludeAssets>all</ExcludeAssets>
    </ProjectReference>
</ItemGroup>
```

Alternately you can also use `<IncludeAssets>` which produces the same result (in this case - not sure what the subtle differences are):

```xml
<ItemGroup>
    <ProjectReference Include="../../MarkdownMonster/MarkdownMonster.csproj">
        <Private>false</Private>
        <IncludeAssets>compile</IncludeAssets>
    </ProjectReference>
</ItemGroup>
```

This does the right thing which is produce only the compiled output from the current project, plus any direct references from the Addin project:

![](AddinOutput.png)

`WebLogAddin.dll` is the main Addin assembly, and the CookComputing and YamlDotnet DLLs are direct dependencies of the Addin project.

Yay this works.

### All Together Now: Addin Project References
The key takeaway from all this is:

* The Visual Studio add project **Copy Local** doesn't work as expected
* It takes both:  
  `<Private>false</Private>` **and**  
  `<IncludeAssets>compile</IncludeAssets>`  
  produce expected **Copy Local** behavior


To put all of this Addin project import together for the addin looks something like this:

* Set explicit output path
* Reference Packages from Main Project without pulling dependencies into output
* Reference Main Project without pulling in dependencies into output

Here are the key items in the `.csproj` file:

```xml
<PropertyGroup>
    <OutDir>$(SolutionDir)MarkdownMonster/bin/$(Configuration)/$(TargetFramework)/win-x64/Addins/Weblog</OutDir>
</PropertyGroup>
<ItemGroup>
     <!-- Transient References explcitly accessed by the Addin Project -->
    <PackageReference Include="MahApps.Metro" version="1.6.5">
      <!-- keeps assembly output from going into the OutDir -->
      <IncludeAssets>compile</IncludeAssets>
    </PackageReference>
    <PackageReference Include="Dragablz" version="0.0.3.203">
      <IncludeAssets>compile</IncludeAssets>
    </PackageReference>
    ...
    
    <!-- direct project dependencies: These will output should be output into OutDir -->
    <PackageReference Include="xmlrpcnet" version="3.0.0.266" />
    <PackageReference Include="YamlDotNet" version="6.0.0" />
    
    <!-- Make sure to use Pivate and ExcludeAssets in combination 
         to prevent dependency output into OutDir                        -->
    <ProjectReference Include="../../MarkdownMonster/MarkdownMonster.csproj" 
                      Private="false" 
                      ExcludeAssets="all" />
</ItemGroup>
```

##AD## 

## Harder than it should be
This is a re-write of this post with the final solution that was found nearly 3 years later. This is way harder than it should be. I have no idea if this solution was available prior to the current .NET 6.0 release or not but even today finding out how to reference this functionality or even the `ExcludeAssets` flag is nearly impossible. Unless you know what you're looking for you're going to stumble across a lot of dead ends and outdated information from earlier versions of .NET or even earlier versions of .NET Core.

What I'm describing here is a bit of an edge case because of the way the addins are wired up in my application, which is the opposite of most other components (ie. referencing a main executable from a component rather than the other way around).

> To be clear having all assemblies in the output folder doesn't break the application so the default settings **work just fine**. But by default you do end up with a bunch of duplicated assemblies that likely don't want and have to explicitly exclude using the steps provided in this post.

Hopefully this post helps pointing you in the right direction to make it easier to reference other components when you don't want their dependencies dumped into your binary path.

## Related Resources

* [First Steps in porting Markdown Monster WPF App to .NET Core 3.0](https://weblog.west-wind.com/posts/2019/Apr/24/First-Steps-in-porting-Markdown-Monster-to-NET-Core-30)
* [Project Dependency NuGet Settings](https://docs.microsoft.com/en-us/nuget/consume-packages/package-references-in-project-files#controlling-dependency-assets)
* [Markdown Monster](https://markdownmonster.west-wind.com)
* [Markdown Monster Project on GitHub](https://github.com/RickStrahl/MarkdownMonster)


<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
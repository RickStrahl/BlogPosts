---
title: First Steps in porting Markdown Monster to .NET Core 3.0
weblogName: West Wind Web Log
postDate: 2019-04-24T11:29:26.0545383-10:00
---
# First Steps in porting Markdown Monster to .NET Core 3.0

Today I took a little time to explore what it would take to port Markdown Monster to .NET Core. Most of the examples I've seen so far for ports or running applications on .NET Core are pretty trivial - you can see how the process works, but just looking at those examples I have a million questions of how certain things will be handled.

For example:

* How to handle non-.NET Standard NuGet Packages
* How do external assembly loads (for addins in MM) work
* Porting - How do I get my project ported
* How to Xaml files get built
* How do resources (Assets) get embedded into the project


## Porting
So the first thing I did is convert the project file to a .NET Core project file by switching the old .NET project to a .NET SDK project. If you recall, .NET SDK projects are much simpler than the old .NET projects because you generally don't have to list all the files that need to be included. 

However, for Windows projects you will end up with a lot files that **do need to be referenced** in the project in order to handle special build operations. For examples, all XAML files have to be explicitly embedded (for now) with special instructions that tell them to be built properly from XAML into executable code.

To start I simply created a mostly empty project file from my old project:

```xml
<Project Sdk="Microsoft.NET.Sdk.WindowsDesktop">
 
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>netcoreapp3.0</TargetFramework>
    <AssemblyName>MarkdownMonster</AssemblyName>
    <UseWPF>true</UseWPF>
  </PropertyGroup>
 
  
  <ItemGroup>
    <ApplicationDefinition Update="App.xaml">
      <SubType>Designer</SubType>
    </ApplicationDefinition>

    <Page Update="MainWindow.xaml">
      <SubType>Designer</SubType>
    </Page>
  </ItemGroup>


</Project>
```

At this point I can actually open the project in Visual Studio as a new SDK style project.

I only added two forms to start but later I have to add each of the forms and controls explicitly.

If I compile at that point I'll get hundreds of errors - that's because there are no packages added. So the next step then is to move over all the package references into the new project as an item group.

```xml
  <ItemGroup>
    <PackageReference Include="Dragablz" Version="0.0.3.203" />
    <PackageReference Include="FontAwesome.WPF" Version="4.7.0.9" />
    <PackageReference Include="HtmlAgilityPack" Version="1.11.3" />
    <PackageReference Include="LibGit2Sharp" Version="0.26.0" />
    <PackageReference Include="LumenWorksCsvReader" Version="4.0.0" />
    <PackageReference Include="MahApps.Metro" Version="1.6.5" />
    <PackageReference Include="Markdig" Version="0.16.0" />
    <PackageReference Include="Microsoft.ApplicationInsights" Version="2.9.1" />
    <PackageReference Include="Microsoft.Windows.Compatibility" Version="2.0.1" />
    <PackageReference Include="NHunspell" Version="1.2.5554.16953" />
    <PackageReference Include="Westwind.Utilities" Version="3.0.25" />
  </ItemGroup>
```

Now what's interesting about this is that I simply took the old references and added them in here. Some of the project in question are not .NET Standard (or .NET Core) compliant - mainly the Windows specific ones like this older version of MahApps, Dragablz and FontAwesome. Most of the other assemblies actually have .NET Standard 2.0 versions that are used instead of the full framework ones.

Interestingly enough though it looks like the full framework assemblies compile just fine, but we'll see what happens at runtime.
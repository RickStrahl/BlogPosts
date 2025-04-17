---
title: Matching .NET Core Runtimes at Installation
weblogName: West Wind Web Log
postDate: 2019-02-18T16:36:28.4322755-10:00
---
# Matching .NET Core Runtimes at Installation

Quick let's see if you know this answer:

If you have a .NET Core 2.0 application that you compiled against the shared runtime (ie. no local runtime deploy) and you install that application on a machine that does not have .NET Core 2.0 installed, but a newer version does the application run?

You would assume that it would, right, but honestly I didn't know. After a bit of searching around I couldn't find the answer and I actually threw it out on Twitter as a question and while I felt kind silly for not knowing the answer for this, it turns out I wasn't alone. Quite a few responses also didn't know the answer to that question although I assumed that there was some sort of forward compatibility.

### Runtime Specification in .NET Core
When you build a .NET Core application you specify the overall runtime that you working against with the `<TargetFramework>` attribute in your project file:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>netcoreapp2.0</TargetFramework>
  </PropertyGroup>

</Project>
```



https://github.com/dotnet/core-setup/blob/master/Documentation/design-docs/roll-forward-on-no-candidate-fx.md
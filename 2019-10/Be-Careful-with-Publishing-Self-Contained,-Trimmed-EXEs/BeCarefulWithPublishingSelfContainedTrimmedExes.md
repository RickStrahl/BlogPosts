---
title: A few Gotchas for Self-contained Published EXEs with .NET Core 3.0
weblogName: West Wind Web Log
postDate: 2019-10-20T10:25:38.0359001-10:00
---
# A few Gotchas for Self-contained Published EXEs with .NET Core 3.0

There's been a lot of talk and excitement around .NET Core 3.0's ability to create fully self contained single file EXEs from a .NET Core application. The feature allows you to wrap up **everything** in the application - the .NET Core Runtimes, the framework runtimes, and your application dependencies - into a neatly packaged single file EXE.

This EXE is large - a hello world Console application will clock in at 70mb, but that does include **everything** it needs to run on a virgin system, and even with the size that can come in handy. In fact, I have several legacy Web products that I still maintain that used to have explicit dependencies on an external Web Server that can now be packaged up as a single EXE that just works and serves Web content by running a single EXE which is awesome.

The more common use case though is for running side by side applications that require different runtimes and with the single packaged EXE you can be sure that the app will run with the **exact** environment you have built it with and that too can be immensely useful.

Self-contained EXEs are easy to create: Create a standard application the way you always do, and then publish it with a couple of custom flags:

```ps
dotnet publish -c Release /p:PublishSingleFile=true  -r win-x64 -o ./bin/ExeFile
```

You use `/p:PublishSingleFile=true` and specify a **specific** platform runtime via the `-r` switch using a platform identifier. I like to send the output to a specific folder in the `bin` folder rather than being buried 5 levels down in the default build output folders...

It's takes very little effort, to turn any kind of .NET Core 3.0 application into a self contained package.

## Self Contained Only
Note that single file exes can only build **fully self-contained executables** that include the runtimes.

There are currently no options to build a self-contained EXE for shared runtime execution, which would be a nice feature to have, although that would require that the required runtime is already installed for the EXE to run.

## Watch out for Trimmed EXEs
So the big downside to using a self-contained EXE is that the packages are positively massive. For a typical Web application that includes ASP.NET Core.

## No InProcess IIS Hosting For Self-Contained EXEs
If you are building a self-contained ASP.NET Core application, you can use the final EXE to host it in IIS. However, you are limited to hosting it as an out of process assembly.

Note that you can 

## You an Host the same EXE from Multiple IIS Sites
Using the ASP.NET Core hosting module you can specify a path to the hosting executable. By default this points at the local folder `.\MySelfContainedExe` or at `dotnet.exe` (which is globally on the path) plust an argument of the DLL to load.

However you can also specify a full OS path like this:

```xml
<handlers>
  <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
</handlers>
<aspNetCore 
    processPath="C:\WebConnection\LocalWebServer\WebConnectionWebServer.exe" 
    arguments="" 
    stdoutLogEnabled="true" 
    stdoutLogFile=".\logs\stdout" 
    hostingModel="OutOfProcess" />
</aspNetCore> -->
```

Notice the `processPath` is pointing at a physical path on disk. You can have many applications that point at that very same exe and run side by side without having to copy the large EXE into each of the Web application folders. 

Note that the startup folder may be affected by this.

## Self Contained and Configuration Settings
Ran into another issue with Self-Contained EXEs: The log file settings in my configured settings.json file are not being respected and the EXE is logging at default `Information` level. My first thought here 

## Build Replacement Weirdness
When building I've found that often times a build/publish will not properly update all the files in the output folder when changing compiler options. It looks like the `dotnet publish` does some build caching and if you switch certain options - like the `publishTrimmed` option - the compiler doesn't do a full rebuild, which can result in a non-trimmed or vice versa version of the final EXE.
  
Along the same lines you can have a custom `web.config` in your project to add additional environment variables or switch the hosting model explicitly in your output folder. However, once the `web.config` exists in the output folder it's not replaced. So you can make changes to the Web.config in your project and although it's marked for copying into the output folder it's not actually updating the file in the output.

My recommendation: Always clear the output folder before building:

```ps
remove-item ./bin/ExeFile/*.*
dotnet publish -c Release /p:PublishSingleFile=true /p:PublishTrimmed=false -r win-x64 -o ./bin/ExeFile
```

to ensure you're always getting all the files copied and replaced completely.
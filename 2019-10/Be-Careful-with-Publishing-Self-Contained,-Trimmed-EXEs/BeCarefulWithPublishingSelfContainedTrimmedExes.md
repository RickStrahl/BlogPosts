---
title: Be Careful with Publishing Self-Contained, Trimmed EXEs
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

Note that single file exes can only build **fully self-contained executables** that include the runtimes. There are no options to build a self-contained EXE for shared runtime execution, which would be a nice feature to have, although that would require that the required runtime is already installed for the EXE to run.

## Cracking down on the size
So the big downside to using a self-contained EXE is that the packages are positively massive. For a typical Web application that includes ASP.NET Core.
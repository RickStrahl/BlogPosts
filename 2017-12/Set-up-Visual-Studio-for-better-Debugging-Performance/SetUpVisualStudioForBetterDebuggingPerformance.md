---
title: Set up Visual Studio for better Debugging Performance
weblogName: West Wind Web Log
---
# Set up Visual Studio for better Debugging Performance

With the recent release of Visual Studio 2017.5, Microsoft seems to have finally realized that Visual Studio has been getting too bloody slow to use over the last few major updates, and focused on a big push to improve startup performance and - what they call - inner loop performacne, which is the edit, debug, run, break, restart cycle. The new version has big improvements especially for .NET Core and ASP.NET Core applications, which until v2017.4.2 or so was almost unworkable. This has improved a lot, so much so that ASP.NET Core run/debugging/test feels nearly as quick as full framework projects which is a big relief. Of all the things to gripe about the move .NET Core, the tooling performance was at the very top of my list because it slowed me down so much. 

So Kudos to Microsoft to for **finally** addressing performance in Visual Studio.

### It's not all up to Microsoft
However, even despite those improvements I often hear a lot of gripes how slow Visual Studio is to startup when debugging, but then I check on their setup and see that there's a shitload of debugging tools running, most of which the developer is likely never using.

If you want an optimized run environment in Visual Studio, take the time to turn off any of the features you don't use. Here are some of the worst culprits:

* The Analytics tools
* Google Chrome and IE Debugger
* Edit and Continue
* Browser Sync

If you need these features and actively use them - by all means don't disable them. They are valuable but you are unlikely to need them, or need them all the time at least. The analytics tools are awesome if you need to track down a performance bug. Browser Sync can 
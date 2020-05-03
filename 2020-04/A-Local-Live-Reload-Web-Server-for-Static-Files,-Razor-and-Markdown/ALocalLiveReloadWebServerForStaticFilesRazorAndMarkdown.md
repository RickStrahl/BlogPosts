---
title: A Local Live Reload Web Server for Static Files, Razor and Markdown
weblogName: West Wind Web Log
postDate: 2020-04-27T14:39:07.9175039-10:00
---
# A Local Live Reload Web Server for Static Files, Razor and Markdown

I've been more or less quietly working on a fun project on the side to build a self-contained, local Web Server that's based on .NET. The goal is for an easily installable self-contained Web server you can point at a directory generically and start serving content along with optional Live Reload functionality enabled.

Yes there are already a lot of things that do this, most of them based on Node components. BrowserSync comes to mind and is one I've used quite a bit in the past. But I've had a number of issues with most of these tools and they never seemed to fit my use case very well. 

There are tons of local servers out there
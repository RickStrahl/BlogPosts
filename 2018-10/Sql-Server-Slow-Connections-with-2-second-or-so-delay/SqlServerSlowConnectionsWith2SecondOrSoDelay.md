---
title: Slow Connections with Sql Server
abstract: Ran into a problem with extremely slow SQL Server connections when connecting to the server. Connections would take 2 seconds or more even on repeat connections. It turns out the problem is related to missing TCP/IP protocol support which is disabled by default.
keywords: Sql Server, Slow Connections, Named Pipes, TCP/IP
categories: Sql Server
weblogName: West Wind Web Log
postId: 989016
postDate: 2018-10-26T23:08:07.0972436-10:00
---
# Slow Connections with Sql Server

Argh... just fought with a small issue where connections to SQL Server were very slow on a new development box. Everytime I make a new SQL Connection there's a **2 second delay** for the connection to occur. It's not only the first request, but any connection request including what should otherwise be pooled connections.

As you might imagine in Web applications that's a major problem even on a dev machine - it makes for some excruciatingly slow Web requests.

This is a local dev machine and I have a local SQL Server Developer installed.

### TCP/IP is Disabled By Default
It turns out that a new SQL Server installation does not enable TCP/IP by default and if you're using a standard connection string it uses named pipes which on this machine at least results in very slow connection times with what looks like a 2 second delay for every connection.

I'm not sure why Named Pipes (or is it Shared Memory) are so dreadfully slow - if that's the case why would you ever use it? 

### Enabling TCP/IP
To enable TCP/IP we'll need to set the protocols in the Sql Server Configuration Manager. With recent versions of SQL Server it looks like Microsoft is no longer installing shortcuts for the SQL Server Configuration Manager, so I had to launch it using the `mmc.exe` and adding the snap-in:

* Start mmc.exe from the Windows Run Box
* Add the Sql Server Configuration snap-in (ctrl-m -> Sql Server)

Once you're there navigate to the Sql Server Network configuration and enable TCP/IP:

![](https://weblog.west-wind.com/images/2018/Sql-Server-Slow-Connections-with-2-second-or-so-delay/AddTcpIp.png)

Just for good measure I also turned off the other two, but that's optional.

### Why are Named Pipe Connections so slow?
I'm pretty sure that I've used Named Pipes in the past and didn't see this type of slow connection times, but I've verified this on several machines so it's not just a fluke with my new dev box. Each machine I've removed TCP/IP from takes about 2 seconds to connect with either Named Pipes or Shared Memory, while with TCP/IP Connections enabled connections are nearly instant on a local machine. As well it should be.

Anybody have any ideas why Named Pipes are so slow for SQL connections? It almost seems like a fixed delay because it's so consistent across several different machines.

After a bit more digging it appears that the problem isn't the Named Pipe Connection itself, but something related to the protocol discovery. In particular I ran into this problem with a FoxPro application which means it's using the SQL Server ODBC driver.

There connecting to SQL server like this with only Named Pipes enabled:

```foxpro
losql = CREATEOBJECT("wwSql")
? loSql.Connect("server=.;database=webstore;integrated security=yes")
```

results in the 2 second+ delay.

Changing the connection string to explicitly specify the protocol however fixes the issue:

```foxpro
losql = CREATEOBJECT("wwSql")
? loSql.Connect("server=np:.;database=webstore;integrated security=yes")
```

which seems to suggest there's some sort of protocol discovery problem where the driver is trying to use TCP/IP first, and failing to get a connection before trying the other protocols.

Interestingly the behavior would vary depending on the version of the SQL Server driver. Version 11 (which is what my ODBC driver is pegged to) exhibits this behavior, while the latest v13 does not.

This isn't a solution, but should be useful as a troubleshooting aid. It's easy to find out if a specific protocol is working as using a protocol that's not installed won't automatically try to go through all the protocols. Perhaps it's a good idea to be explicit about protocols (ie. specify `tcp:.` for the server explicitly always) because then if `tcp/ip` is not enabled you know right away that there's a problem.

### Summary
I'm writing all this up because I know I'll run into this again next time I install a dev machine or even a new server and hopefully by then I'll remember that I wrote this blog post :-). Maybe it'll help you too should you run into slow initial SQL connections as well.

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
---
title: Running Multiple Web Connection Applications on a single Machine
abstract: 
keywords: 
categories: 
weblogName: Web Connection Weblog
postId: 
postDate: 2022-09-20T11:07:53.0905255-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Running Multiple Web Connection Applications on a single Machine
A question that comes up frequently with running Web Connection servers in production is: *Can I run multiple instances of my applications for mulitple Web Sites?*. 

The answer to this question is:  **Yes and it's complicated :smile:**

## Why do you need to have multiple Apps running the same Server?
There are a number of scenarios for which you might need multiple servers. What we're talking about here is running multiple Web Sites with the same code base.

### Multiple Site Scenarios
The most prominent scenarios for running multiple copies of the same server are:

* **Production, Staging, Backup Instances**  
Running multiple environments of the same site so you can test the application separately from a live site that is in production. This is quite common and also good practice so you can test sites and... if necessary you have a fallback site should the live site fail.

* **Multiple Clients with Separate Sites but Same Logic**  
You may have multiple separate customers that have their own individual Web sites, but use processing or logic that is identical. This is a truly isolated way to do multi-tenant Web sites where literally everything is separated.

### Local or Remote Duplication
Amongst these scenarios you also need to differentiate between running separate instances on the same physical server/VM or running on separate servers/VMs:

* **Running Same Apps on Separate Servers**  
Physically separating applications on to separate physical servers is obviously cleaner than trying to run the same application multiple times on the same server. You sidestep issues with COM and you also provide a level of redundancy by completely separating out servers. Separate servers are a good idea for fallback sites that mirror the live site and allow fallback. They can also be useful for isolation for separate customers to ensure privacy concerns. 
  
  These days with cheap Virtual Machine hosting it's relative easy and cost-effective to completely isolate instances. This is not what this post is about, but it's probably the easiest way to run a duplicate site under all situations.

* **Running Multiple Sites on the Same Server**  
Running multiple instances of the same application on the same server can be more complicated as there may be some resources that can't easily be shared. File based Web Connection Server apps isolate very well without much effort, but COM based applications are much more complicated due to COM Server limitations that force a single executable to a COM instance. More on this later.

The focus of this post is on hosting the same Web Connection application multiple times on a local machine, as the separate machine scenario is really no different than a single server install.

## Copying a Web Connection Web Site



## Multi-Site Scenarios
The biggest issue with multi-site installations is COM mode. 


### File Based Only
If all your sites are file based things will be pretty easy as you can simply copy your site to a new location and copy files.

### COM Based Main Site, File Based Support Sites
A variation of the file based theme is that you can run your main, Production site in COM mode, and run your support sites 


### File vs. COM Mode
There's a big difference between using COM and File Mode for the multi-instance hosting on the same machine.

### COM Mode Only 
If you need to run all multi-instance sites in COM mode things are considerably more complicated. The main reason for this is that COM Servers that are registered are bound to a **single executable** on disk in Windows.




#### File Based Operation is Easy
File based operation in a multi-instance hosting scenario is easy, because you can easily isolate each application into its own folder tree and simply run them side by side. Because file based uses local folders and uses only folder based related dependencies (at the Web Connection level - you may have shared dependencies in the application itself) you can simply copy and 


## Defining Multiple Servers and Applications
Let me start by defining the scenario more clearly because there are a number of similar situations that involve multiple servers.

### Multiple Instances for a Single Site
The first - and not what the topic of this post is about - is that you Web Connection applications always run multiple server **instances** in production. So when you run an application for Site X on your server you typically have **multiple identical Web Connection Server Instances running simultaneously to serve a single Web Site**.

This is fully supported and built in in Web Connection: You can run multiple File based servers manually or automatically launched, or multiple instances of COM Servers that are automatically launched. This functionality is built in and can be controlled via simple configuration switches in the server configuration files (ie. `web.config`, `wc.ini` or `WebconnectionWebServerSettings.xml`).

### Multiple Web Sites using the same Server Code
The other scenario is the one that is more difficult to pinpoint, which is running the same Web Connection code for multiple completely separate Web Sites which is the focus of this post.

As of Web Connection 6.5 which introduced the new self-contained project system, where all resources related to a project live in well known relative locations to each other, Web Connection projects have become very portable. For the most part you can now **copy a Web Connection Server Application folder to a new location on the same or a completely different machine**  and get it up and running easily. The [automated `yourServer.exe CONFIG` functionality](https://webconnection.west-wind.com/docs/_60s0mj4lj.htm#yourproject.exe-config-command-line) that gets built into the compiled application makes it easy to reconfigure your server for the new location (although you probably have to adjust the server configuration in `yourApp.ini` and the `[ServerConfig]` section).

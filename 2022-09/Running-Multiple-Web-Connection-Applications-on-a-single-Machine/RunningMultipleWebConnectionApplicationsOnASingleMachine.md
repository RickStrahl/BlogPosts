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
Running multiple instances of the same application on the same server can be more complicated depending on whether you run in COM or File Mode. File mode installations are easily moved and copied and **just work** in new locations. COM however is more difficult as COM servers cannot be moved and cannot exist in more than one location - it requires multiple duplicated projects to ensure you can isolate the COM servers for each application. 

The focus of this post is on **hosting the same Web Connection application multiple times on a local machine**. The separate machine scenario is really no different than a setting up and running a single server which is covered by basic install guidelines.

## Copying a Web Connection Web Site
To continue on I will assume the following scenario:

* We have a running Web Site 
* I'll use the wcDemo sample application as an example
* We want to create a second  *Staging* instance of the application

This is a common scenario, so that you have a Production site to run the live application that is customer facing and you have a staging site that you can copy updates to for testing before taking the updates live.


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


* Start with your original Web Connection Server Project
* Unregister the original COM Server (ie. `wcdemo /unregserver`) to remove the original COM server
(also make sure this happens on the server)
* Remove the OLEPUBLIC clause from your wwServer class in the original project
* Copy the Main program (ie. `wcDemoMain.prg`) and rename to `wcDemoMain2.prg`
* Change the class definition to:
    ```foxpro
    DEFINE CLASS wcDemoServer1 from wcDemoServer OLEPUBLIC
    ENDDEFINE
    ```
* Remove all the code below the the class definition.
* At the top of the Main file add SET PROCEDURE TO `wcDemoMain.prg`
* Rename all references to `wcDemoMain` to `wcDemoMain1` in the Main file
* Build the project - twice
* This should pull in all of the framework and process classes and dependencies
* Fix any missing files in the compilation by adding explicitly

If you have referenced all dependencies your project should now build and you should now have one new copy of your COM server.

Now duplicate the steps above for the second and third or X number of servers - each time replacing the name of the server with wcDemoServer2, wcDemoServer3 etc. The projects will be named `wcDemo1`, `wcDemo2` etc. and the main program for each will be `wcDemoMain1`, `wcDemoMain2` etc.

> You can name the servers and support files anything you want - you could go with `wcDemoProduction`, `wcDemoStaging` instead of `wcDemo1`, `wcDemo2`. Just make sure to use consistent naming so that you can keep the names straight - you will end up with a lot of similarly named files so keeping things organized is key. 

Essentially you end up with new EXEs for each of the projects with unique COM Prog Ids for each of the EXEs. 






* 


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

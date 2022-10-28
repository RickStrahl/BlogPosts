---
title: Use ShadowCopyDirectory on IIS with ASP.NET To Avoid WebDeploy Locking Issues
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2022-10-09T11:11:36.1551532-10:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Avoid WebDeploy Locking Errors to IIS with Shadow Copy for ASP.NET Core Apps

If you're self-hosting ASP.NET Core applications on IIS and using WebDeploy to publish to the server, you've very likely run into the dreaded locked file problem on the server. You start to publish to the server, and the publish fails half way through, with an File in Use error because files on the server are locked. 

Regardless of whether you publish from within Visual Studio or you publish from the command line (via `dotnet publish`) you have probably run into this issue:

![](PublishFail.png)

The error is the `ERROR_FILE_IN_USE` which indicates that one of the files - most likely one of the application assemblies is use. Sometimes it's possible to retry and succeed, but at other times this update never succeeds.

## Why are Files Locked Files in ASP.NET Core Applications?
Unlike classic ASP.NET applications, by default ASP.NET Core applications are hosted **in place** when running in IIS, which means that the applications are run out of the location that they are installed. 

Contrast that to classic ASP.NET used shadow copying, where binary files of an application were by default copied to another temporary folder from which the application was then run. ASP.NET then ran a file watcher to determine if files in the binary folder had changed and if so would create a new shadow copy folder, copy the files and then start a new Application Pool from there. Old requests would run out on the old Application Pool, new requests would start up in the new one.

ASP.NET Core by default doesn't do this sort of shadow copying, and instead runs binaries right out of the installation folder which is the 'Web' site install folder.

IIS has a special mechanism to try and unload a running application by copying a special file called  `AppOffline.html` into the root of a Web site, which is supposed to shut down the running application and instead serve the static `AppOffline.html` which can display a message to users that the site is temporarily down. Unfortunately this mechanism is not very reliable - while it can shut down applications in many cases, often it fails to do so if there are request still running in the background or the application has other background tasks. Even for simple applications, in my experience `AppOffline.html` on its own is not reliable to shut down an application at least not in the timely manner required in order for Web deploy to work.

Web Deploy has an option to enable this functionality (not enabled by default which is a head scratcher) in the Publish Profile file:

```xml
 <EnableMsDeployAppOffline>true</EnableMsDeployAppOffline>
```

But as discussed **this is not 100% reliable**.

## Shadow Copying in ASP.NET Core 6.0
The good news is that as of ASP.NET Core 6.0 Shadow copying is back - for now as an experimental feature. However, after implementing this on my own IIS applications I can safely say that it works and I get now reliable deploys that don't get hung up on file locking errors.

This feature is enabled via `<handlerSettings>` in `web.config` and looks like this:

```xml
<aspNetCore processPath=".\Westwind.Webstore.Web.exe" 
            hostingModel="inprocess"
            stdoutLogEnabled="false" 
            stdoutLogFile=".\logs\stdout" >
 <handlerSettings>
   <handlerSetting name="experimentalEnableShadowCopy" value="true" />
   <handlerSetting name="shadowCopyDirectory" value="../ShadowCopyDirectory/" />
 </handlerSettings>
</aspNetCore>
```

This creates a shadow copy folder in this case in the parent folder of the site where several applications can share this common base folder:

![](ShadowCopyFolder.png)

Each application and each 'change' in the application generates a new shadow copy folder. The ASP.NET Core handler figures out whether it needs to create a new shadow copy folder, can reuse an existing one and also cleans up no longer running shadow copy folders.

This works well and has eliminated any publish errors due to file locking from my end. This is a simple fix for an annoying problem and I'm very glad to see Shadow Copying again supported for publishing.

Yay!

## Web Deploy Publishing 101: A quick review
While we're here, let's review the full Web Deploy setup if you're publishing to IIS. The default settings that are set when a new publish profile is created unfortunately don't include some critical options so let's review.

The easiest way to create a new publish profile is to let Visual Studio (or another IDE like Rider) create a profile for you.

**In Visual Studio:**
Right click on your Web project, then select **Publish**


![](WebPublishProfileVisualStudio.png)

You then choose **Web Deploy** as the publish type and fill in your Web site information:

![](WebDeploySiteInfo.png)

You specify the URL of the site that is running 

### A Web Deploy Profile
The interactive tool simply creates a **Publish Profile** file which by default is stored in your project at:

* Properties/PublishProfiles

You can create multiple profiles to multiple servers, so you can easily set up profiles for `Production`, `Staging` etc. 

![](WebDeployProfileInIde.png)






## The Server: Web Deploy Installation
In order to use WebDeploy to publish to the server, Web Deploy has to be installed on the server as it's not a default IIS component. Web Deploy is an IIS addon-component that works in conjunction with IIS, but it runs as an independent service separate from IIS. 

There are a number of places you can get it from:

* [Download from Microsoft Site](https://www.iis.net/downloads/microsoft/web-deploy)
* [Install with Chocolatey](https://community.chocolatey.org/packages/webdeploy)
* Install from the IIS Web Platform Installer (from within the IIS Admin Manager)

Chocolatey is the easiest and quickest as it's a silent install:

```ps
choco install webdeploy
```

If all goes well, Web Deploy installs as a service and the service has to be actively running:

![](WebDeployService.png)

That should do the trick.

> #### @icon-warning Make sure the Service is running
> If for some reason you can't connect to the Web Deploy server, make sure to check that this service is running.
>
> I've noticed in some cases that starting with **Automatic** will fail to start the service properly when the machine starts up, so I recommend using **Automatic (Delayed Start)**. 


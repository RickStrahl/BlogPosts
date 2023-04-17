---
title: Launching FoxPro in a Project Folder
abstract: I work with a lot of different customers that use FoxPro to build applications, and it always amazes me when I see developers launching into their application by starting FoxPro and then explicitly navigating - via `CD` commands or even interactively - to the actual project folder for about a minute. In this post I describe why it's a good idea to build a consistent startup environment for your development setup and some of the ways you can accomplish that task.
categories: FoxPro, Development
keywords: Startup, Configuration, Development, config.fpw, Shortcut, Launch
weblogName: Web Connection Weblog
postId: 9174
dontInferFeaturedImage: false
dontStripH1Header: false
postStatus: publish
featuredImageUrl: https://west-wind.com/wconnect/weblog/imageContent/2023/Launching-FoxPro-in-a-Project-Folder/LaunchBanner.png
postDate: 2023-04-15T11:00:20.5799309-10:00
---
# Launching FoxPro in a Project Folder Consistently

![](LaunchBanner.png)

I work with a lot of different customers that use FoxPro to build applications, and it always amazes me when I see developers launching into their application by starting FoxPro and then explicitly navigating - via `CD` commands or even interactively - to the actual project folder for about a minute.

To me that seems a crazy proposition: When you launch FoxPro you should be able to consistently start in a known configured environment. When you launch via a generic FoxPro command and navigate to the project folder you may or may not get a pre-configured environment that is ready to run your application. 

## Project Configuration
I like to configure projects in such a way that I have a reliable way to start them: 

* In the known project folder location
* With a clean start up environment configured
    * `config.fwp` - Base environment configuration
    * `Startup.prg` - For more complex stuff, launch from `config.fpw` via `COMMAND=`
* Dependency paths added to the `SET PATH` setting
* Common SET Variables set:
    * `EXCLUSIVE OFF`
    * `DELETED ON`
    * `EXACT OFF`
    * `CENTURY ON`
    * `SAFETY OFF`
    * `STRICTDATE 0`
    * `REPROCESS 1 SECOND`
    * `DEBUG ON`
    * `DEVELOPMENT ON`
    * `RESOURCE ON`

Here's what my Web Connection Development startup `config.fpw` looks like for example:

```ini
SCREEN=On
TITLE=West Wind Web Connection 7.32
EXCLUSIVE=OFF
DELETED=ON
EXACT=OFF
DEVELOPMENT=On
DEBUG=ON
SAFETY=OFF
CENTURY=ON
STRICTDATE=0
MEMOWIDTH=200
RESOURCE=ON
REPROCESS="1 second"
RESOURCE=.\FoxUser.Dbf
PATH=.\classes; .\;  .\tools;.\console;.\samples\wwipstuff_samples;.\samples\wwdemo;.\samples\wwdotnetbridge;
COMMAND=DO wcStart
```

Your default environment settings may be different, but the point is that they are defined clearly here in the startup `config.fpw` file.

All of this ensures that **if I start FoxPro out of the project folder** my FoxPro environment will look a very specific way and it's ready to start running my application, without having to do additional configuration or manual folder navigation that takes up valuable seconds development time.

If your environment setup is more complex - say you need to map drives and set up other things I highly recommend you create a `Startup.prg` file that can perform all of those tasks programmatically. In that file you can do anything from setting the environment values that I also set in `config.fpw` but you can also run complex operations like making API calls to mapping drive mappings, or make wwDotnetBridge calls to set other system related settings or get startup information from services on your network or the internet. Anything at all really...

If you are using a complex setup it's probably best you only set development environment related settings in `config.fpw` and let the rest be handled by `Startup.prg`. This is a simpler version that defers to `Startup.prg`

```ini
SCREEN=On
TITLE=My Great Application v1.1
DEVELOPMENT=On
DEBUG=ON
RESOURCE=ON
RESOURCE=.\FoxUser.Dbf
COMMAND=DO Startup.prg
```

The nice thing about a `Startup.prg` file is that you can also run it from within the environment to 'reset' everything. 

> #### @icon-warning Application Configuration is Separate
> It's important **you don't rely solely on external configuration of your environment for your production applications**.  It's one thing to have a development configuration that auto-configures your development setup, but it's quite another for your deployed application running for customers.
>
> It's a good idea to have very clear environment configuration logic **inside of your application**. Whether you include something like `Startup.prg` directly into your application, or whether you create a separate explicit configuration (I typically have an `appName_load.prg` I call as part of my startup), you need to ensure your application can configure itself without any prerequisite environment requirements.
> 
> Nothing pisses customers off more than you saying: Oh you have to start the application out of this folder or you have to make sure that X is set.
>
> **Do whatever possible to make your application self-configurable** even if launched in non-standard situations.

## Launching your Development Project Environment
The key to making all of this work however is to ensure that you start with a clean environment **in the project folder**. This means avoid launching some generic FoxPro instance and then navigating to the project folder. For one, you can't take advantage of the `config.fpw` launch settings which is very useful and serves as a good default environment configuration record. But also if you `CD` into the project folder you may have other environment settings already running, paths configured, libraries loaded into memory that might interfere with your actual application. 

This is why a clean start in the startup folder IMHO is so desirable - you'll know you have a clean environment and you can get quickly back to if for some reason the environment becomes 'corrupted' or heck simple if FoxPro crashes.

So how do you launch your App out of a specific folder? There are a few ways that I use:

* Create a Desktop Shortcut
    * Place the shortcut on the desktop
    * Place a similar shortcut into the project folder (might be slightly different)
    * Web Connection automatically creates a Project Shortcut on the Desktop and in Project Folder
* Use a PowerShell script to launch FoxPro generically in the project folder


### Desktop Shortcut
Desktop Shortcuts are nice for local machines and developer setups because they are easy to launch and visually pleasing if you assign an appropriate icon to it. On the downside shortcuts require hard coded paths to the FoxPro installation, so when you manually create a shortcut you have to find the FoxPro Exe path to use. You'll have to do the same for a custom icon if you don't want the default FoxPro icon.

Here's what the Web Connection project shortcut looks like:

![](WebConnectionDesktopShortcut.png)

**Target:**\
`C:\programs\vfp9\vfp9.exe  -c"D:\WCONNECT\config.fpw`

**Start in:**\
`D:\WCONNECT\`

**Icon:**\
`D:\WCONNECT\wconnect.ico`

Notice that I explcitly provide the startup folder for the project, but also **the explicit path to the project's `config.fpw` file**. This ensures that the specified `config.fpw` is used **and not the default file that might be configured in your FoxPro IDE settings**. This one has bitten me on a number of occasions where my `config.fwp` settings were ignored when I launched out of the project folder, but didn't explicitly provide the  `-c` configuration file override.

You can place a shortcut like this on the desktop or on the Windows Taskbar for quick access on busy projects, and also add it into your project folder.

For example, when Web Connection creates a new project it automatically creates a desktop and project folder shortcut for you. I typically take that shortcut and also drag it into the project folder:

![](ProjectShortcuts.png)

As an aside you can create a desktop shortcut programmatically using the `Wscript.Shell` COM interface:

```foxpro
IF IsComObject("Wscript.Shell")
	*** Create a desktop shortcut
	loScript = create("wscript.Shell")

	lcPath = SYS(5)+CURDIR()

    IF    MessageBox("It's recommended that you use a desktop shortcut"+CHR(13)+;
              "to start Web Connection in order to configure" +CHR(13)+;
              "the development environment on startup."+CHR(13)+CHR(13)+;
              "Do you want to create the shortcut now?",32+4,"West Wind Web Connection") = 6
                  
       	lcDesktopPath = loScript.SpecialFolders("Desktop") 

		loSc = loScript.createShortCut(lcDesktopPath + "\Web Connection.lnk")
		loSC.Description = "West Wind Web Connection"
		loSC.IconLocation = lcPath + "wconnect.ico"
		loSC.WorkingDirectory = lcPath
		loSC.TargetPath = lcVFP
		loSC.Arguments = [ -c"] + lcPath + [config.fpw"]
		loSC.Save()
	ENDIF
	...
ENDIF	
```

### Generic PowerShell Launcher
As nice as a desktop short cut is, it's not portable. It doesn't work with relative paths, and you pretty much have to hard code the path to both the FoxPro IDE and location of the startup folder and config.fpw. This means every time you move the project you have to adjust the shortcut. It's not a huge deal, but if you share your project in a source code repository shortcuts won't work necessarily across machines - in fact you probably should exclude shortcuts from committing into the SCC.

To provide a more generic solution that can:

* Find the FoxPro installation
* Determine the project relative path
* Build an execution command

you need something that can execute some code. Preferably something that can generically retrieve the location of the FoxPro installation. This is pretty easy with PowerShell.

Here's a generic launcher that also gets created into a new Web Connection project:


```powershell
###########################################################
# Project FoxPro Launcher
#########################
#
# This generic script loads FoxPro in the Deploy Folder and
# ensures that config.fpw is loaded to set the environment
#
# This file should live in any Project's Root Folder
###########################################################

$vfp = (Get-ItemProperty -Path "HKLM:\SOFTWARE\Classes\WOW6432Node\CLSID\{002D2B10-C1FA-4193-B134-D86EAECC5250}\LocalServer32")."(Default)"
if ($vfp -eq $null)
{
   Write-Host "Visual FoxPro not found. Please register FoxPro with ``vfp9.exe /regserver``" -ForegroundColor Red
   exit
}

$vfp = $vfp.Replace(" /automation","")
$vfp

cd .\Deploy
$path = [System.IO.Path]::GetFullPath(".\Deploy")
$path

& $vfp -c"$path\config.fpw"

cd ..\
```

This code reads out the FoxPro installation location out of the registry in case installed in a non-default location. Also `Program Files (x32)` may be named differently in different languages so, this is a relevant operation regardless of idiots like me using custom FoxPro install locations :smile:

The registry basically holds the location of the registered FoxPro IDE runtime and this code strips that out from the `/automation` command that COM uses to launch the FoxPro IDE.

The rest of the code then is specific to the Web Connection installation which launches the application out of the `.\Deploy` folder rather than the project root where the `.ps1` script file lives.

![](PowershellLaunchScriptInProject.png)

If you have a recent version of PowerShell Core installed you can use **Run with PowerShell** context menu option to run the command. There are also PowerShell configuration options to allow to run `.ps1` scripts on double click (like `.bat` or `.cmd` - but hey, Windows security idiocy!)

The advantage of the PowerShell is two-fold:

* It's portable across machines as you can use relative paths
* It's text and can be shared in Source Code Repositories


## Summary
Having a clean startup development environment is crucially important, especially if you work with many projects side by side. It saves time, reduces mistakes and is easier to maintain as you don't have to remember random startup and launch instructions.

I work with many customers and it's not uncommon for me to have multiple projects open and running and working on all of them at the same time. With totally isolated development environments that are self-configuring this process is easy.

To those of you that are already doing this you're probably nodding your head and going *Why are you telling me this? It's bloody obvious!* But as I mentioned I see  **a lot of developers** not doing this, and literally firing up either in one standard application, or even the generic Foxpro launch icon and manually navigating and then fiddling with configuration settings.

Even if you're working only on a single project, it's useful to have a simple launch sequence that gets you right into a runnable environment. Don't waste time and keystrokes on navigating on where you have to be or running commands to get the app ready - automate that process. If you're not you're also making it harder for on-boarding of new developers who have to follow the same inconsistent operations.

Do yourself a favor and make sure your environment is easily launchable and runnable, from the moment the FoxPro Command Window comes up...


<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
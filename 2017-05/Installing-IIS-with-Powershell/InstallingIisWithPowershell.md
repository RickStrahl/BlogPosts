---
title: Automating IIS Feature Installation with Powershell
abstract: IIS often gets a bad wrap for being diffcult to install and configure. However, using some of the built-in tooling for administration using PowerShell it's actually quite easy to configure IIS and even set up a new site and application pool with a few short scripts that are much quicker, and more repeatable than using the various Windows UI features. Here's how.
keywords: IIS,Powershell,Automation,Enable-WindowsOptionalFeature,Enable-WindowsFeature
categories: IIS,Windows
weblogName: West Wind Web Log
postId: 249066
---
# Automating IIS Feature Installation with Powershell

![Automagicking](Automation.jpg)

Here's an oldie but goodie, that keeps coming up for me rather frequently. I've been working with IIS on Windows for a loooong time and I have a number of products that go way back that run on IIS. As a result I deal with a lot of support issues around IIS and people who install IIS run an application for years, have their servers eventually break down and then have to reinstall years after their last install. And a lot of times the people who set up the system are long gone.

The chief complaints I hear frequently is that it's a pain to get IIS to install initially with all the right components. I tend to agree - especially on Server versions installing IIS through the insanely **user hostile Server Manager interface** is a pain.

But there's an easier, quicker and repeatable way if you're willing to dive into the command line or create and run a small **Powershell** script.

### Enter Enable-WindowsOptionalFeature
Apparently many people are unaware that in recent versions of Windows - **using Powershell** - you can automate the IIS Features installation using a few simple Powershell Commandlet calls. It's as easy as creating a small PowerShell script file and letting her rip.

##AD##

You can use the [Enable-WindowsOptionalFeature](https://technet.microsoft.com/en-us/library/mt575535(v=wps.620).aspx) command to install IIS Features as well as any other Windows Features. This command works both on desktop and server versions (server versions also have `Enable-WindowsFeature` which has the same effect) and makes it pretty easy to automate an IIS install by whittling away a few commands in a POSH script file.

Here's what I typically use to configure my base version of IIS:

```powershell
# This script installs IIS and the features required to run asp.net applications

# * Make sure you run this script from an Admin Prompt!
# * Make sure Powershell Execution Policy is bypassed to run these scripts:
# * YOU MAY HAVE TO RUN THIS COMMAND PRIOR TO RUNNING THIS SCRIPT!
Set-ExecutionPolicy Bypass -Scope Process

Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpRedirect
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment
Enable-WindowsOptionalFeature -Online -FeatureName IIS-NetFxExtensibility45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HealthAndDiagnostics
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-LoggingLibraries
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestMonitor
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpTracing
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Security
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Performance
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerManagementTools
Enable-WindowsOptionalFeature -Online -FeatureName IIS-IIS6ManagementCompatibility
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Metabase
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementConsole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-BasicAuthentication
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WindowsAuthentication
Enable-WindowsOptionalFeature -Online -FeatureName IIS-StaticContent
Enable-WindowsOptionalFeature -Online -FeatureName IIS-DefaultDocument
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationInit
Enable-WindowsOptionalFeature -Online -FeatureName IIS-NetFxExtensibility45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ISAPIExtensions
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ISAPIFilter
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpCompressionStatic
```

You can tweak and fiddle with the features you actually need for IIS, but the above is pretty standard for my base installs. 

Put the above into a POSH script file (`SetupIIS.ps1`) and then:

* Open a PowerShell command prompt using `Run as Administrator`
* Run the script

### Additional IIS Features
Two more features that I typically use on IIS and aren't directly includable features are **WebDeploy** and **UrlRewrite**. You can install those from the Web Platform installer, or - which is easier in my case - from Chocolatey:

```powershell
choco install webdeploy /y
choco install urlrewrite /y
```
### What Windows Optional Features are Available?
Enable-WindowsOptionalFeature is great, as long as you know what's available. Luckily it's easy to figure out what's available and what's installed and what's not.

#### Check for Installed Features:
```powershell
Get-WindowsOptionalFeature -Online | where {$_.state -eq "Enabled"} | ft -Property featurename
```

#### Check for Features available but Not Installed
```powershell
Get-WindowsOptionalFeature -Online | where {$_.state -eq "Disabled"} | ft -Property featurename
```

#### Disable a Windows Feature
```powershell
Disable-WindowsOptionalFeature -Online -FeatureName IIS-DirectoryBrowsing
```

##AD##

### Create an IIS Application Pool and Web Site
Once IIS is installed you can then configure IIS via more powershell helpers by using the `WebAdministration` powershell module (most like already installed):

```powershell
Import-Module WebAdministration 
```

Once installed it's easy to create a new WebSite and Application Pool.

To create an Application Pool:

```powershell
New-WebAppPool -name "NewWebSiteAppPool"  -force

$appPool = Get-Item -name "NewWebSiteAppPool" 
$appPool.processModel.identityType = "NetworkService"
$appPool.enable32BitAppOnWin64 = 1
$appPool | Set-Item
```

Then to create a Web Site:

```powershell
md "c:\Web Sites\NewWebSite"

# All on one line
$site = $site = new-WebSite -name "NewWebSite" 
                            -PhysicalPath "c:\Web Sites\NewWebSite" 
                            -HostHeader "home2.west-wind.com"
                            -ApplicationPool "NewWebSiteAppPool" 
                            -force
```

### Discover Features with PowerShell ISE
There are obviously a lot more options you can set on these components, but it's easy to find out about those. I also recommend that while you're discovering features, use the **PowerShell ISE shell** (run from the Start menu using **Run as Administrator**) to discover what's available:

![](PowershellISE.png)
<small>**Figure 1** - Powershell ISE lets you get Intellisense on commands and live object instances</small>

The Intellisense in the editor and the command window gives you live property values on commands and even live objects as shown in the Figure 1 which makes it relatively easy to figure out settings. For the rest the various cmd-lets and admin objects are well documented and searchable.

### Summary
None of this is new of course, but it's always good to be reminded that you **can automate** installation and configuration of IIS relatively easily. This is especially true since I just this week I heard from several people how much of a pain IIS can be to install and get up and running. It doesn't have to be this way... the tools are there.
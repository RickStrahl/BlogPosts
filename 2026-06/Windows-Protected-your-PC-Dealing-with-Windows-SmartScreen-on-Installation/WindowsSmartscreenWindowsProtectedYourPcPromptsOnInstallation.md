---
title: 'Windows Protected your PC: Dealing with Windows SmartScreen  on Installation'
abstract: Windows SmartScreen’s "Windows protected your PC" warning often scares users away from legitimate software. This post explores why this reputation-based mechanism triggers—even for signed binaries from established developers—and provides a step-by-step guide for users to bypass the obscured "More info" dialog. It also discusses alternative installation methods, such as WinGet and Chocolatey, to avoid these warnings and improve the user experience for small software vendors.
keywords: SmartScreen, Windows Protected your PC
categories: Markdown Monster, Windows
weblogName: Markdown Monster Blog (BlazePost West Wind)
postId: 1xpe0ed8a2gs
permalink: https://markdownmonster.west-wind.com/blog/posts/2026/Jun/01/Windows-Protected-your-PC-Dealing-with-Windows-SmartScreen-on-Installation
featuredImageUrl: https://markdownmonster.west-wind.com/blog/imageContent/2026/Windows-Protected-your-PC-Dealing-with-Windows-SmartScreen-on-Installation/SmartScreenBanner.jpg
stripH1Header: true
postStatus: publish
postDate: 2026-06-01T14:52:06.3398334-07:00
---
# Windows Protected your PC: Dealing with Windows SmartScreen  on Installation
![Smart Screen Banner](./SmartScreenBanner.jpg)
Windows SmartScreen also known as the  **Windows protected your PC** screen, is a scourge on users and small software publishers as it is a reputation based mechanism that Windows uses to scare people from installing external software. 

And yeah, while it's fine to notify users that software loaded from an Internet download can potentially cause harm, it's a pain to users unfamiliar with how SmartScreen works or how you can bypass it to install software, despite the scary warning because they trust the source.

That said - always do your **Due Diligence** and make sure you trust the vendor and the Web site. If not sure, do your research, check reviews and make sure the software is downloaded from the vendor directly or from a reputable alternate source like a package manager, or a trusted download site.

##AD## 

If you've run into the lovely Blue **Windows protected your PC** screen when installing software from a Web download:

![Windows Smart Blue Screen](./WindowsSmartBlueScreen.png)  
<small>**Figure 1** - A scary SmartScreen dialog when you try to install an application</small>

you know what I mean.

As publisher of small software packages like [Markdown Monster](https://markdownmonster.west-wind.com),  [Documentation Monster](https://documentationmonster.com) and [West Wind WebSurge](https://websurge.west-wind.com) I run into this issue **every single time I upload a new release** for public downloads. These are small vendor software applications and because SmartScreen keys of downloaded files and successful installations, they are very negatively affected by 'scary' SmartScreen popups, scaring off customers when initial versions are posted or updated. If users get scared off they're unlikely to return.

Eventually as reputation of the downloads improves due to successful installations, SmartScreen backs off, but the cycle repeats next time a new version is uploaded. In a couple of words: It sucks!

## Working around the Problem
Before I go into why SmartScreen pushes those prompts on users, let me give you the quick fix for SmartScreen in most scenarios, assuming you want to install the software regardless of the warning.

You can do the following:

![Bypassing Windows SmartScreen](./ByPassingSmartScreen.png)  
<small>**Figure 2** - You can bypass SmartScreen by clicking the not so obvious **More info** link.</small>

SmartScreen in most scenarios gives you the option of bypassing the warning and installing anyway:

* Click on the **More info** Link
* Check and make sure the Installer Signature matches the vendor
* If you're sure you trust the vendor and signature
* Click on the **Run anyway** button

SmartScreen is meant to prevent you from doing a drive-by install of software by bringing up the blue warning screen, letting you know that you are installing **potentially** unsafe software. 

**Fair enough** - if you install software directly from the Internet, it's possible to install unsafe software that can do bad things to your computer and installed software.

I don't have an issue with popping up the warning screen, because that's a legitimate concern. The way it's done - well, that's a different story - as that form is one big scare tactic from the blue screen to the lack of information about **why** you might be careful, and how you should proceed. Instead this window works through obfuscation by seemingly just giving one choice: **Don't run**.

As you've seen you can bypass, but you should most definitely be careful and check the source.


> ##### @icon-warning Make sure you Trust the Vendor!
> You want to make absolutely sure you trust the vendor and the site of the software that you're trying to install. Bad things can happen if you install Malware, and there's no vetting process for any software directly downloaded from the Web.
> 
> If you use the bypass described above, make sure you are familiar with the vendor or the product and check that the signature of the package matches the vendors contact information.
>
> It's good practice when installing software from an unknown vendor, to check reviews or online discussions around the product to ensure the software is legit and comes from a vendor approved download location! There's a surprising amount of information available to let you know if specific software is problematic. Better safe than sorry!

### Better Vetting and Local Installs for Software: Use a Package Manager
One way to have a more secure experience is to install software from the Windows Store (if available) or from a Package Manager like WinGet or [Chocolatey](https://community.chocolatey.org/). These stores and package manager platforms review software before it's published, run malware checks and run through automated tests that check for successful installations and side effects on the system. This process isn't fool proof - but it's often a lot better than installing a random product from a random Web site.

> ##### @icon-lightbulb UniGetUi - A Manager for Windows Store and Package Managers
> If you want to install from any of these sources check out [UniGetUi](https://devolutions.net/unigetui/), which is a free desktop application that lets you search for, install and update software from a number of different stores and package managers. It's a great one-stop tool that lets you hit all sources in one place.

Package managers have an additional advantage over straight downloaded software in that they typically avoid SmartScreen due to Mark of the Web. Because these managers internally download software rather than pulling it down through a browser, installers are run as local executables that don't have a Mark of the Web that triggers SmartScreen (among other things).

Essentially this means, package managers typically bypasses most of the SmartScreen security flags. 

Here are a couple of examples of package managers you can run from the Windows Terminal:

```ps
winget install MarkdownMonster
choco install DocumentationMonster
```

... or you can use UniGetUi if you prefer a GUI application.

All of these package managers and the store include commands to update and list already installed components, which is an additional benefit.

Package Managers provide some basic curation for published packages, doing virus scanning  and associating publishers with products consistently and removing packages and publishers that are problematic quickly. Before packages are published there's some pre-validation happening by the provider that provides to at least a base level of security compared to what you get directly downloading software.

For this to work, software publishers of Software have to ensure that their software is published on these package managers and kept up to date. Unlike Windows Store however, the process of publishing to package managers - while not exactly simple - is usually well defined and can be completely automated making it something that is a viable alternative for downloads for publishers. You often find way more software on the package managers than you will find in the Windows Store because of it's restrictive requirements.

In short, if you're not sure about some software you're trying to download, downloading froma package manager is often the best approach.

All of the West Wind product download pages have links for Chocolatey and WinGet installers as alternatives to the direct download. Even so, I'm always surprised that the vast majority of users are installing directly from the download - I guess there's some trust there which is good :smile:

If you are a vendor linking the various package managers supported on the download page is a good idea, so users that run into problems with your direct download can try the alternate potentially less intrusive package installs.

### Remove Mark-Of-The-Web
Another option is to download installers and explicitly remove the Mark-of-the-Web attached to downloaded binaries and installers.

SmartScreen is triggered among other things by Mark-of-the-Web which indicates that a file was downloaded from the Web. Any file downloaded through a browser interface gets marked and Windows detects this mark changing the security consideration of the file. 

The various package managers avoid Mark-of-the-Web by directly downloading package content and locally unpacking thereby bypassing the Mark-of-the-Web and thus usually get around SmartScreen.

You can also remove this mark yourself on any downloaded file that gives you security issues when downloaded off the Web.

> Unblock-File -Path '.\MarkdownMonsterSetup.exe'

This removes the Mark-Of-The-Web and likely will not trigger SmartScreen on install, even if the required reputation level has not been achieved.

Mark of the Web is not the only criterion but it's a big contributor for SmartScreen popups especially with new downloads.

### Windows Store
Microsoft suggests publishing apps through the Windows Store. Windows Store is a curated platform, and software has to go through a very thorough vetting process. The problem is that this process is both slow and cumbersome and there are a million different rules that have to be followed including some restrictions the software can and can't do in some cases requiring that Windows Store versions have to be dumbed down to be eligible for Store publishing.

Developer and developer adjacent tools in particular have a hard time conforming to all the rules, and the lack of attention by reviewers to real-world concerns in the app publishing process make the Windows Store a time consuming pain in the ass.

I had gone through this process on multiple occasions only to be rejected due to a various shell features that are perfectly adequate for the application and just were rejected outright. Bottom line is that not every product can go into the Windows Store.

I don't have the time or resources to deal with Windows Store deployment, plus for commercial software the model going to the store adds additional complexity and fees again resulting in changes to the application to make the Store work.

In the case of West Wind products the effort is not worth the reward.

## SmartScreen Rant 
As you can tell I'm not a big fan of SmartScreen. Few people - even users - are. I'm not against warning users of the dangers of installing software from the Web or networks in general. But heavy handely and effectively scaring users into avoiding installing software that they might even trust, is something else. And that's really what SmartScreen does.

The issue I have with SmartScreen and its UI are many:

* It doesn't tell you anything other than *"Big Scary Warning, Don't Do it!"*
* The Bypass operation is obscured and totally un-obvious
* Conversely at first glance the only option appears to be **Don't run**
* There's no continuity for the vendor publishing updates -   
  the more frequently you publish, the more painful SmartScreen is

## How does SmartScreen Work
The actual semantics behind how SmartScreen are not officially disclosed by Microsoft, but based on observation I can make some guesses. At the end of the day SmartScreen is a reputation based system.

When updating Markdown Monster to a new Version and immediately downloading and installing it after the new version is live - I always get a SmartScreen dialog when running the installer. After a few hours - and presumably some users that fought their way past SmartScreen, SmartScreen stops showing up. However, your mileage may vary based on your machine or company security policy.

Things that affect SmartScreen popups:

* **Unsigned Binaries and Installers**  
Unsigned installer always trigger Windows SmartScreen. If the publisher has not signed their binary that's usually not a good sign, but it's not uncommon for open source tools, and small utilities. Be extra careful with these types of installations and make sure triple sure you trust the publisher. Do your research!

* **No or few successful Installations**  
SmartScreen is reputation based and as such even a signed binary, that has just been uploaded for download is likely to trigger SmartScreen. As more people download and successfully install the software, SmartScreen stops being so aggressive and allows installation. It appears SmartScreen uses Windows statistics for installations, crashes and uninstalls to determine whether an app is 'stable' and doesn't cause problems.

The problem with the latter Installation counting is that every time an update is shipped, the reputation cycle starts over. There's no continuity over the name of the binary or the certificate used - nothing. Even a vendor like me shipping typically weekly updates of the same software with the same cert for 10 years - same shit each and every time.

For Markdown Monster this is not a huge problem, because the reputation turnaround comes quickly enough due to a fair number of downloads. It also helps that it's geared to a tech savvy audience that presumably knows how to bypass SmartScreen.
  
However, for a new product like Documentation Monster that is relatively unknown and gets only a few downloads, it may never clear the SmartScreen Reputation hurdle between updates because the download count is low. In the meantime SmartScreen's scary warning ensure that many users may never actually install.

New software with a scary blue screen pop up, is simply not a great recipe for getting new users to try out the software for the first time.


##AD##

## Summary
At the end of the day SmartScreen is just something developers and end users have to put up with. It's frustrating that Microsoft has taken such an aggressive approach with SmartScreen rather than providing a more productive approach of providing a Warning Screen with more information and a clearer way to allow for bypassing the warnings when you are sure you want to install anyway.

But alas here we are...

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
---
title: Web Connection 7.02 has been released
abstract: Web Connection 7.02 is here and this post provides a detailed look at most of the new features included in this maintenance update.
keywords: Release Notes,7.02,Web Connection
categories: Web Connection,FoxPro
weblogName: Web Connection Weblog
postId: 948
postDate: 2019-01-24T01:23:56.9400991-10:00
---
# Web Connection 7.02 has been released

![](https://webconnection.west-wind.com/images/WebConnection_Code_Banner.png)

I'm happy to announce that I've released [v7.02 of West Wind Web Connection](https://webconnection.west-wind.com) today. This is primarily a maintenance release that fixes a few small issues that have cropped since the initial 7.0 release, but there are also quite a few new enhancements and small new features. 

You can find Shareware version of Web Connection here:
 
* [West Wind Web Connection Download](https://webconnection.west-wind.com/download.aspx)

If you are a registered user, you should have gotten an email late last week with a download link. I've made a few more small fixes to the release since then, so if you downloaded last week or over the weekend you might want to re-download the latest bits using the same info from the update email.

## Updating to Version 7.02
This release is not a major update and there is only one small breaking change due to a file consolidation. This is first and foremost a maintenance update for the huge 7.0 release, but if you're running 7.0 you should definitely update for the bug fixes. 

Updates are easy and can simply install on top of an existing version, or you can install multiple versions side by side and simply adjust your specific project's path to the appropriate version folders.

### Bug Fixes
First and foremost this release is a maintenance release that fixes a few small but annoying bugs in a number of different aspects of Web Connection. Version 7.0 was a huge drop of new functionality and processes in Web Connection and there were a few small issues that needed fixing as is usually the case when there is a major release.

A **huge shoutout to Mike McDonald** who found and reported quite a few small bugs and posted them on the message board. Mike went above and beyond apparently poking around the Web Connection code base to dig up a few obscure (and a few more serious ones) which have now been fixed. Thanks Mike!

### Setup Improvements
The primary focus of Version 7.x has been to make the development and deployment process of Web Connection easier and the 7.02 continues this focus with a number of Setup and Getting Started related enhancements.

Web Connection now generates a `launch.prg` file for new projects and ships with a `launch.prg` for the sample project. This file is a one stop start mechanism for your application, launching both the Web Connection server during development and the Web Browser. This PRG file also contains the default environment setup (Paths back to the Web Connection installation basically) to make it drop dead easy to run your applications. The file can start either a full local IIS Web Server or launch IIS Express.

To launch with IIS or Apache:

```foxpro
do launch
```

to launch IIS Express:

```foxpro
do launch with .t.
```

The main reason for this file is to make it easier for first time users to make it easier to check out their application. It's also a great way to start your application for the first time after a cold FoxPro start and to ensure that the FoxPro environment is set up properly. The file can be customized too - for example you can add additional path and environment settings that you need for your setup, and you can change the startup path to a page that you are actively developing for quickly jumping into areas you are working on.

There are also improvements in the [BrowserSync functionality to automatically refresh Web pages](https://webconnection.west-wind.com/docs/_5cc1a6ads.htm) when you make changes to the Web content files. This was introduced in v7.0 and the default template has been improved for more reliable operation.

The Setup now also explicitly prompts for IIS or IIS Express setup when installing to remind people explicitly that a Web Server has to be installed **before** Web Connection is installed.

I've also spent quite a bit of time updating the Getting Started documentation to reflect some of these changes so the Setup docs, and the Getting Started tutorial all are updated for easier usage.

### Updated Sample Applications
The West Wind Message Board and WebLog applications are fully functional sample applications that are in use on the West Wind site. Both have been updated to MVC Style scripting application from their original WebControl bases. The Message Board was updated for v7.0 and there have been a number of additional enhancements including a few nice editor updates, much better image compression on uploaded images and search enhancements. The WebLog has been completely reworked and simplified to MVC style scripts for the application.

The [Message Board is available as an installable sample application on Github](https://webconnection.west-wind.com/docs/_0190ic5zn.htm) while the WebLog sample ships in the box with Web Connection as before.

### New wwDynamic Class
There's also new useful feature in the form of a [wwDynamic Class](https://webconnection.west-wind.com/docs/_5ck0pf06k.htm) which lets you dynamically create a FoxPro class, simply by adding properties to it. This is similiar to using the FoxPro `EMPTY` class with `ADDPROPERTY()`, except you don't actually have to use that cumbersome syntax. The class also supports an `AddProperty()` method that can automatically set up the special character casing required for JSON Serialization. The `.AddProperty()` of the class automatically creates a `_PropertyOverrides` property that is utilized during JSON serialization to handle proper casing instead of the lower case default used otherwise.

Here's an example of using the wwDynamic class to create a type 'on the fly':

```foxpro
*** Extend an existing object
loCust = CREATEOBJECT("cCustomer")
loItem = CREATEOBJECT("wwDynamic",loCust)

*** Alternately you create a new object (EMPTY class) 
* loItem = CREATEOBJECT("wwDynamic")

loItem.Bogus = "This is bogus"
loItem.Entered = DATETIME()

? loItem.Bogus
? loItem.Entered

loItem.oChild.Bogus = "Child Bogus"
loItem.oChild.Entered = DATETIME()

? loItem.oChild.Bogus
? loItem.oChild.Entered

*** Access original cCustomer props
? loItem.cFirstName
? loItem.cLastName
? loItem.GetFullName()
```

For properly typed names with casing left intact for JSON Serialization `.AddProperty()` can be used:

```fox
loMessage = CREATEOBJECT("wwDynamic")
loMessage.AddProp("Sid", "")
loMessage.AddProp("DateCreated", DATETIME())
loMessage.AddProp("DateUpdated", DATETIME())
loMessage.AddProp("DateSent",DATETIME())
loMessage.AddProp("AccountSid","")
loMessage.AddProp("ApiVersion","")

* "Sid,DateCreated,DateUpdated,DateSent,AccountSid,ApiVersion"
? loMessage.__PropertyNameOverrides 

? loMessage.DateCreated
? loMessage.DateUpdated

loSer = CREATEOBJECT("wwJsonSerializer")
loSer.
loSer.Serialize(loMessage) && produces properly cased property names
```

Note I got the idea of this from [Marco Plaza on the Universal Thread](https://www.levelextreme.com/ViewPageGenericLogin.aspx?LoadContainer=1&NoThread=1662805) who came up with this idea and provides a library with a slightly different implementation that is a little more verbose, but provides a more pure data implementation. `wwDynamic` takes a more pragmatic approach that focuses on the ease of use in code, but there are a couple of edge cases due to FoxPro's weird handling of a few reserved property names.


### A few wwHttp Enhancements 
There are also a couple of enhancements in wwHttp. The first is some additional control over file uploads by adding some additional parameters to [.AddPostKey()](https://webconnection.west-wind.com/docs/_0jj1afxk3.htm) when posting multi-part form variables and specifically files. 

`.AddPostKey()` now supports additional `tcContentType` and `tcExtraHeaders` parameters that allow you to specify a content type and additional Mime headers to the content. Extra headers are added as self-contained lines. Files now also add a `content-length` header to the attached file.

```foxpro
loHttp = CREATEOBJECT("wwHttp")
loHttp.nHttpPostMode = 2  && multi-part
loHttp.AddPostKey("txtNotes","Image of a wave")

*** Add content type and 
loHttp.AddPostKey("File",".\wave.jpg",.T.,"image/jpeg","x-file-id: 451a423df")

lcResult = loHttp.Post(lcUrl)
```
The `wwHttp` class now also adds new explicit methods for `.Get()`, `.Post()`,`.Put()` and `.Delete()`. These are simply wrappers around the existing `.HttpGet()` that set the `cHttpVerb

### New wwUtils Path Functions that support Proper Case Paths
Added several new methods the wwUtils library that deal with returning filenames with proper paths. FoxPro's native path functions have the nasty habit of mangling paths to upper case, and in several applications this has caused me a number of issues with paths getting embedded with non-matching case. This can be problematic for Web Content that might end up on a case sensitive Linux server.

There's are now [GetFullPath()](https://webconnection.west-wind.com/docs/_5cd14mrru.htm), [GetRelativePath()](https://webconnection.west-wind.com/docs/_5dv1f19wc.htm), [OpenFileDialog()](https://webconnection.west-wind.com/docs/_5dv1fcrmc.htm) and [SaveFileDialog()](https://webconnection.west-wind.com/docs/_5dv1f9axn.htm) functions that all return paths in the proper case from files located or created on disk.

The `OpenFileDialog()` and `SaveFileDialog()` functions provide Windows File Open and File Save dialogs using the .NET file dialogs. All of the new methods use .NET code to provide the properly cased paths.

Interesting that it is so hard to translate paths into properly cased paths in Windows. I noodled around with various Windows API calls but it turns out they all have a few odd quirks that make them not work reliably especially for figuring out a relative path. 

In the end the easiest solution was to call into .NET and rely on a combination of Path and URL helper system calls to provide the functionality here. Even the .NET code is not as straight forward as it could be. For me this was a requirement for a documentation application I've been working on for a customer where generated HTML output image links had to exactly match the and pathnames on disk. This also fixes a similar issue for me in [Html Help Builder](https://helpbuilder.west-wind.com) where traditionally paths were embedded as all lower case.

### All Web Connection Binaries are now Signed
All Web Connection Binaries that are shipped - the setup and console exes, all dlls and the setup self-extracting package - are now properly signed with a digital certificate to verify the authenticity of the binaries as coming from West Wind Technologies. The signed exes should help with reducing nasty warning messages from Windows and SmartScreen and provide a nicer, less scary elevation prompt that also displays the West Wind source of the code instead of an anonymous binary name.

## Summary
As you can see there's quite a bit of new stuff in this small point release. Behind the scenes Web Connection now also has a more reliable build process to compile each release, which has traditionally been very time consuming to me because of all the varied pieces pulled in. This release is the first that uses a fully automated end to end build process that completes in about 20 seconds. It won't make it quicker to fix errors and add new features, but it will make it much easier to release updates if we should find a breaking issue. Plan on seeing more frequent releases with smaller amount of changes in the future.

Check it out and as always **please post any issues that you might run into on the [Message Board](https://support.west-wind.com)**.

See you there...

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
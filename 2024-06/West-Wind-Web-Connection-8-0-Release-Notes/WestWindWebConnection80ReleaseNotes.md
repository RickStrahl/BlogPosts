---
title: West Wind Web Connection 8.0 Release Notes
featuredImageUrl: https://webconnection.west-wind.com/images/WebConnection_Code_Banner.png
abstract: Web Connection 8.0 is here and this is the official release post for this new version.
keywords: Web Connection
categories: Web Connection
weblogName: Web Connection Weblog
postId: 9179
postDate: 2024-06-25T14:05:49.8773958-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# West Wind Web Connection 8.0 Release Notes

[![Web Connection Logo](https://webconnection.west-wind.com/images/WebConnection_Code_Banner.png)](https://webconnection.west-wind.com)

It's been a bit and [Web Connection is turning 8.0](https://webconnection.west-wind.com)! After six years of incremental improvements it's time to rev Web Connection to its next major version. 

Although this is a major version release that has a number of significant updates, there is only one specialized feature (FTP) affected with [breaking changes](https://webconnection.west-wind.com/docs/_s8104dggl.htm#breaking-changes-in-v8.0), so if you're upgrading from a v7 version, upgrades should be quick and easy like most other minor version updates.

For the last few years, the focus of Web Connection has been on continuous, small incremental feature enhancements and improvements around the development and administration process. So rather than huge, disruptive major releases updates, there have been gradual updates that come integrated one small piece at a time to avoid the big version shocks. This version rollover release has a bit more in the update department, but still follows the incremental improvement model and other than a single breaking change with the new FtpClient classes, this release has no breaking changes from recent v7 releases.

## Links and Upgrades
Before we get into what's new, here are the links for the latest release, purchase and upgrade:

* [Web Connection Home](https://webconnection.west-wind.com)  
You can find the download for the Shareware version here.

* [Buy a Web Connection License](https://store.west-wind.com/product/wconnect80)  
Purchase a full developer and 1 server license for Web Connection.

* [Buy a Web Connection Upgrade *(from any version)*](https://store.west-wind.com/product/wconnect80_UP)  
Purchase an upgrade for any version of Web Connection. All versions back to 1.x are allowed.

> ##### Existing Runtime License Upgrades
> Runtime licenses don't have specific upgrade SKUs, but can still be upgraded at 50% of the full price. For upgrade runtime license purchases, pick a full runtime license and then apply the Promo Code: RUNTIME_UPGRADE if you qualify. **This only applies only to Runtime Updates** not to version updates or new purchases. Use this code with a single item of the Runtime you wish to upgrade only.

> ##### Free Upgrade if purchased after July 1st, 2023
> If you purchased Web Connection 7.x on or after July 1st, 2023 you can upgrade for free until the end of 2024. Use promo code: `FREE_UPGRADE`.  Use this code on an order with a single item of the Web Connection Upgrade only.

*@icon-info-circle **Note**: Upgrades are always verified and these promo codes **apply only to the specific upgradable item**.  Please use these specialized Promo Codes only on orders that qualify based on the two descriptions above. If you use these codes with other types of upgrades or orders your order will be rejected. We reserve the right to refuse upgrades based on non-conforming orders.*

## What's new

Let's take a look what's new in this release:

* [COM Server Management Improvements](#com-server-management-improvements)
* [Improved Web Connection Server Error Logging](#improved-web-connection-server-error-logging)
* [New FTPClient Classes](#new-ftpclient-classes)
* [New wwZipArchive Class](#new-wwziparchive-class)
* [REST Service Token Authentication Support](#rest-service-token-authentication-support)
* [wwRestProcess.lRawResponse Helper Property](#wwrestprocesslrawresponse-helper-property)
* [wwDotnetBridge Improvements](#wwdotnetbridge-improvements)
* [JSON and REST Client Improvements](#json-and-rest-service-improvements-in-recent-versions)
* [wwCache Improvements](#wwcache-improvements)

More info on what's new in recent releases check out the [What's New Page](https://webconnection.west-wind.com/docs/_s8104dggl.htm) in the documentation.


## COM Server Management Improvements
For deployed applications Web Connection should be run in COM mode, and COM mode includes an internal instance pool manager that makes it possible to effectively run FoxPro single threaded servers in a multi-threaded environment with simultaneous request handling. Getting the single threaded (or STA threaded really) FoxPro to behave in pure multi-threaded environment of .NET is a complex matter and involves a lot of trickery to make it work **consistently and reliably**. 

In this release the COM Pool manager has seen a major refactoring:

* Faster, parallelized Server Loading and Unloading
* Servers are available as soon as they load
* Reliable loading and unloading  
* No more double loading or unloading
* All instance exes are released on unload (no more orphaned servers)
* Improved error logging especially in detail mode

Web Connection has a long history of using COM Servers for production environments and while the technology and the implementation worked really well over the years all the way back to ISAPI, .NET, and now .NET Core, there have always been a few rough edges when it comes to server loading and unloading especially in very busy and high instance environments. 

This release addresses these issue with a completely new pipeline for COM server loading and unloading that is reliable and - as a bonus - much quicker through parallelization of the load and unload processes.

You can get an idea of load/unload performance in this screen capture which demonstrates 5 server instances under heavy load from a [West Wind WebSurge](https://websurge.west-wind.com/) load test run, with the server pool constantly being loaded, unloaded, run as a single instance and the Application Pool being restarted:

![Web Connection Server Loading and Unloading](https://github.com/RickStrahl/ImageDrop/blob/master/WebConnection/ServerLoading.gif?raw=true)  
<small>**Figure 1** - Web Connection COM Server Loading and Unloading Improvements</small>

You can see that server loading is very fast, and if you look closely you can see instances immediately processing requests as the servers load, while the rest of the pool is still loading. 

Servers are now loaded in parallel rather than sequentially which results in servers loading much quicker than previously. Additionally, servers are available immediately as soon as they enter the pool, while others are still loading. Previously the load process was blocked and sequential loading caused a potentially significant delay before processing could start. This doesn't matter much if you're running a few instances, but if you're running 10 or as many as 40 instances as one of our customers does, startup time can be a significant issue.

Additionally we fixed some related issues that in some cases caused double loading of server instances. Because the COM server load process first unloads before loading new instances, it was possible previously to end up in a scenario where instances were asking to unload while new instances where already loading. All of these issues have been addressed in the latest release with some creative thread management - ah, the joys of multi-threaded development :smile:

The changes have been made both the Web Connection .NET Module and the Web Connection .NET Core Web Server. 

> ##### @icon-info-circle The Web Connection .NET Core Web Server
> The **Web Connection .NET Core Web Server** was introduced with Web Connection 7.0  primarily as a tool to allow you develop locally without IIS. But it also to allows you **distribute a local Web server with your own applications** that let you effectively **build and distribute local Web Applications** that can run on a desktop machine. The .NET Core server middleware also supports running inside of IIS (if you want consistency between dev and production) and can even be used on non-Windows platforms like Linux either as a standalone Web server or a behind a reverse proxy server like NginX *(but the FoxPro code still has to run on Windows)*. 

## Improved Web Connection Server Error Logging
In the process of updating the Web Connection server connectors we've also reviewed and updated the server logging that goes into the `wcerrors.txt` logs. We've cleaned up the error logging so that non-detail mode doesn't log anything but critical messages and errors - previously there were some ambiguous trace messages that often came up in discussion on the forums, but weren't actual errors. These have been removed, and you should now see a mostly blank `wcerrors.txt` file in normal operation, **except if you start having problems with your servers**.

Detail logging (`LogDetail` true in the configuration) logs a lot of error and non-error information into the log including request start and stop operations, request timings, application start and much more detailed error information on errors.

Detail mode now always shows the request id and thread information  (if available) to more easily correlate requests in a busy error log.

![Web Connection Error Logging](https://support.west-wind.com/PostImages/2024/_DeXLe3mgo4PCybNL.png)  
<small>**Figure 2** - Web Connection Detail Error Logging </small>

You'll also notice that the actual request completion or call error is marked with a `*** ` prefix so it's more easily visible in the noise. The `***` entries are either a completed request or the actual request processing error message that occurred during the COM call.

## New FTPClient Classes
This release has a completely new set of FTPClient classes that replace the old `wwFtp` and `wwSFTP` classes. The new version uses a .NET based interface instead of the legacy WinInet features that are somewhat limited in that they didn't support the `FTPS` (FTP over TLS) protocol which to be frank makes them useless in today's environment where secure connections are a requirement.

The new version relies on two .NET libraries:

* FluentFtp  (for FTP and FTPS)
* SSH.NET (for SFTP)

We've been using SSH.NET previously for SFTP support, but FluentFtp integration is new, and it provides for the new `FTPS` support in Web Connection (and the [West Wind Client Tools](https://client-tools.west-wind.com)).

The new classes are:

* [wwFtpClient](https://webconnection.west-wind.com/docs/_6wp0mrz80.htm) (FTP and FTPS)
* [wwSFtpClient](https://webconnection.west-wind.com/docs/_6wr0zm6jd.htm) (SFTP)

The two classes have the exact same API surface except for connection information which is slightly different for SFTP which requires SSH keys or configuration files instead of username and password for standard FTP.

The new classes follow a similar interface to the old connection based  `wwFTP`/`wwFTPS` classes, so if you used them with `Connect()`... FTP Operation... `Close()` operations the syntax will be identical and easy to upgrade. In most cases you should be able to simply change the class name - ie. change `CREATEOBJECT("wwFtp")` to `CREATEOBJECT("wwFtpClient")`.

What's missing from the old `wwFtp` and `wwsftp` classes are the single method FTP operations for uploading and downloading. These were awkward to use with their long parameter lists anyway and the class based interface is cleaner to use anyway. The old `wwFtp` and `wwSftp` classes are still shipped in the `\classes\OldFiles` folder and can still be used - just copy them into your path and they'll work like before.

To demonstrate the new FtpClient functionality, here's an example that runs through most operations supported:

```foxpro
CLEAR
DO wwFtpClient
DO wwUtils   && for display purposes only

loFtp  = CREATEOBJECT("wwFtpClient")
loFtp.lUseTls = .T.
loFtp.cLogFile = "c:\temp\ftp.log" && verbose log - leave empty
loFtp.lIgnoreCertificateErrors = .F.   && self-signed cert not installed


*** cServer can be "someserver.com", "someserver.com:22", "123.213.222.111"
lcServer =  INPUTBOX("Server Domain/IP")
IF EMPTY(lcServer)
   RETURN
ENDIF

lcUsername = InputBox("User name")
IF EMPTY(lcUsername)
   RETURN
ENDIF

lcPassword = GetPassword("Password")
IF EMPTY(lcPassword)
	RETURN
ENDIF

*** Progress Events - class below
loFtp.oProgressEventObject = CREATEOBJECT("FtpClientProgressEvents")

loFtp.cServer = lcServer
loFtp.cUsername = lcUsername
loFtp.cPassword = lcPassword
*loFtp.nPort = 21 && only needed if custom port is required

IF !loFtp.Connect()
	? loFtp.cErrorMsg
	RETURN
ENDIF
? "Connected to " + lcServer	

loFtp.Exists("Tools/jsMinifier1.zip")


IF !loFtp.DownloadFile("Tools/jsMinifier.zip", "c:\temp\jsMinifier.zip")
	? loFtp.cErrorMsg
	RETURN
ENDIF	
? "Downloaded " + "Tools/jsMinifier.zip"

lcUploadFile = "Tools/jsMinifier" + SYS(2015) + ".zip"
IF !loFtp.UploadFile("c:\temp\jsMinifier.zip", lcUploadFile)
	? loFtp.cErrorMsg
	RETURN
ENDIF
? "Uploaded " + lcuploadFile

*** provide a folder name (no wildcards)
loCol = loFtp.ListFiles("/Tools")
IF ISNULL(locol)
   ? "Error: " + loFtp.cErrorMsg
   RETURN
ENDIF   
? TRANSFORM(loCol.Count ) + " matching file(s)"
? loFtp.cErrorMsg
FOR EACH loFile IN loCol FOXOBJECT
   IF ( AT("jsMinifier_",loFile.Name) = 1)
	   ? loFtp.oBridge.ToJson(loFile)  && for kicks print out as json
	   IF loFtp.DeleteFile(loFile.FullName)
	      ? "Deleted " + loFile.FullName
	   ENDIF
	   
   ENDIF
ENDFOR

loFiles = loFtp.ListFiles("/Tools")
FOR EACH loFile in loFiles
   ? loFile.Name + " " + TRANSFORM(loFile.LastWriteTime)
ENDFOR

* loFtp.Close()  && automatic when released

RETURN


DEFINE class FtpClientProgressEvents as Custom

FUNCTION OnFtpBufferUpdate(lnPercent, lnDownloadedBytes, lcRemotePath, lcMode)
  lcMsg = lcMode + ": " + TRANSFORM(lnPercent) + "% complete. " + lcRemotePath + " - " + TRANSFORM(lnDownloadedBytes) + " bytes"
  ? "*** " + lcMsg
ENDFUNC

ENDDEFINE 
```

## [New wwZipArchive Class](https://webconnection.west-wind.com/docs/_6ww0y5kqq.htm)
This release also has a new ZipArchive class that provides more control over zip functionality using modern, native .NET and built-in functionality that removes the old dependency on Dynazip libraries. 

The new class provides the ability to add files to existing zip files and iterate and retrieve files individually. 

```foxpro
CLEAR
DO wwZipArchive

loZip = CREATEOBJECT("wwZipArchive")
lcZipFile = "d:\temp\zipFiles.zip"

*** Zip up a folder with multiple wildcards
*** 
IF !loZip.ZipFiles(;
   lcZipFile,;
   "*.fpw,*.vc?,*.dll,*.h",;  
   CURDIR(),;
   .T., .T.)
   ? "Zipping Error: " + loZip.cErrorMsg
   RETURN
ENDIF   
? loZip.cErrorMsg
   
*** add a single file   
IF !loZip.AppendFiles(lcZipFile, "wwZipArchive.prg")
   ? "Error: " + loZip.cErrorMsg
   RETURN
ENDIF
   
*** Unzip into a folder   
IF !loZip.UnzipFolder(lcZipFile, "d:\temp\Unzipped1")
   ? "Unzip Error: " + loZip.cErrorMsg
   RETURN
ENDIF

*** Look at all files in the zip   
loEntries = loZip.GetZipEntries(lcZipFile)
IF ISNULL(loEntries)
   ? "No entries:  " + loZip.cErrorMsg
   RETURN 
ENDIF
? loEntries.Count

*** Iterate through the collection
FOR EACH loEntry IN loEntries FoxObject     
	? loEntry.Name + "  " + ;
	  loEntry.Fullname + " " + ;
	  TRANSFORM(loEntry.Length) + " - " + ;
	  TRANSFORM(loEntry.CompressedLength)
ENDFOR   

*** Unzip an individual entry and unzip it - first in this case
loZip.UnzipFile(lcZipFile, loEntries[1].FullName, "d:\temp\" + loEntries[1].Name)
```

These functions use wwDotnetBridge and built-in .NET framework features for zipping files. Note that one thing missing here is support for encrypted Zip files which is not supported by the .NET APIs.

The old `ZipFiles()` and `UnzipFiles()` in `wwAPI.prg` are still available as well, but you need to make sure you have the `dzip.dll` and `dunzip.dll` files available in your distribution.

## [REST Service Token Authentication Support](https://webconnection.west-wind.com/docs/_6rc0lbyfk.htm)
Unlike standard wwProcess classes, wwRestProcess does not work with standard session cookies and by default all session support is turned off. However, you can enable session support via Bearer Token authentication which reads a user supplied identity token from the Authorization HTTP header.

There are two mechanisms available:

* [InitTokenSession](https://webconnection.west-wind.com/docs/_6r60zs1wr.htm)    
This method is the core feature that ties a generated token to a Web Connection wwSession object via its cSessionId parameter. `InitTokenSession()` either retrieves an existing session from a provided Bearer token, or if one isn't provided or matched provides an empty session. To create a new Token you can have a custom sign in method and call NewSession() to map your custom user/customer/etc. to a session with a session holding any additional data.

* [Authenticate()](https://webconnection.west-wind.com/docs/_6r619bpu9.htm)  
If you want basic mapping of the session to a user in a similar way to the way HTML authentication works with cookies you can use the Authenticate() method which serves a dual purpose for:
    * Validating a wwSession Token and Loading a User
    * Authenticating user credentials

`InitTokenSession()` is the low level function that checks for bearer tokens and maps them onto a wwSession object. It generates new tokens on every request but only stores them if you explicitly save them in a sign in request. To see if a user has a previous approved token you can check `!Session.lIsNewSession`. This is pretty low level but provides to core feature of token management and whether a user has a token that matches an existing token.

```foxpro
FUNCTION OnProcessInit
...

*** Pick up existing token or create a new token
*** and set on the oSession object
THIS.InitTokenSession()

*** Define anonymous requests that don't need validation
lcScriptName = LOWER(JUSTFNAME(Request.GetPhysicalPath()))
llIgnoreLoginRequest = INLIST(lcScriptName,"testpage","signin")

*** Fail if no token and not a passthrough request
IF !llIgnoreLoginRequest AND this.oSession.lIsNewSession
   THIS.ErrorResponse("Access Denied. Please sign in first.","401 Unauthorized")
   RETURN .F.
ENDIF

RETURN .T.
```

`Authenticate()` maps on top of that functionality by taking a mapped token and mapping it to an UserSecurity object, providing all the familiar User Security features like the `.oUser`, `lIsAuthenticated`, `cAuthenticatedUser` etc. properties on the `wwProcess` class.

```foxpro
FUNCTION OnProcessInit
...

*** IMPORTANT: InitTokenSession is required to pick up the Bearer token
***            and load or create a new session
THIS.InitTokenSession()

*** Check for pages that should bypass auth - signin always (not signout though!)
lcScriptName = LOWER(JUSTFNAME(Request.GetPhysicalPath()))
llIgnoreLoginRequest = INLIST(lcScriptName,"testage","signin")

IF !llIgnoreLoginRequest
   *** Check for Authentication here based on the token (note no parameters)
   IF !this.Authenticate()   
	   THIS.ErrorResponse("Access Denied. Please sign in first.","401 Unauthorized")
	   RETURN .F. && Response is handled
   ENDIF
ENDIF

*** One you're here you can now acccess these anywhere in your process code:
llIsLoggedin = this.lIsAuthenticated
lcUsername = this.cAuthenticatedUser
loUser = this.oUser

RETURN .T.
```

Choose the `Authenticate()` approach if you need to know who your users are explicitly. Use the `InitTokenSession()` if you only need to know that they are have signed in and are validated. `Authenticate()` tries to map the token to a user and there are several overloads of this method with various parameter signatures. You can also override these methods with custom behavior for mapping users to tokens.

Beyond those two approaches you still need to actually validate a user via some sort of sign in operation that authenticates a user and then creates the actual token.  This can be another endpoint or it could be an oAuth operation or even a standard Web page.

The following uses a REST endpoint in an existing API (ie. part of the REST service):

```foxpro
FUNCTION Signin
LPARAMETER loCredentials

*** Load some business object (or plain DAL code) that can authorize a user
loBus = CREATEOBJECT("cUser")

*** Use whatever custom Authorization you need to assign a token
IF !loBus.AuthorizeUser(loCredentials.UserName, loCredentials.Password)
   RETURN THIS.ErrorResponse(loBus.cErrorMsg,"401 Unauthorized")
ENDIF

*** Create a new Session and optionally assign a mapping user id
*** that links back to a user/customer record in the Application
lcToken = THIS.oSession.NewSession(loBus.oData.UserId)
THIS.oSession.SetSessionVar("tenant",loBus.oData.TenantId)
THIS.oSession.SetSessionVar("displayname",loBus.oData.dispName)
THIS.oSession.Save()  && Must explicitly save to Db


*** Return the token and expiration (or whatever you choose)
loToken = CREATEOBJECT("EMPTY")
ADDPROPERTY(loToken,"token", lcToken)
ADDPROPERTY(loToken,"expires", DATETIME() + 3600 * 24)

RETURN loToken  
* Returns JSON: { token: "<token>", expires: "2023-10-23T07:00:00Z" }
ENDFUNC
```

The focus behind this code is to create a new token with `Session.NewSession()` and then saving it into the session table. 

The token is then returned to the client, who will then use it to pass in the `Bearer ` token `Authorization` headers with their REST client requests. Something akin to this in FoxPro code:

```foxpro
loHttp = CREATEOBJECT("wwHttp")
loHttp.AddHeader("Authorization","Bearer " + lcToken)
lcJson = loHttp.Get(lcUrl)
```

All of this is designed to make it easier to create REST services that can authenticate without having to re-build a bunch of infrastructure. Instead this stuff re-uses what Web Connection already provides and exposes it to the newer REST service infrastructure with a couple of relative simple constructs you can add to your REST service with a few lines of code.

## wwRestProcess.lRawResponse Helper Property
Speaking of REST services here's a small, but frequently used feature: There's now a `Process.lRawResponse` property that can be set to to `.t.` to return a raw, non-JSON response from a REST method. That functionality was always available via the `JsonService.IsRawResponse`, but it's a bit easier to set it on the local class instance.

So you can do the following in a REST method now:

```foxpro
FUNCTION ReturnPdf()

THIS.lRawResponse = .T.
Response.ContentType = "application/pdf"

 lcFilename = THIS.ResolvePath("~/policy.pdf") 

*** Send from memory - string/blob
lcFile = FILETOSTR(lcFilename)
Response.BinaryWrite( lcFile )

*** OR: Send from file
*!* Response.TransmitFile(lcFilename,"application/pdf")

ENDFUNC
```

## wwDotnetBridge Improvements
There are a number of small tweaks to wwDotnetBridge as well in this release:

* **[wwDotnetBridge.GetPropertyRaw()](VFPS://Topic/_6VO0PU6U2) and [ComArray.ItemRaw()](VFPS://Topic/_6VO0P9YVG)**  
Overridden methods that allow for retrieval of property values in raw format that bypass the usual FoxPro fix-ups that ensure type safe values are returned to FoxPro. Useful in scenarios where the values are sometimes in ComValue or ComArray that can be accessed directly, or in scenarios where types have dual meaning (ie. char with raw number vs. string fix-up or Guid with raw binary vs. string fix-up).

* **[ComArray.GetInstanceTypeName()](VFPS://Topic/_6VO0OEM1H) and [ComArray.GetItemTypename()](VFPS://Topic/_6VO0OF6WL) helpers**  
Added a couple of helpers to the ComArray class to provide type information about the Array instance and it's client types for debugging or testing purposes. This can be useful to determine whether the `.Instance` member can be accessed directly via FoxPro code (many .NET collections cannot and require intermediary operations provided by ComArray or wwDotnetBridge).

* **[wwDotnetBridge::DisposeInstance() to explicitly release Object Dependencies](VFPS://Topic/_6WZ0YZHBV)**  
This method explicitly release `IDisposable` object instances by calling `.Dispose()`. Since `.Dispose()` tends to be an overloaded virtual property you typically can't call it directly on a .NET reference instance, so this method helps making a direct call rather than calling `InvokeMethod()`.

* **[wwDotnetBridge: Improved support for Task Exception Handling](VFPS://Topic/_5PJ0XL2YP)**  
When making calls to .NET `async` or `Task` methods, wwDotnetBridge now does a better job of handling exceptions and returning the result in the `OnError()` callback. More errors are handled and error messages should be more consistent with the actual error (rather than a generic error and an innerException).

## Json and REST Service Improvements in recent versions

* **wwJsonSerializer Deserialization Performance Improvements**  
Optimized the .NET parsing of the deserialized object graph for improved performance. Also fixed a few small issues that previously could result in naming conflicts that FoxPro couldn't deal with. Fixed a small issue with UTC dates when `AssumeUtcDates` (ie. passthrough as-is dates) is set.

* **wwJsonSerializer no longer uses PropertyExclusionList on EMPTY Object**  
When serializing `EMPTY` objects, or by association cursors and collections which internally use `EMPTY` objects, the `PropertyExclusionList` is not applied to properties. The list is meant to keep FoxPro default properties from polluting the output JSON, but EMPTY objects do not have any base properties, so the list is not necessary. This allows for creating properties with reserved FoxPro property names like `Comment`, `Name`, `Classname` etc.

* **Fix: wwJsonSerializer::AssumeUtcDates Output still converting to Local**  
Fixed issue that when this flag was set, it would not convert the inbound date from local to UTC but use the current date as UTC, but it would still convert the date back to local when deserializing. This change now leaves the deserialized date in the original UTC time, but returns it as a local FoxPro time (ie. the date is not adjusted for timezone) which was the original assumption of this flag. This was broken when we switched from FoxPro based parsing to .NET parsing using JSON.NET. **This is a potentially breaking change if you used this obscure flag in your code**.

* **wwJsonServiceClient CallService Url Fix up**  
You can now use a site relative URL by specifying a `cServiceBaseUrl` before calling `CallService()` which allows you to use site relative paths for the URL. You can use Urls like `/authenticate` which makes it easier to switch between different host sites. If the URL does not start with `http://` or `http://`, the `cServiceBaseUrl` is prepended to the URL to create a full URL. This is useful if you switch between different sites such as running against different servers for dev, staging and production servers.

* **wwJsonServiceClient: Optionally capture Request and Response Data** 
You can now optionally capture all request and response data via the `lSaveRequestData` flag. If set any POSTed JSON data will be capture in `cRequestData` and any result data is capture in `cResponseData` both of which are useful for debugging.

* **wwJsonServiceClient is abstracted into its own PRG File**  
wwJsonServiceClient now has migrated out of the `wwJsonSerializer.prg` file to its own `wwJsonServiceClient.prg` file. This is a minor breaking change - you'll need to make sure `DO wwJsonServiceClient` is called explicitly now to ensure the library is loaded along with all dependencies.

* **wwJsonServiceClient CallService Url Fix up**  
You can now use a site relative URL by specifying a `cServiceBaseUrl` before calling `CallService()` which allows you to use site relative paths for the URL. You can use Urls like `/authenticate` which makes it easier to switch between different host sites. If the URL does not start with `http://` or `http://`, the `cServiceBaseUrl` is prepended to the URL to create a full URL. This is useful if you switch between different sites such as running against different servers for dev, staging and production servers.

* **Fix: wwJsonService UTF-8 Encoding/Decoding**   
Fixed inconsistencies in UTF-8 encoding by the service client. Now data sent is encoded and data received is decoded. Optional parameters allow disabling this auto en/decoding.


## wwCache Improvements
wwCache is an old component in Web Connection that is internally used to cache certain bits of information in a local cursor. It's a great way to cache generated output or any string based value that you don't want to repeatedly regenerate or calculate out.



The class gains a few common method that were previously missing:  `Clear()` that clears the cache and closes the underlying cache cursor to avoid excessive memo bloat and `GetOrAddItem()` that combines retrieving an existing value, or setting a new one into the cache in one step.

Note that in Web Connection the cache object is always available as `Server.oCache`:

```foxpro
PRIVATE pcToc

*** Retrieve a cached TOC or generate one
pcToc = Server.oCache.GetOrAddItem("Toc",GenerateToc(),3600)

*** pcToc can now be embedded into the template
Response.ExpandTemplate("~\toc.wcs")
```

## Summary
Overall this major version release has no  groundbreaking new features, but there are a number of significant and useful enhancements. I think the COM server features in particular are going to be very useful to those of you running busy sites on Web Connection.

As we go forward Web Connection will continue to do incremental updates of features and roll them into minor release updates, rather than providing big bang new versions with massive amount of changes that few will use due to feature overload :smile:.

As always with new releases, please, please report any issues you encounter on the [message board](https://support.west-wind.com).


Aloha,

+++ Rick ---
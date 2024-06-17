---
title: West Wind Client Tools 8.0 Release Notes
abstract: West Wind Client Tools 8.0 has released as a major version rollup release. Here's all that's new and fixed.
keywords: West Wind Client Tools, FTP,FTPS,SFTP,JSON,REST
categories: FoxPro
weblogName: Web Connection Weblog
postId: 9177
postDate: 2024-05-30T10:19:04.3074554-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# West Wind Client Tools 8.0 Release Notes

We've released v8.0 of the West Wind Client Tools. Although this is a major version update, this is not a huge release although there are a few noteworthy changes in the libraries that may require attention when upgrading. It's been 6+ years since the last release and there have been many improvements since so this release can be thought of as a version rollup release more than anything.

There are a few new features in this update however:

* Refactored FTP Support for FTP, FTPS (FTP over TLS) and SFTP
* New ZipFolder()/UnzipFolder() functionality 
* Many improvements to wwDotnetBridge
* Many functional and performance improvements in wwJsonSerializer

## Upgrading
This is a major version upgrade, so this is a paid upgrade. 

You can upgrade in the store:

* [West Wind Client Tools Upgrade](https://store.west-wind.com/product/wwClient80_up)
* [West Wind Client Tools](https://store.west-wind.com/product/wwClient80)

> If you purchased v7 on or after June 1st, 2023 (a year ago) you can upgrade for free until the end of the year, otherwise an upgrade is required for the new version (details on the upgrade link).

## Refactored FTP Support
The FTP support in Web Connection and the Client Tools has been pretty creaky for years. The original FTP support was built ontop of the built-in Windows WinINET services. Unfortunately those services do not support secure FTP communication so we've always lacked support for FTPS (FTP over TLS). Some years ago I added the wwSFtp class to provide support SFtp (FTP over SSH) which mitigated some of the deficiencies, but FTPS tends to be pretty common as some popular servers like Filezilla Server use FTPS.

Long story short, in order to support FTPS I added a new `wwFtpClient` class that supports both plain FTP and FTPS in a more reliable manner. This new implementation is built ontop of a popular .NET FTP library that is more accessible, considerably faster, provides for logging and provides much better error handling in case of failures. The new `wwFtpClient` is considerably simpler than the old `wwFTP` class as it does away with all the WinINET related baggage. As such the model for `wwFtpClient` is simply:

* Connect()
* Run Ftp Commands
* Close()

and those are the only interfaces supported. You can:

* Download
* Upload
* DeleteFile
* MoveFile
* ListFiles
* ChangeDirectory
* CreateDirectory
* RemoveDirectory
* ExecuteCommand

The methods are simple and easier to use.

Along the same vein I've also replaced the `wwSFTP` class with `wwSFtpClient` which uses the exact same interface as `wwFtpClient` so both classes can be used nearly interchangeably. There some small differences in how connections can be assigned but otherwise both classes operate identically - the old classes were similar but not identical. The `wwSFtpClient` class uses the same SSH.NET .NET library as before, although it's been rev'd to the latest version. 

The old `wwFtp` and `wwSFtp` classes are still available in the `OldFiles` folder and they continue to work, but the recommendation is to update to the new classes if possible as they are easier to use and more reliable with more supported types of connections (for wwFtpClient).


## ZipFolder() and UnzipFolder()
ZipFolder() is a new library function in `wwAPI` that provides zipping functionality from a folder using the built in Windows zip services, meaning there are no external dependencies on additional libraries. These functions use .NET to handle the Zipping interface, which removes the dependency on the old DynaZip dlls.

The old `ZipFiles()` and `UnZipFiles()` functions are still available, but they continue to require the dzip/dunzip/zlib1 dlls. 

## wwDotnet Bridge Improvements
The last few release of wwDotnetBridge have seen a number of improvements on how result values are passed back to .NET fixing up more types so that they work in .NET. There has been a lot of work around Collection access related to the `ComArray` class that is returned for lists and collections. The new `AddItem()` method makes it easy to add items to a collection effectively and `AddDictionaryItem()` makes it easy to added to key and value  collections. There are also some improvements on how ComArray .NET instances are managed and can be accessed that results in additional use cases that did not previously work in some scenarios. 

Additionally there's been some work to clean up how exceptions are handled and returned in error messages which should result in cleaner error messages without COM artifacts gunking up the message text. We've also fixed exception handling for Task Async operations - exceptions are now returned from failed task operations, rather than the generic failure that was returned prior.

### JSON and REST Service Calls
The wwJsonSerializer is probably one of the more popular Client Tools components and it's getting a few new features in this release. There have been many tweaks in the last couple releases. One has been to optimize `EMPTY` object serialization by skipping the exclusion list which is meant to prevent FoxPro base properties from rendering which can improve performance significantly on large lists. There are now options for how dates are handled either as local or UTC dates based on the incoming data's date formatting. 

The JsonSerivceClient gets the ability to capture request and response data optionally which can be useful for debugging or logging/auditing.

## Breaking Changes? No Except for FTP
Although this is a major version update, there are no breaking changes other than the new FTP classes. And for those you can continue to use the older `wwFtp` and `wwSFtp` classes if necessary.

You will have to make sure to update your DLL dependencies however, so make sure you update:

* wwipstuff.dll
* wwDotnetBridge.dll
* Newtonsoft.Json.dll  
* FluentFtp.dll   (for wwFtpClient)
* Renci.SshNet.dll  (for wwSFtpClient)


+++ Rick ---
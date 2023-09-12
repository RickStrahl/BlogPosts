---
title: Sharing Tab Missing in Windows Folder Properties
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2023-09-09T11:08:45.2037352-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Sharing Tab Missing in Windows Folder Properties
Leaving this here for my own reference as I keep running into this on new Windows 11 installations. 

For unfathomable reasons it seems that Windows 11 is actively discouraging the sharing tab in Windows and is not displaying it.

I'm talking about this tab:

![Sharing Tab in Windows](SharingTabInWindows.png)

## Enabling Folder/Drive Sharing in the Registry
If this Tab is not showing in your Explorer Properties the easiest way is via a registry update:

* Check HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Shell  * Extensions\Blocked
* Check for {f81e9010-6ea4-11ce-a7ff-00aa003ca9f6}
* Remove if present
* Reboot or Kill and Restart Explorer

As the name suggests this feature is actively **blocked** and it appears that this is the new default in Windows 11.

## Ensuring File Sharing works
If you want external machines to access your machine you need to additionally ensure that you have Windows File sharing enabled in your network configuration.




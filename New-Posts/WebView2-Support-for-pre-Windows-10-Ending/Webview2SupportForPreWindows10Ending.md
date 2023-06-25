---
title: WebView2 Support for pre-Windows 10 Ending
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2023-06-06T10:11:47.8621583-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# WebView2 Support for pre-Windows 10 Ending

Due to changes in the underlying Chromium engine that the WebView Runtime and WebView SDK libraries are based on, the WebView2 control will no longer work on older versions of Windows prior to Windows 10. 

The messaging on this is a bit confusing - according to some Microsoft documents support should already have been discontinued, but it turns out there's some respite with WebView runtime releases leading up to 1900 release numbers (currently we're at `v114.0.1823` - release number last). Once that release number hits 1900 hits 1900 support for pre-Windows 10 will be gone.

## What does that mean for Apps
Older versions of Windows however already have issues with the WebView as you can no longer install the latest versions of the WebView runtime on them. I ran into this with several customers of Markdown Monster who were complaining that the WebView Runtime installs would error (but not fail) without a clear warning. 

It turns out if you try to install a new version of the WebView on a Windows 7 machine it starts and says that it can't install the WebView runtime and leaves whatever runtime is already installed in place. No mention of what is wrong.
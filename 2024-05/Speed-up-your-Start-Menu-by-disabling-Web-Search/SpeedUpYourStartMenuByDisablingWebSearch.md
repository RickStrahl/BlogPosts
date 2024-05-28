---
title: Speed up your Start Menu by disabling Web Search
featuredImageUrl: https://weblog.west-wind.com/images/2024/Speed-up-your-Start-Menu-by-disabling-Web-Search/PostBanner.png
abstract: "If you're like me, you've probably cursed the Windows Start menu from time to time, when it's either very slow to pop up, or in some instances fails to pop up at all when you press the Windows key. This simple tip can drastically improve performance of your Windows Start Menu by simply disabling Web search. "
keywords: Windows, Start Menu, Web Search
categories: Windows
weblogName: West Wind Web Log
postId: 4381163
permalink: https://weblog.west-wind.com/posts/2024/May/03/Speed-up-your-Start-Menu-by-disabling-Web-Search
postDate: 2024-05-03T20:53:30.6095848-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Speed up your Start Menu by disabling Web Search

![Post Banner](PostBanner.png)

I ran into a great tip yesterday on X, that is too good not to pass on and also to serve as a reminder for myself next time I install Windows:

<blockquote class="twitter-tweet" data-theme="dark"><p lang="en" dir="ltr">Holy hannah! Disabling web search on the start menu makes it so much faster and effective. No lag at all anymore! <br><br>HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Search <br><br>Make a new DWORD (32-bit) called: BingSearchEnabled<br><br>Ensure the value = 0</p>&mdash; Albert Thomas, Cooling Reviewer (@ultrawide219) <a href="https://twitter.com/ultrawide219/status/1786104392753766466?ref_src=twsrc%5Etfw">May 2, 2024</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

And yeah, it really is a **huge improvement**! I've occasionally had issues with delayed opening of the start menu or sometimes the menu not opening at all and requiring multiple hits of the Windows key - even on an otherwise blazing fast machine. It's always been kind of random, and it makes sense now that it was probably tied to a temporary slow or high latency Internet connection.

Well, no more. With the simple registry hack the start menu now pops up instantly and there are no more 'misses'.

Note that setting this key will turn off Web search in the start menu, so if you want to use Web Search in the Start Menu, don't use this hack. Personally, I **never** want to see a Web search in the start menu, I just want the thing to be as fast as possible so I can drive search driven access to programs, folders and other resources on my local machine. I'll use a Web browser when I want a Web search - thank you very much!

##AD##

## Setting the Registry Value
Here's what that looks like in the registry:

![Disable Bing Search In The Registry](DisableBingSearchInTheRegistry.png)

To set the key via Powershell:

```ps
New-ItemProperty HKCU:\Software\Microsoft\Windows\CurrentVersion\Search -Name "BingSearchEnabled" -Value "0" -PropertyType dword
```

or use a .reg file or copy and paste the key directly into the registry:

```
Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Search]
"BingSearchEnabled"=dword:00000000
```

Leaving this here, mainly as a point of reference for future me for the next time I install Windows...

##AD##
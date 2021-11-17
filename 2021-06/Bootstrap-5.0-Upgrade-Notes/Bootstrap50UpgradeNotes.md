---
title: Bootstrap 5.0 Upgrade Notes
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2021-06-26T14:40:42.5144955-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Bootstrap 5.0 Upgrade Notes
I spent a bit of time with an older Web Site over the last few days and as part of that process I ended up upgrading to Bootstrap 5.0 from my previous version 4.0 installation. I'm writing down some notes both for my own reference in future updates, but some of you might also find this useful if you're upgrading. This isn't meant to a be complete guide by any means - it simply deals with the components and features that I use most commonly.

## Overall Upgrade Observations
For the most part Bootstrap 5.0 is fairly compatible with previous versions.  There have been a few top level CSS name changes that are aimed at providing more consistent CSS names for operations and a few relatively small layout changes.

I don't use Bootstrap components with code very much - mostly for modals - but if you do, there's some work involved as Bootstrap scrapped jQuery and now uses plain JavaScript for it's code based interactions. The code is still very easy to use and very similar to the jQuery code, but it will require manual code changes.


## Search and Replace Changes: -left -right to -start -end
Bootstrap 5.0 now supports RTL functionality so layouts can work better with locales that use Right to Left display. Because right and left in different RTL modes have different meaning all CSS names that used to refer to to left and right like `float-left` and `ml-2` have changed to use `-start` and `-end` instead of `-left` and `-right`.

This seems like a small item but for me this was the cause of tons of layout breaks as I use `float-right` quite bit to force items to the end of the layout. Other things like `ml-1` and `pr-2` now become `ms-1` and `me-2` again use `s` (for start) and `e` for end instead of `l` for left and `r` for right.

The good news is that for the most part these items can be simply replaced with a global file search and replace operation (with manual review for each, I recommend!).

## 


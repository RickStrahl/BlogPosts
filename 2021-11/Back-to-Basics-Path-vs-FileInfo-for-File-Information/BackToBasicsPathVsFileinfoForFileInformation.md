---
title: 'Back to Basics: Path vs FileInfo for File Information'
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2021-11-08T10:24:22.8206080-10:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Back to Basics: Path vs FileInfo for File Information

Local file information operations are common in desktop applications that deal with user managed local files. Basically any application where users can create file names, you are likely to have code where you need to deal with file information, to check for file interactions, locations, validating locations etc.

In [Markdown Monster](https://markdownmonster.west-wind.com/), which is a generic Markdown Editor, there are lots of scenarios where users create and save new files, not just from new Markdown Documents but also for linking related resources or pasting images into documents. For all of these operations there tend to be a number of file validations like:

* Check for certain file extensions to figure out syntax
* Check for file locations
* Generating new documents (like PDF or HTML output)
* Fixing up paths to match relative paths in an application

and more.

## System.IO.Path vs. FileInfo
If you're like me your first line of operation likely tends to be using `System.IO.Path` which has a plethora of file info operations



---
title: Getting NuGet Packaging Right
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2023-08-13T12:23:40.0735795-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Getting NuGet Packaging Right

NuGet is a package manager platform that makes it easy to share .NET code for a variety of purposes. Developers can publish and consume code libraries and executable cross-platform tools via `dotnet tool` and it's relatively easy to create a NuGet package from a compiled project.

While it's very easy to get packages created and published, getting all the support pieces into the package is a little bit more involved in cryptic, and so for my own reference and sanity I'm writing it down so I have it all in one place as a sort of check list for creating a NuGet package properly.


## Creating a Package via the Project

## Including Debug Information

## Adding a License and Icon

## Summary, Description or Readme

### Publishing a Readme.md File

* Keep the Markdown simple 
* Make sure all images are fully qualified direct urls (no querystrings
)
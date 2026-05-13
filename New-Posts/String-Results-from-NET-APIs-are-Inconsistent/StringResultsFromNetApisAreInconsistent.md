---
title: String Results from .NET APIs are Inconsistent
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2026-05-06T09:18:28.1594525-07:00
postStatus: publish
dontInferFeaturedImage: false
stripH1Header: true
---
# String Results from .NET APIs are Inconsistent
One thing that's always bugged me about ASP.NET's Web  APIs  is how they deal with string results.

If you create a controller or minimal based API and return a string result the result can behave differently than just about any other result. 

By default ASP.NET defaults API calls to be called with a `Accept: application/json` header. If that header is missing - which is often the case, all results - except for strings - are returned as JSON by default.

However, if the `Accept:` header is missing on the request, the result is returned as `text/plain` string result.

Here are a couple of examples:


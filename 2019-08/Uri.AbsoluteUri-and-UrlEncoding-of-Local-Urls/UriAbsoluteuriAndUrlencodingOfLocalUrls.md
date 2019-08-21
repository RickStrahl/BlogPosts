---
title: Uri.AbsoluteUri and UrlEncoding of Local File Urls
abstract: Ran into an interesting problem with the Uri class and local file URLs today. The problem is that Urls were not properly Url encoding and decoding with the Url treated incorrectly. After a bit of experimenting it turns out that the way the file URL is created is critical to the Url parsing behavior of the Uri class.
keywords: .NET,Uri,UrlDecoding,Local File,AbsoluteUri
categories: .NET
weblogName: West Wind Web Log
postId: 1363332
permalink: https://weblog.west-wind.com/posts/2019/Aug/20/UriAbsoluteUri-and-UrlEncoding-of-Local-File-Urls
postDate: 2019-08-20T13:34:51.6653618-07:00
---
# Uri.AbsoluteUri and UrlEncoding of Local File Urls

I have a love/hate relationship with the `System.Uri` class. It's great when it works as you expect, but I've had a few of battles related to Url encoding and decoding and in this post I'll point out one oddity that bit me today.

### Url Combining
I frequently use the Uri class to build Urls, both for Web Urls as well as for local Urls. Specifically I commonly use it to normalize relative URLs into absolute Urls or vice versa. One very nice thing about the URI class is that it **also works with file paths** so it can be quite useful into combining paths and encoding/decoding the URL formatting which is quite useful if you're embedding local file links into things like Markdown documents (imagine that!).

### Local file:/// Urls
This particular issue affects `file:///` urls and it concerns different behavior for Url Encoding depending on **how** a file URL is initialized in the Uri class.

My specific scenario in code is that in [Markdown Monster](https://markdownmonster.west-wind.com) I have an output generation class that dumps a generated HTML document as a self contained file to disk by pulling in all related resources and embedding them directly into one large  document. To do this a document relative path is required, which in this case I build up using the URI class. I use Uri because the relative path may be relative to an online `https://` resource **or** a local file. If the path is relative it's assumed to be relative to the current document, and I use the URI class to combine the base path with the relative path.

Seems straight forward enough:

```cs
// assign base path initially from a filename
var basePath = Path.GetDirectoryName(doc.Filename);
this.BaseUri = new Uri(basePath);

...

// then figure out relative path to retrieve resources
else // Relative Path
{
    var uri = new Uri(BaseUri, url);
    var url = uri.AbsoluteUri;  // here things go awry!
    
    if (url.StartsWith("http"))
    {
        var http = new WebClient();
        imageData = http.DownloadData(uri.AbsoluteUri);
    }
    else
    
        imageData = File.ReadAllBytes(uri.LocalPath);
    
}
```

Unfortunately, this code runs into a serious problem with the Url Encoding:

![](BadEncoding.png)


Specifically when combining the URLs, the second URL is added as a literal string and not considered as encoded. The result is that the `%20` space encoding is encoded as `%2520` - basically encoding the `%` and writing out the `20` after that. IOW, the input is treated as a raw unencoded string.

### Uri Constructor: Scheme Matters
After a bit of experimenting it turns out that the problem is **how the Uri instance is initialized from a string**. Specifically, the protocol - or lack thereof - determines how the Uri is treated for `file:///` urls.

In the example code above I essentially assigned the Uri like this:

```cs
var baseUri = new Uri("c:\\temp\\");
```

which demonstrates the problem by doing:


```cs

var part1 = new Uri("C:\\temp\\"); // double encodes when combining parts 
var part2 = "assets/Image%20File.jpg";


var uri = new Uri(part1, part2);
uri.Dump();  // shows correctly as it shows original url

url = uri.AbsoluteUri;  // Wrong: file:///c:/temp/Image%2520File.jpg 
url.Dump();
```	

It turns out that this can be fixed by **explicitly providing the local file scheme** as part of the base Uri assignment. So changing the baseUri to:

```cs
var baseUri = new Uri("file:///" + "c:\\temp\\");
```

now correctly returns the 

```cs
url = uri.AbsoluteUri;  // Right: `file:///c:/temp/Image%20File.jpg` 
url.Dump();

uri.LocalPath.Dump();   // Right: c:\temp\Image File.jpg
```	

Now I'm not sure **why** this is but presumably assigning the base Uri without an explicit scheme doesn't correctly brand the Uri as an escaped url, whereas using the scheme prefix does.

Looking at the content of the Uri instance's properties I don't see any difference between the two other than the level of escaping which is odd.

### Fixing the Problem
So then to fix my problem in code I can now do:

```cs
// assign base path initially from a filename
var basePath = Path.GetDirectoryName(doc.Filename);
this.BaseUri = new Uri($"file:///{basePath}");

var uri = new Uri(BaseUri, partialUrlPath);
```

and the code now correctly escapes and unescapes in a predictable manner. Note that `basePath` is a standard Windows OS path with backwards slashes but because the `file:///` protocol is specified the Uri constructor properly fixes up the Uri so it works.

I can then simply use `uri.LocalPath` to retrieve the full, unescaped filename:

```cs
imageData = File.ReadAllBytes(uri.LocalPath);
```

If you want to play around and see the behavior differences between the two assignment modes I've put my simple LINQPad tests [in a .NET Fiddle](https://dotnetfiddle.net/o6hIp9).


### Relevant Uri Path Properties
For reference, here's a summary of some of the path relative Uri properties and whether they are encoded or not:

| Uri Member   | UrlEncoded | Functionality                            |
|--------------|------------|------------------------------------------|
| AbsoluteUri  | Yes        | Fully qualified escaped URL              |
| AbsolutePath | Yes        | File: Escaped file path with `/` path separators  <br>Web: Escaped site relative path |
| LocalPath    | No         | For file URLs: Unescaped local file path with `file:///` prefix stripped.<br>For Web URLs: Unescaped site relative path. |
| .ToString()  | No         | Fully qualified URL with all UrlEncoding removed.   |

### Summary
This isn't the first time I've tangoed with the `Uri` class in regards to url encoding and url formatting. The way Urls are assigned and how UrlEncoding works is not always obvious, and in this case it outright caused my application to break because of an untested scenario (spaces in Urls specificially). I still don't understand why the behavior of the non-file scheme'd url doesn't work the same, since the Uri class properly identifies the Url as a file Url in both cases. But alas - it works as it does and by making sure to explicitly prefix the `file:///` scheme the behavior becomes as expected.
  
### Resources
* [.NET Fiddle Demonstration](https://dotnetfiddle.net/o6hIp9)

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
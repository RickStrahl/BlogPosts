---
title: Mapping Multiple Static File Folders in ASP.NET Core
abstract: Recently I needed to map an external folder as a 'virtual' directory in an ASP.NET Core application to include externally added content into the main Web application. ASP.NET Core's Static File Middleware provides easy mapping of a folder for static file serving, but it's not so obvious to add additional folders for static file serving. In this post I'll show you how to do this and a few other thoughts around this topic most common when physically hosting on a server.
categories: ASP.NET
keywords: StaticFile Middleware,Folder,Mapping,Virtual,UseStaticFiles
weblogName: West Wind Web Log
postId: 3380325
dontInferFeaturedImage: false
dontStripH1Header: false
postStatus: publish
featuredImageUrl: https://weblog.west-wind.com/images/2022/Using-multiple-Mapped-Static-Folders-in-ASP.NET-Core/SplitIntheRoad.jpg
permalink: https://weblog.west-wind.com/posts/2022/Aug/23/Mapping-Multiple-Static-File-Folders-in-ASPNET-Core
postDate: 2022-08-23T16:40:09.7787381-07:00
---
# Mapping Multiple Static File Folders in ASP.NET Core

![](SplitIntheRoad.jpg)

Recently I had a need to map an external folder holding static files to an ASP.NET Core application. Specifically in one of my applications images are loaded from an externally mapped location which can be either a local file share or - optionally an external Web site.

On a live deployed application this location might be an external content site altogether or - as is the case for my local dev setup and first run - a locally mapped drive.

## Static Files in ASP.NET Core
In ASP.NET it's easy to serve static files by using `app.UseStaticFiles()` as part of configuration. This simple configuration maps the `wwwroot` folder to the the `/` path and serves any content from that folder as static content, prior to processing other application middle ware like Razor Pages, Minimal APIs, MVC etc.

Static files are set up as part of configuration in `program.cs` (or `startup.cs` in pre-6.0 versions).


```csharp
app.UseStaticFiles()

// Make sure .UseStaticFiles is used *before* other middleware
app.UseRazorPages()
```

Typically `.UseStaticFiles()` is all you need to serve static files out of the default `wwwroot` folder - the middleware handles serving the files and providing many common features for serving files.

##AD##

Some features of that static files middleware are:

* Maps `wwwroot` as your Home root for static files  
*(any static files in in this folder are processed as static content)*
* Maps most common Mime Types
* Handles private and public caching and cache expiration


> #### @icon-info-circle Set this Middleware before MVC or other Routing EndPoint Middleware
> Static files need to be routed before a terminating application handler like Razor Pages, Minimal APIs or MVC are accessed so that static files can be found and take precedence. Failing to do so can result in MVC routes picking up file URLs and mis-routing.

## Mapping a Local Folder to ASP.NET Core's Static File Provider
That's all nice and good, but what if you have **multiple folders** that need to be mapped individually either for forcing specific 'route' values, or simply because the files are not part of the `wwwroot` folder hierarchy?

For example, you might have some external resources that you want mapped into a 'virtual' folder below the Web site root. For example, in my app I need an images folder that holds images that are uploaded to the server and are stored externally of the Web application itself.

It's not very obvious, but you can **chain multiple .UseStaticFiles() commands**, each with it's own configuration settings effectively letting you map **virtual folders of static files** to a local folder on disk.

```csharp
app
    // default wwwroot mapping
    .UseStaticFiles()
    // custom mapping to an external folder
    .UseStaticFiles(new StaticFileOptions()
    {
        FileProvider = new PhysicalFileProvider(
                System.IO.Path.GetFullPath(wsApp.Configuration.ProductImageUploadFilePath)),
        RequestPath = new PathString("/product-images"),
        DefaultContentType = "application/octet-stream"
    });
```

Sweet - nice and simple.

### Using the Mapped Virtual Path
In effect this provides a 'virtual path' to the static files - you're virtually mapping a Web path `/product-images` to a physical folder on disk. So any Url into the `/product-images` folder now works as expected:

```html
<img src="~/product-images/markdownmonster.png" />
```

This works great and it's easy enough to implement once you know to double up the `.UseStaticFiles()` operation. Yay!

## Mapping or Something Else?
Inevitably somebody's going to comment that *"hey don't store data on the same server as the application and certainly not **in** the application's folder hierarchy*". That's good advice to avoid maintenance issues later!

In my current use case the folder mapping as described, was driven by a need for porting over an existing application that stores images locally on disk with images uploaded to server and stored in a folder. The old (ASP.NET Classic) app used a local folder for this and that worked fine because the application was (and still is) stationary and parked on a single machine. But this new application while still running on a physical server with a stationary disk, is deployed with publishing that is intent on replacing all application content **completely** (via WebDeploy from `dotnet publish` in this case). Using an external folder avoids the WebDeploy overwrite problem (which is a bug it seems as exclusions are not working) and in turn provides a better separation of application and 'data' into two separate locations.

### Alternatives
There are many other alternatives:

* **Store images in the Database**  
Easy enough to do and in this case maybe even appropriate as there are only a very limited number of images used. The advantage is that the images travel with the data and in this case the overhead is likely not so bad. But - there's overhead in running images through application requests compared to static files on disk - personally I prefer to just use files or other Web resources.

* **Let IIS or other Front End WebS Server do the Work**  
If externally mapping folders on Windows and IIS the most efficient approach might be to add a mapping in IIS (or whatever Web server). We can create a virtual directory in the Web site and map the folder in IIS to take advantage of the efficient caching and static resource serving that IIS does natively. I like this approach and it works for this scenario as the sites are stationary and don't get completed re-deployed (incremental updates).

* **Cloud Storage**  
Another option is to use a cloud storage provider or host images on a static site in some completely separate location. The trick is the images have to be updatable. Heck one could even use a Git repository and commit uploaded files then serve through git. This is a good solution for externalizing content, but it adds complexity in the form of image uploads and requires adding yet another set of credentials to the application to connect to the external site for updates.

##AD##

So rather than accessing product images directly, they are always pre-fixed by configuration setting value that holds the image location:

```html
<img src="@(wsApp.Configuration.ProductImagePath)markdownmonster.png" />
```

where the value is stored as:

```cs
// values are stored in AppConfiguration.json or external JSON file
public string ProductImagePath {get; set; } = "/product-images/";

// or a full Web or Storage Url
public string ProductImagePath {get; set; } = "https://store-images.west-wind.com/";
```

Nothing too exciting, but something to consider if you end up going down the path of an externally mapped virtual path as described here.

## Summary
Adding a second 'virtual' path to an ASP.NET Core Web site using the Static File middleware isn't very obvious. I spent some time looking at all the wrong ways to add file providers, which involved trying to get multiple file providers attached to the default middleware configuration options. That's possible - you can map multiple folders, however the virtual folder mappings mysteriously lack the Web path assignment, so realistically this feature simply allows you to map multiple physical folders to the one virtual folder.

In the end the non-obvious solution is to create multiple `.UseStaticFiles()` configurations with each mapping their own distinct virtual path. Easy enough, just not very discoverable. 

Well, now we know and hopefully we'll be able to find the reference again in the future...

## Resources

* [Static File Middleware Docs](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/static-files)

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
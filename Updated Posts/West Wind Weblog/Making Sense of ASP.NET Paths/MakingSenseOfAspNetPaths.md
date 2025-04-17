---
title: Making Sense of ASP.NET Paths
abstract: ASP.NET includes a plethora of functions and utilities to retrieve information about the current requests and paths in general. So much so that it's often hard to remember exactly which path property or method you are actually looking for. This update to an old and very popular post from this blog summarizes many of the paths and path related operations that are available in ASP.NET.
categories: ASP.NET
keywords: Path,Virtual,Root
weblogName: West Wind Web Log
postId: 132081
permalink: https://weblog.west-wind.com/posts/2009/Dec/21/Making-Sense-of-ASPNET-Paths
postDate: 2018-05-01T12:20:12.8880894-10:00
---
# Making Sense of ASP.NET Paths



ASP.Net includes quite a plethora of properties to retrieve path information about the current request, control and application. There's a ton of information available about paths on the Request object, some of it appearing to overlap and some of it buried several levels down, and it can be confusing to find just the right path that you are looking for.

To keep things straight I thought it a good idea to summarize the path options along with descriptions and example paths. I wrote a post about this a long time ago in 2004 and I find myself frequently going back to that page to quickly figure out which path I’m looking for in processing the current URL. Apparently **a lot** of people must be doing the same, because the original post is the second most visited even to this date on this blog to the tune of nearly 500 hits per day. So, I decided to update and expand a bit on the original post with a little more information and clarification based on the original comments.

### Request Object Paths Available

Here's a list of the Path related properties on the Request object (and the Page object). Assume a path like _http://www.west-wind.com/webstore/admin/paths.aspx_ for the paths below where webstore is the name of the virtual.

|**Request Property**     | **Description and Value** 
|-------------------------|-----------------------------
| ApplicationPath | Returns the web root-relative logical path to the _virtual root_ of this app. <br>**/webstore/**
| PhysicalApplicationPath |Returns _local file system path_ of the _virtual root_ for this app. <br>**c:\inetpub\wwwroot\webstore** 
| PhysicalPath            | Returns the _local file system path_ to the _current script or path_. <br>**c:\inetpub\wwwroot\webstore\admin\paths.aspx** 
| Path                    | FilePath CurrentExecutionFilePath  All of these return the full _root relative logical path_ to the script page including path and scriptname. CurrentExcecutionFilePath will return the ‘current’ request path after a Transfer/Execute call while FilePath will always return the original request’s path.<br>**/webstore/admin/paths.aspx** 
|AppRelativeCurrentExecutionFilePath | Returns an ASP.NET _root relative virtual path_ to the script or path for the current request. If in  a Transfer/Execute call the transferred Path is returned. **~/admin/paths.aspx** 
| PathInfo                 | Returns any extra path following the script name. If no extra path is provided returns the root-relative path (returns text in red below). string.Empty if no PathInfo is available. <br>**/webstore/admin/paths.aspx/ExtraPathInfo** 
| RawUrl                   | Returns the full root _relative URL_ including querystring and extra path as a string. <br>**/webstore/admin/paths.aspx?sku=wwhelp40** 
| Url                      | Returns a _fully qualified URL_ including querystring and extra path. Note this is a _Uri_ instance rather than string.<br>**http://www.west-wind.com/webstore/admin/paths.aspx?sku=wwhelp40** 
| UrlReferrer              | The _fully qualified URL_ of the _page that sent the request_. This is also a _Uri_ instance and this value is null if the page was directly accessed by typing into the address bar or using an HttpClient based Referrer client Http header. <br>**http://www.west-wind.com/webstore/default.aspx?Info** 
| _Control_.TemplateSourceDirectory | Returns the _logical path to the folder_ of the page, master or user control on which it is called. This is useful if you need to know the _path only_ to a Page or control from within the control. For non-file controls this returns the Page path. <br>**/webstore/admin/** 

As you can see there’s a ton of information available there for each of the three common path formats:

*   **Physical Path**    
is an OS type path that points to a path or file on disk.  

*   **Logical Path**  
is a Web path that is relative to the Web server’s root. It includes the virtual plus the application relative path.  

*   **~/ (Root-relative)**  
is an ASP.NET specific path that includes ~/ to indicate the virtual root Web path. ASP.NET can convert virtual paths into either logical paths using Control.ResolveUrl(), or physical paths using Server.MapPath(). Root relative paths are useful for specifying portable URLs that don’t rely on relative directory structures and very useful from within control or component code.

You should be able to get any necessary format from ASP.NET from just about any path or script using these mechanisms.

### ~/ Root Relative Paths and ResolveUrl() and ResolveClientUrl()

ASP.NET supports root-relative virtual path syntax in most of its URL properties in Web Forms. So you can easily specify a root relative path in a control rather than a location relative path:

```html
<asp:Image runat="server" ID="imgHelp" ImageUrl="~/images/help.gif" />
```

ASP.NET internally resolves this URL by using **ResolveUrl("~/images/help.gif")** to arrive at the root-relative URL of `/webstore/images/help.gif` which uses the `Request.ApplicationPath` as the basepath to replace the `~`. By convention any custom Web controls also should use `ResolveUrl()` on URL properties to provide the same functionality.

In your own code you can use `Page.ResolveUrl()` or `Control.ResolveUrl()` to accomplish the same thing:

```html
<script src="<%= ResolveUrl("~/scripts/new.js") %>"></script> 
````
Unfortunately `ResolveUrl()` is limited to WebForm pages, so if you’re in an HttpHandler or Module it’s not available.

ASP.NET MVC also has it’s own more generic version of ResolveUrl in `Url.Content()` which is part of the `UrlHelper` class:

```html
<script src="<%= Url.Content("~/scripts/new.js") %>"></script> 
```

In ASP.NET MVC the above syntax is actually even more crucial than in WebForms due to the fact that views are not referencing specific pages but rather are often path based which can lead to various variations on how a particular view is referenced.

In a Module or Handler code unfortunately neither is available which in retrospect seems like an odd design choice – URL resolution really should happen on a Request basis not as part of the Page framework. Luckily you can also rely on the static `VirtualPathUtility` class:

```cs
string path = VirtualPathUtility.ToAbsolute("~/admin/paths.aspx");
```

[VirtualPathUtility](http://msdn.microsoft.com/en-us/library/system.web.virtualpathutility_methods.aspx) also many other quite useful methods for dealing with paths and converting between the various kinds of paths supported. One thing to watch out for is that ToAbsolute() will throw an exception if a query string is provided and doesn’t work on fully qualified URLs. I wrote about this topic with a custom solution that works fully qualified URLs and query strings [here](http://www.west-wind.com/Weblog/posts/154812.aspx) (check comments for some interesting discussions too).

Similar to `ResolveUrl()` is `ResolveClientUrl()` which creates a fully qualified HTTP path that includes the protocol and domain name. It’s rare that this full resolution is needed but can be useful in some scenarios.

### Mapping Virtual Paths to Physical Paths with Server.MapPath()
If you need to map root relative or current folder relative URLs to physical URLs or you can use `HttpContext.Current.Server.MapPath()`. Inside of a Page you can do the following:

```cs
string physicalPath = Server.MapPath("~/scripts/ww.jquery.js"));
```
`MapPath()` is pretty flexible and it understands both ASP.NET style virtual paths as well as plain relative paths, so the following also works.

```cs
string physicalPath = Server.MapPath("../scripts/jquery.js");
```

as well as dot relative syntax:

```cs
string physicalPath = Server.MapPath("../scripts/jquery.js");
```

Once you have the physical path you can perform standard System.IO Path and File operations on the file. Remember with physical paths and IO or copy operations you need to make sure you have permissions to access files and folders based on the Web server user account that is active (NETWORK SERVICE, ASPNET typically).

Note the `Server.MapPath()` will not map up beyond the virtual root of the application for security reasons.

### Server and Host Information

Between these settings you can get all the information you may need to figure out where you are at and to build new Url if necessary. If you need to build a URL completely from scratch you can get access to information about the server you are accessing:


| **Server Variable**   |  **Function and Example** 
|-----------------------|------------------------------
| SERVER_NAME           | The of the domain or IP Address **www.west-wind.com** or **127.0.0.1** 
| SERVER_PORT           | The port that the request runs under. **80** 
| SERVER_PORT_SECURE    | Determines whether https: was used. **0 or 1** 
| APPL_MD_PATH ADSI     | DirectoryServices path to the virtual root directory. Note that LM typically doesn’t work for ADSI access so you should replace that with LOCALHOST or the machine’s NetBios name. **/LM/W3SVC/1/ROOT/webstore** 


### Request.Url and Uri Parsing

If you still need more control over the current request URL or  you need to create new URLs from an existing one, the current Request.Url Uri property offers a lot of control. Using the Uri class and UriBuilder makes it easy to retrieve parts of a URL and create new URLs based on existing URL. The [UriBuilder class](http://msdn.microsoft.com/en-us/library/system.uribuilder.aspx) is the preferred way to create URLs – much preferable over creating URIs via string concatenation.



| **Uri Property**      | **Function** 
|-----------------------|--------------
| Scheme                | The URL scheme or protocol prefix. **http or https** 
| Port                  | The port if specifically specified. 
| DnsSafeHost           | The domain name or local host NetBios machine name **www.west-wind.com or rasnote** 
| LocalPath             | The full path of the URL including script name and extra PathInfo. **/webstore/admin/paths.aspx** 
| Query                 | The query string if any **?id=1** 


The `Uri` class itself is great for retrieving Uri parts, but most of the properties are read only if you need to modify a URL in order to change it you can use the UriBuilder class to load up an existing URL and modify it to create a new one.

Here are a few common operations I’ve needed to do to get specific URLs:

#### Convert the Request URL to an SSL/HTTPS link

For example to take the current request URL and converted  it to a secure URL can be done like this:

```cs
UriBuilder build = new UriBuilder(Request.Url);
build.Scheme = "https";
build.Port = -1;  // don't inject port Uri newUri = build.Uri;
string newUrl = build.ToString();
```

#### Retrieve the fully qualified URL without a QueryString  
AFAIK, there’s no native routine to retrieve the current request URL without the query string. It’s easy to do with UriBuilder however:

```cs
UriBuilder builder = newUriBuilder(Request.Url);
 builder.Query = "";
stringlogicalPathWithoutQuery = builder.ToString();
```

### What else?

I took a look through the old post’s comments and addressed as many of the questions and comments that came up in there. With a few small and silly exceptions this update post handles most of these.

But I’m sure there are a more things that go in here. What else would be useful to put onto this post so it serves as a nice all in one place to go for path references? If you think of something leave a comment and I’ll try to update the post with it in the future.

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
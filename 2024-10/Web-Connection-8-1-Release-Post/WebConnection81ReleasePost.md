---
title: Web Connection 8.1 Release Post
featuredImageUrl: https://markdownmonster.west-wind.com/favicon.png
abstract: 'Web Connection 8.1 is out. This is a small maintenance release, but it does include a few significant updates. '
keywords: Web Connection,8.1, Release Notes
categories: Web Connection, FoxPro
weblogName: Web Connection Weblog
postId: 57034
postDate: 2024-10-14T12:29:02.2064042-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Web Connection 8.1 Release Post
![](https://webconnection.west-wind.com/images/WebConnection_Code_Banner.png)

Hi all,

Web Connection 8.1 has been released. This update is mostly a maintenance release that cleans up a few small bugs and issues, but it also introduces a few notable improvements:

* Support for greater than 16mb Web Response output 
* More improvements to COM server handling
* Improved wwDotnetBridge stability (no more crashes after full memory unloads)

Let's take a look.

### Support for greater than 16mb Web Response Output
Back in the Web Connection 5.0 days Web Connection switched from file based output to string based output, which it turns out is a lot faster and more flexible than direct file based output. File based output was able to write output of any size as the file content can be written out to any size. String based output on the other hand is - potentially - subject to FoxPro's 16mb memory limit. In version 5.0 Web Connection introduced the wwPageResponse class which switched to an in memory buffer that builds up a string for output. 

Essentially it does:

```foxpro
FUNCTION Write(lcText,llNoOutput)

IF !THIS.ResponseEnded
   THIS.cOutput = this.cOutput + lcText
ENDIF  

RETURN ""
ENDFUNC
```

FoxPro 9.0 is **extremely efficient** at string concatenation and at the time this provided a large boost in performance - especially related to the complexities of the then introduced Web Connection Web Control Framework (now deprecated) which relied on tons and tons for small components to write small bits of code.

But... with that change came the limitation related to FoxPro's 16mb string limit. Ironically the way Web Connection's response class was designed - unintentionally I might add - the above code for string concatenation actually works just fine **even for strings larger than 16mb**. Unfortunately, the code would fail later on when writing out the **entire response including the headers** which required an incompatible string operation.

Specifically it's this code:

```foxpro
*** This fails if cOutput > 16mb
RETURN this.RenderHttpHeader() + THIS.cOutput
```

This is one of the quirks of the 16mb string limit in FoxPro: You can actually create larger strings, but you cannot concatenate or send a greater than 16mb string to another operation that modifies the string. Essentially that code above in the `wwPageResponse::Render()` method broke the code.

I wrote in more detail about the workaround to this issue in a previous Blog Post here if you're interested:

* [Making Web Connection Work with Response Output Greater than 16mb](https://west-wind.com/wconnect/weblog/ShowEntry.blog?id=57033)

The post includes the actual changes in Web Connection along with the code work around and the helpers - you might find those helpers useful in your own code that has to deal with large strings.

The key bit of code that uses the updated string processing is in `wwProcess.CompleteResponse()`:

```foxpro
LOCAL lcResponse, lcHttp, lnX, loCol

*** Grab the response content
lcResponse = this.oResponse.Render(.T.)

*** IMPORTANT: Must follow the Render() as Render() may add headers (GZip/Utf8 etc)
lcHttp = this.oResponse.RenderHttpHeader() 

*** Check for 16mb+ output size
IF LEN(lcResponse) > 15800000    
   loCol = SplitStringBySize(lcResponse,5500000)   
   lcResponse = ""
   FOR lnX = 1 TO loCol.Count
       lcHttp = lcHttp + loCol.Item(lnX)
   ENDFOR
   loCol = null
ELSE    	
   lcHttp = lcHttp + lcResponse
   lcResponse = ""
ENDIF

IF THIS.oServer.lComObject
  *** Assign text output direct to COM Server output
  THIS.oServer.cOutput= lcHttp
ELSE
  FILE2VAR(this.oRequest.GetOutputFile(),lcHttp)
ENDIF
lcHttp = ""
```

In a nutshell, the code change involves breaking up the large string into a collection of smaller strings, and then building a new string that adds the headers first and then appends the all of the string chunks which now allows for >16mb for both headers and content. 

This way there's never a >16mb string on the update side or right side of `=` assignment operation and so we can write strings of any size, memory permitting (and yes you **can** run out of memory).  It's a hack and ends up costing some extra memory overhead as strings are duplicated, but it works surprisingly well and it now allows us to return very large HTTP responses in memory.

> When working with large strings like this, you'll want to clear any in progress strings and the collection as soon as you no longer need it to avoid holding on to memory any longer than you have to.

To be clear Web Connection has had support for more than 16mb output via file operations - using `Response.DownloadFile()` and `Response.TransferFile()` which can serve content of any size. But it's a bit more complicated to generate output to file first and then be able to delete the content after it's been sent.    
*(I'm thinking of another enhancement to allow for file deletion after sending in a future update)*

Another related hack for large HTTP text results (HTML, JSON etc.)  is to use `Response.GzipCompression = .T.`  which reduces the size of the HTTP output before headers are even added. Especially in the case of JSON compression can often knock down the size of a JSON document by more 5x since there's a lot of repetitive data in JSON or XML documents.  There's more info in the above [blog post](https://west-wind.com/wconnect/weblog/ShowEntry.blog?id=57033).

#### Related wwPageResponse and wwUtils Changes
There are a couple wwPageResponse class changes that are related to the above changes:

* **A new wwPageResponse::WriteFullResponse(lcData)**
This method writes out a full response by overwriting any existing data. Added to both wwPageResponse, and wwResponse.

* **wwPageResponse.Render(llOutputOnly)**  
The `Render()` method has a new `llOutput` parameter that returns only the response **content** without headers. `Render()` by default returns both headers and content and this override is used when creating the final output that's sent back to the Web server in file or COM based output.

* **SplitStringBySize() in wwutils.prg**  
This splits a string into a collection string chunks. This function is used to split out the >16mb content into smaller strings before being reassembled into a single string including the header.

* **JoinString() in wwutils.prg**  
The opposite of the above - takes strings in a collection and returns a single string.


### Improvements to COM Server Handling
Web Connection 8.0 has introduced improved COM Server loading, which drastically speeds up COM server loading and provides a lot more checking deterministic termination of servers that cannot be shut down via COM either because they are still busy or have been otherwise orphaned. In the past this has been an ongoing problem for those that were running large numbers of COM Server instances as it took a) very long to load many instances and b) could result in orphaned server instances that would never be shut down - ie. a lot of **extra** EXEs in task manager. 

v8.0 addressed both of these issues with parallel loading of COM servers, immediate server startup while others are still loading and a more robust shutdown sequence that tries to shut down all instances of a given executable as opposed of just the actual process ids of servers that are being shut down. 

It took a bit of experimenting during the beta of v8.0 to get this right - many thanks to Richard Kaye during the original beta, and Scott Rindlsbacher during the v8.1 cycle, who kindly both were willing to test with large production and staging environments.

In v8.1 we identified an outlier issue that caused issues with COM server loading for large server pools due to a hard coded timeout that was causing the server pool to not complete loading. This would result in the server load cycle to error out and then try to reload again, going through a rather unpleasant re-cycling loop.

In this update I've made the server load timeout configurable and allow for a larger timeout to begin with. So this is much less likely to run up into the timeout in the first place and if it still occurs can be adjusted with a larger timeout. 

The new timeout logic allows for 2 seconds per server to load. That should be plenty, plus parallel loading should reduce the overall time significantly. So if you have 10 servers the load timeout is 20 seconds. If it really takes that long to load servers - there's probably something wrong with the server, as it should not be that slow to load :smile:

For reference the original release had a max timeout of 5 seconds with 1 second load time per server. I had figured that this would be enough given that parallel loading would ensure that servers load somewhere around maybe 2x their individual load time. But it turns out that if you run in a processor constricted environment that is not uncommon on virtual VPC machines you may still end up loading sequentially. For this reason I removed the max value and stick with the per server load timeout that is configurable. 

The new value is in configuration in web.config *(Web Connection .NET Module)*:

```xml
<add key="ComServerPerServerLoadTimeoutMs" value="2000" />
```

Or in `WebConnectionServerSettings.xml` *(.NET Core Web Connection Web Server)*:

```xml
<ComServerPerServerLoadTimeoutMs>2000</ComServerPerServerLoadTimeoutMs>
```

### Improved wwDotnetCoreBridge Stability
In relation to my [wwDotnetBridge talk at Southwest Fox](https://west-wind.com/wconnect/weblog/ShowEntry.blog?id=57032) I did a bunch of work surrounding wwDotnetBridge. 

One issue that's been coming up a few times has been that the new `wwDotnetCoreBridge` class has been somewhat unstable. In previous releases the library worked fine, but it would fail if FoxPro does a full memory reset via `CLEAR ALL` or `RELEASE ALL` etc. What was happening is that unlike the full framework version of wwDotnetBridge, the .NET Core version would clear out all of its memory as the native Windows interface would not pin the loader code in memory.

Thanks to an [issue report and some great sleuthing](https://github.com/RickStrahl/wwDotnetBridge/issues/30) by @horch004 who found the workaround by pinning the loader DLL into memory and thereby ensuring that the memory would not be wiped a FoxPro memory clearing operation.

The fix for the Core is to pin the DLL and then simply return the already loaded .NET wwDotnetBridge instance and that works great - no more crashes after a full memory wipe.

### Breaking Change: Updated Log Format
In this release the Web Connection log format has been updated for two things:

* Widened the RemoteAddr field to support ipV6 addresses
* Added a Size field to log the response size  (if response is captured)

To deal with this you need to update the `wwRequestLog` FoxPro table or the corresponding SQL table.

**For FoxPro**

Delete the `wwRequestLog.dbf` table. It'll be recreated with the new file structure when Web Connection re-starts.


**For Sql Server** 

Update the table using SQL commands or manually in your SQL Admin tool *(changed fields separated below)*:

```sql
CREATE TABLE [dbo].[wwrequestlog](
	[time] [datetime] NOT NULL DEFAULT getdate(),
	[reqid] [varchar](25) NOT NULL DEFAULT '',
	[script] [varchar](50) NOT NULL DEFAULT '',
	[querystr] [varchar](1024) NOT NULL DEFAULT '',
	[verb] [varchar](10) NOT NULL DEFAULT '',
	[duration] [numeric](7, 3) NOT NULL DEFAULT 0,
	
	[remoteaddr] [varchar](40) NOT NULL DEFAULT '',
	
	[memused] [varchar](15) NOT NULL DEFAULT '',
	[error] [bit] NOT NULL DEFAULT 0,
	[reqdata] [text] NOT NULL DEFAULT '',
	[servervars] [text] NOT NULL DEFAULT '',
	[browser] [varchar](255) NOT NULL DEFAULT '',
	[referrer] [varchar](255) NOT NULL DEFAULT '',
	[result] [text] NOT NULL DEFAULT '',
	
	[size] [int] NOT NULL DEFAULT 0,
	
	[account] [varchar](50) NOT NULL DEFAULT ''
) ON [PRIMARY]
```

### Summary
There you have it. Web Connection 8.1 is a minor update and other than the logging table changes for SQL there are no breaking changes. As always you can update the project by checking out the update topic in the documentation.

If you run into any issues please post a message on the message board:

* [Web Connection Support](https://support.west-wind.com)

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
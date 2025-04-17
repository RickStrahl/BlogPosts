---
title: Making Web Connection Work with Response Output Greater than 16mb
featuredImageUrl: https://west-wind.com/wconnect/weblog/imageContent/2024/Making-Web-Connection-Work-with-Response-Output-Greater-than-16mb/StringLimit.jpg
abstract: Web Connection in the past has not supported > 16mb direct output via plain string based output, due to FoxPro's 16mb string limit. 16mb is a lot of text and while I generally don't recommend returning that much data as part of non-file request (which does support larger files) it's a feature request that comes up from time to time as people overrun the limit. During last weekend's SW Fox conference I heard about this issue again in a session and decided to address it once and for all and this posts describes the change and how it's implemented.
keywords: 16mb, String Size, String Limit
categories: FoxPro
weblogName: Web Connection Weblog
postId: 57033
postDate: 2024-09-30T15:30:22.3951519-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Making Web Connection Work with Response Output Greater than 16mb

![String Limit](StringLimit.jpg)

During this year's Southwest Fox conference and Scott Rindlisbacher's session, he was discussing generating **very large JSON output** using [West Wind Web Connection](https://webconnection.west-wind.com/) with output that exceeds 16mb as part of his application using REST JSON services. The issues raised where two-fold:

* Output over 16mb would fail
* Large output was too slow to travel to the client

My first thought was that I had addressed the >16mb issue previously, but after some initial testing it's clear that **that was not the case!** [Web Connection](https://webconnection.west-wind.com/) in the past has been limited to 16mb output due to FoxPro's 16mb string limit, for direct `Response` output. Although there are ways to send larger output via files, that can be a lot more complicated.

During the conference I spent some time to create a solution to this problem and Web Connection can now serve content >16mb. If you're on Web Connection 8.0 and you want to experiment with this updated support, you can pick up an experimental update here:

* [Web Connection Experimental (v8.1)](https://west-wind.com/files/WebConnectionExperimental.zip)

These features will be shipped with the next release in Web Connection v8.1.

If you're interested, what follows is a discussion on how I worked around this limitation along with a review of how you can create string content that exceeds 16mb in FoxPro in general.

## Making >16mb Output work in Web Connection
So while at SW Fox I started playing around with some ideas on how to make >16mb content work, and implemented a solution to this problem. 

The solution hinges around intercepting output that is returned and ensuring that no parts of the output strings that are being sent are >16mb, and if they are splitting up those strings into smaller chunks that can be concatenated.

If you want to learn more [about how you can use >16mb strings in FoxPro, you can check out my post](https://west-wind.com/files/WebConnectionExperimental.zip) from a few years ago that shows how this can work if you are careful in how you assign large values. 

> #### @icon-lightbulb Working with >16mb Strings
> You can assign >16mb by doing something like `lcOutput = lcOutput + lcContent`, but no part of a string operation that **manipulates a string and updates** can be larger than 16mb. 
>
> The left side of the `=` can become larger than 16mb, but the right side can never be greater than 16mb. 
>
> You also cannot call functions that changes the value of a `>16mb` string but some functions **can return** a greater than 16mb string.

Web Connection is already build on incremental building of a string in memory by doing effectively:

```foxpro
FUNCTION Write(lcData)
THIS.cOutput = this.cOutput + lcData
ENDFUNC
```

which allows writing output >16mb **as long lcData** is smaller than 16mb. Most of Web Connection's implementation features run through the `Response.Write()` or friends methods, including complex methods like `Response.ExpandScript()` and REST Process class JSON output, so as long as no individual `Response.Write()` operation writes data larger than 16mb, all output automatically can be larger than 16mb.

`wwJsonSerializer` already supported >16mb JSON output, and with the changes I added this week any response larger than 16mb is chunked into the actual Response output (so there the content effectively gets chunked twice - once for the JSON and once for header/httpoutput).

The issue with the actual HTTP output is that Web Connection pre-pends the HTTP headers in front of the HTTP response. The HTTP response can be larger than 16mb, but if we **prepend the headers** in front of a 16mb string - that doesn't work (ie. right side  of `=` >16mb). 

The workaround for this is: Chunking the string into smaller block that can be written (5mb chunks).

```foxpro
lcHttp = Response.RenderHttpHeader()
lcHttp = lcHttp + Response.GetOutput()  && This fails if the response is >16mb
```

To fix this I ended up creating a small helper function that splits strings by size to take the string that is larger than 16 megs and splitting it into chunks.

```foxpro
*** Inside of wwProcess::CompleteResponse()
LOCAL lcResponse, lcHttp, lnX, loCol
lcResponse = this.oResponse.Render(.T.)

*** IMPORTANT: Must follow the Render as it may add headers
lcHttp = this.oResponse.RenderHttpHeader()

IF LEN(lcResponse) > 15800000    
   loCol = SplitStringBySize(lcResponse,5000000)  
   FOR lnX = 1 TO loCol.Count
       lcHttp = lcHttp + loCol.Item(lnX)
   ENDFOR
ELSE    	
   lcHttp = lcHttp + lcResponse
ENDIF

IF THIS.oServer.lComObject
  *** Assign text output direct to Server output
  THIS.oServer.cOutput= lcHttp                     && can be >16mb
ELSE
  FILE2VAR(this.oRequest.GetOutputFile(),lcHttp)   && can be >16mb
ENDIF
```

Every request in Web Connection runs through this method so this single point of output and so any large output can be chunked.


This uses a new helper function called `SplitStringBySize()`:

```foxpro
************************************************************************
*  SplitStringBySize
****************************************
***  Function: Splits a string into a collection based on size
***    Assume: Useful for breaking 16mb strings
***      Pass: lcString  - string to split
***            lnLength  - where to split
***    Return: Collection of strings or empty collection
************************************************************************
FUNCTION SplitStringBySize(lcString, lnLength)
LOCAL lnTotalLength, lnStart, lnEnd, loCollection

lnTotalLength = LEN(lcString)
loCollection = CREATEOBJECT("Collection")

FOR lnStart = 1 TO lnTotalLength STEP lnLength
    lnEnd = MIN(lnStart + lnLength - 1, lnTotalLength)
    loCollection.ADD(SUBSTR(lcString, lnStart, lnEnd - lnStart + 1))
ENDFOR

RETURN loCollection
ENDFUNC
*   SplitString
```

As it turns out this works for:

* Plain Response.Write() requests (ie. hand coded)
* `Response.ExpandScript()` and `Response.ExpandTemplate()`
* Any `wwRestProcess` handler

### Use >16mb Content with Care
Turns out this is a very useful addition, even if I would highly recommend that you don't do this often! It's a bad idea to send huge amounts of data back to the client as it is slow to send/receive, and if you're sending JSON data or HTML table data it'll take forever to parse or render. It also puts a lot of memory pressure on the Visual FoxPro application, and may result in out of memory errors if output is too large and isn't immediately cleaning up.

## Reducing Output Size Significantly with GZipCompression
Another thing that you can and should do if you are returning large amounts of text data is enable `Response.GZipCompression = .T.` either on the active request, or on all requests. 

You can do this either in:

* **Process.OnProcessInit**  
this will be global and applied to every request in this process class. Add to the `MyProcess::OnProcessInit()` method.

* **Individual Process Method**  
this is specific to each individual method and applied only. Add to any Process method before the method completes.

Note that GZip compression only kicks in after output reaches a certain pre-configured size which is configured in `wconnect.h`  and you can override it in `wconnect_override.h`:

```foxpro
#UNDEFINE GZIP_MIN_COMPRESSION_SIZE
#DEFINE GZIP_MIN_COMPRESSION_SIZE				15000
```

Anything smaller just gets returned un-encoded, while anything bigger gets GZipped.

Web Connection supports GZip compression of content with just that flag and especially for repeating content like JSON you can cut the size of a document immensely - typical between 5x and 10x smaller than the original size. Using GZipCompression gives you literally a ton more breathing room before you bump up against the 16mb limit.

In the testing I did a bit ago with a huge data set the data went from 18mb down to 2mb with GZipCompression. You get the benefit of a smaller memory footprint, plus vastly reduced transfer time of the data over the wire due to the smaller size. 


## Summary
16mb for text or even JSON output should be avoid as much as possible. 16mb is a lot of data to either render, or parse as JSON data and I would not recommend doing that under most circumstances. But I know some of you will do it anyway, so this is why we're here :smile:

So, I've implemented this functionality in the current experimental update for Web Connection v8 so you can play with this right away. 

Additionally you can also minimize the need for hitting the 16mb limit in many cases by using `Response.GZipCompression = .t.` which compresses the Response output. With typical HTML and JSON output, compression is significant with at least a 3x and as much as 10x reduction in output size in many instances. It's a very quick fix to reduce both the output size you're sending and keeping it under 16mb in the first place as well as reducing the network traffic and bandwidth usage significantly.


<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
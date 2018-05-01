# Route Web Connection Scripts, Templates and Pages to a single Process Class

![](SplitInTheRoad.jpg)

[West Wind Web Connection](http://west-wind.com/webconnection/) supports a number of different 'frameworks' for generating HTML. There are two styles of MVC (Model View Controller) renderers and an ASP.NET like Forms based interface for creating rich FoxPro code based HTML pages.

These engines are available:

* **Web Connection Scripts (wcs by default)**  
HTML templates that compile into FoxPro PRG files and are executed as code

* **Templates**  
Simple templates that work well with embedded expressions and self contained code blocks that are evaluated on the fly (ie. no compilation).

* **Web Control Framework Pages**  
These are ASP.NET style pages that use an object based approach to describing controls on a page.

Both Scripts and Templates work for MVC style applications where you have controller code in a class method, and the template/script is the view that displays the model data you accumulated in the controller code to display in the script or template. 

Web Control Framework pages are more complex, compiling HTML controls into component classes that are coordinated and rendered by the page framework.

### Only one Default nPageScriptMode
When you set up a new Web Connection process class that process class can associate with a default `nPageScriptMode`:

* 1 - Template
* 2 - Web Control Framework 
* 3 - Script

The default is **3 - Script**.

The default determines what happens when you access a page like `NonMethodPage.wwd` for example, where there is no matching method in the Process class. If there is no `NonMethodPage` method in the class, Web Connection falls back to the default `nPageScriptMode` to decide what to do with the script. In this case, `wwd` will be passed to the default `nPageScriptMode` which is **3 - Script** which compiles the script into a small PRG/FXP and it runs.

### Handling more than one nPageScriptMode
So I just said that there's only **one** default, right? And that is so, but... you can actually tweak the behavior by explicitly setting the `nPageScriptMode` based on parsing rules in your code.

If I wanted to have multiple script maps for a single process method I might set up `wwd`, `wwds`, `wwdx` extensions for templates, scripts and pages respectively.

I then have to make sure I route all of these extensions in my `MyServer::Process()`:

```foxpro
CASE lcExtension == "WWD" OR lcExtension == "WWDS" OR lcExtension == "WWDX"
    DO wwDemo with THIS
```

actually this is enough if `SET EXACT OFF` as it is by default:

```foxpro
CASE lcExtension = "WWD"
    DO wwDemo with THIS
```

this makes sure all requests with these extensions are routed to my process class.

In the process class I can then handle the extension routing in the `OnProcessInit()`:


```foxpro
FUNCTION OnProcessInit()

* ... other init code

lcExt = UPPER(JUSTEXT(this.oRequest.GetPhysicalPath()))
THIS.nPageScriptMode = 3
DO CASE 
   CASE lcExt == "WWD"
      this.nPageScriptMode = 1
   CASE lcExt == "WWDS"
      this.nPageScriptMode = 3
   CASE lcExt == "WWDX"
      this.nPageScriptMode = 2
ENDCASE
```

Because OnProcessInit() fires early in the process pipeline you can change the page scriptmode which is used in `wwProcess::RouteRequest()` to find the right handler. Checked this out and it works great using a single process class to route requests for each extension to the appropriate handler.

And voila - you can now handle `wwd` pages as templates, `wwds` pages as scripts and `wwdx` pages as Web Control Framework pages.

You can make the logic more complex as well and look at other parts of the request. Perhaps extensionless URLs or query strings etc. - you have full access to the Request object to do as you please to figure out what gets routed where.

It's a cool little trick for your Web Connection applications.

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="http://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>

<!-- Post Configuration -->
<!--
```xml
<blogpost>
<title>Route Web Connection Scripts, Templates and Pages to a single Process Class</title>
<abstract>
Web Connection supports automatic extension mapping to a single route handler by default. This typically means you can route a single extension to a single type of processing mechanism like the Script or Template engines or the Web Control Framework. However, the default behavior is easily overridable by explicitly overriding the script mode in OnProcessInit(). Here's how.
</abstract>
<categories>
Web Connection
</categories>
<keywords>
wwprocess,routing,extension,scriptmap
</keywords>
<isDraft>False</isDraft>
<featuredImage>http://west-wind.com/wconnect/weblog/imageContent/2017/Route Web Connection Scripts, Templates and Pages to a single Process Class/SplitInTheRoad.png</featuredImage>
<weblogs>
<postid>923</postid>
<weblog>
Web Connection Weblog
</weblog>
</weblogs>
</blogpost>
```
-->
<!-- End Post Configuration -->

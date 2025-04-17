---
title: Updating Westwind.AspnetCore.Markdown with Markdown from Files and URLs
abstract: In the last week I've had a need to add some additional features to my Westwind.AspnetCore.Markdown library that provide easier access to Markdown from files and urls as well as the ability to replace the default Markdown parser in the library. In this post I'll discuss some of the feature additions including some implementation notes.
categories: ASP.NET Core, Markdown
keywords: 'Markdown, '
weblogName: West Wind Web Log
postId: 1071580
postDate: 2018-12-20T00:36:16.9866855-10:00
---
# Updating Westwind.AspnetCore.Markdown with Markdown from Files and URLs

![](Markdown_Logo.png)

It's been a while since I've been working on my Markdown tools, but last week I was back in content update mode on my Web site updating a bunch of ancient sites to something a little more modern. And as is often the case - a whole lot of rewriting of content is taking place. 

I've previously described that I ended up creating a couple of Markdown controls for both classic ASP.NET WebForms and MVC as well as ASP.NET Core. Both provide roughly the same features to either style of ASP.NET from Markdown parsing to an embeddable Markdown control or TagHelper, which provide a number of useful Markdown features for ASP.NET. The features include raw **Markdown to HTML parsing**, **static content embedding** into dynamic pages, **serving of Markdown files** as HTML content inside of a site and the ability to **load content into pages from files and URLs**.

My original goal for these tools was to allow me to integrate Markdown text into existing HTML based pages using either an ASP.NET Core TagHelper or a WebForms server control. The end result were a couple of generic Markdown helper libraries that ended up with a few additional tools:

**For ASP.NET Core:**

* [Westwind.AspnetCore.Markdown](https://github.com/RickStrahl/Westwind.AspNetCore.Markdown)
* [Westwind.AspnetCore.Markdown on Github](https://github.com/RickStrahl/Westwind.AspNetCore.Markdown)

```
install-package westwind.aspnetcore.markdown
```

**For System.Web based ASP.NET (WebForms and MVC):**

* [Westwind.Web.Markdown](https://github.com/RickStrahl/Westwind.Web.Markdown)
* [Westwind.Web.Markdown on Github](https://github.com/RickStrahl/Westwind.Web.Markdown)


```
install-package westwind.web.markdown
```

For the original base features you can either look at the links above or check out these previous posts which go into more detail and talk about the implementations.

* [Creating an ASP.NET Core Markdown TagHelper and Parser](https://weblog.west-wind.com/posts/2018/Mar/23/Creating-an-ASPNET-Core-Markdown-TagHelper-and-Parser)
* [Creating a generic Markdown Page Handler using for ASP.NET Core Middleware](https://weblog.west-wind.com/posts/2018/Apr/18/Creating-a-generic-Markdown-Page-Handler-using-ASPNET-Core-Middleware)
* [A literal Markdown Control for ASP.NET WebForms](https://weblog.west-wind.com/posts/2017/Sep/13/A-Literal-Markdown-Control-for-ASPNET-WebForms)

## Adding additional Functionality
Recently I added a number of new features as part of a recent spade of updates:

* Support for loading and parsing Markdown from Files
* Support for loading and parsing Markdown from Urls
* Making it easier to use a different Markdown Parser with this library
* Better title sniffing for self-contained Markdown pages

and in this post I'll discuss these features for the ASP.NET Core implementation. Note the `System.Web` ASP.NET version has most of the same features which are the same for the raw parser but differ for the WebForms control and the Page Http Handler to provide markdown page support. I won't discuss the `westwind.web.markdown` library in this post, but you can look at the [documentation on the Github page](https://github.com/RickStrahl/Westwind.Web.Markdown) for more info.

## Markdown Features Recap for the Markdown Library
Here's a quick review of the features of both of the Markdown libraries:

* Raw Markdown Parsing
   * `Markdown.Parse()`
   * `Markdown.ParseFromFile()`
   * `Markdown.ParseFromUrl()`
   * `HtmlString` and `async` versions of the above
 * Markdown Islands
   * Markdown **TagHelper** on ASP.NET Core MVC
   * Markdown **WebForm Server Control** for WebForms
 * Markdown Page Handler
   * Serve Markdown files from the file system as HTML
   * Simply drop Markdown files into a folder
   * Uses a template wrapper for Markdown content
 * Support Features
   * Basic Html Sanitation
   * Base Url Fixups and common repository URL fixups

## What's new
So the recent updates include a number of new features for the ASP.NET Core library:

* Loading Markdown directly from File and URL for Parser and TagHelper
* Replacable Markdown Parser (via `IMarkdownParserFactory`)
* Simplified configuration for the MarkDig implementation

### Markdown From Files on Disk
One very useful new feature is the ability to specify Markdown content from a file rather than statically embedding Markdown as text into a page. For content creation it's not uncommon to have a nicely designed page, with a large section of text that is mostly simple formatted text. Again back to things like contact pages, marketing pages, terms of conduct etc. which all need to render within the context of your site with nice layout, but still need a lot of text.

The base TagHelper allows abstracting the content into Markdown text which makes it easier to edit the text. However, if the block is large that gets unwieldy too, mainly because most HTML editors have no notion of Markdown formatting and will try to be **extra helpful** with their HTML expansions. For small blocks of Markdown this is fine, but for a lot of text, it's nice to be able to externalize that Markdown into a separate file **that can be edited in a proper Markdown aware editor**.

You can now do this either with the ASP.NET Core TagHelper or the `Markdown.ParseFromFile()` helper function.

 For the ASP.NET Core TagHelper this looks like this:

```html
<div class="mainbody">
    <img id="BannerImage" src="images/MarkdownMonsterLogo.png" />      
	
	<h3>A better Markdown Editor and Weblog Publisher for Windows</h3>
	
	... other marketing layout drivel

	<!-- Feature list is very simple --->
    <div class="mainbody-container">
    	<markdown Filename="~/MarkdownMonsterFeatures.md"></markdown>
    </div>
            
    <footer>
    	... footer stuff
    </footer>
</div>
```

The TagHelper loads the Markdown from disk and renders it into HTML and you can now edit the markdown file separately from the HTML document.

Alternately you can also use the Markdown helper using one of the following methods:

* Markdown.ParseFromFile()
* Markdown.ParseHtmlStringFromFile()
* Markdown.ParseFromFileAsync()
* Markdown.ParseHtmlStringFromFileAsync()

You can do this in code:

```cs
var html = Markdown.ParseHtmlFromFile("~/MarkdownPartialPage.md")
```

or directly inside of a Razor page:

```html
<div class="sample-block">
    @await Markdown.ParseHtmlStringFromFileAsync("~/MarkdownPartialPage.md")
</div>
```

Page paths can be either **relative to the Host Page** or use **Virtual Path Syntax** (using ~/ for the root). Note these paths are site relative so they refer to the `wwwroot` folder of the ASP.NET core site.

![](PageRelationships.png)


<small>**Figure 1** - Images loaded from Markdown pages are host page relative rather than Markdown page relative  </small>



> #### @icon-warning File Rendering loads Resources as *Host Page Relative*
> Any relative links and resources - images, relative links - **relative to the host page** rather than to the Markdown document. Make sure you take into account paths for any related resources and either ensure they are relative to the host page or use absolute URLs.


### Loading from URL
Very similar in behavior to loading Markdown files from disk, you can also load Markdown from a URL. Simply point the `url=` property of the TagHelper or use `Markdown.ParseFromUrl()` at a Markdown URL and that content will be loaded and then parsed into HTML.

There are 4 versions:

* Markdown.ParseFromUrl()
* Markdown.ParseHtmlStringFromUrl()
* Markdown.ParseFromUrlAsync()
* Markdown.ParseHtmlStringFromUrlAsync()

Here's what this looks like with the TagHelper:

```html
<div class="mainbody">
    <img id="BannerImage" src="images/MarkdownMonsterLogo.png" />      
	
	<h3>A better Markdown Editor and Weblog Publisher for Windows</h3>
	
	... other marketing layout drivel

	
    <div class="mainbody-container">
    
    	<!-- Embed external content here --->	
	    <markdown
	        url="https://github.com/RickStrahl/Westwind.AspNetCore.Markdown/raw/master/readme.md"
	        url-fixup-baseurl="true">
	    </markdown>
	    
    </div>
            
    <footer>
    	... footer stuff
    </footer>
</div>
```

If you want to use code:

```cs
var html = Markdown.ParseFromUrl(                
                https://github.com/RickStrahl/Westwind.AspNetCore.Markdown/raw/master/readme.md",
                fixupBaseUrl: true);
```

Or inside of a Razor page:

```html
<div class="sample-block">  
        @(await Markdown.ParseHtmlStringFromUrlAsync("https://github.com/RickStrahl/Westwind.AspNetCore.Markdown/raw/master/readme.md"))
</div>
```

Notice that there are both sync and async versions and plain string and `HtmlString` (for Razor usage) versions available.

#### Fixing up Link and Image Urls
Also notice the `fixupBaseUrl` parameter that can be specified both on the helper methods as well as on the tag helper - this option fixes up relative Markdown images and links so that they can render from the appropriate online resources. This switch is **turned on by default** as in most cases you don't want to end up with broken images or links. 

The following code handles this task by using the MarkDig parser to walk the Markdown document:

```cs
/// <summary>
/// Fixes up relative paths in the generated Markdown based on a base URL
/// passed in. Typically pass in the URL to the host document to fix up any
/// relative links in relation to the base Url.
/// </summary>
/// <param name="markdown"></param>
/// <param name="basePath"></param>
/// <returns></returns>
public static string FixupMarkdownRelativePaths(string markdown, string basePath)
{
    var doc = Markdig.Markdown.Parse(markdown);

    var uri = new Uri(basePath, UriKind.Absolute);

    foreach (var item in doc)
    {
        if (item is ParagraphBlock paragraph)
        {
            foreach (var inline in paragraph.Inline)
            {
                if (!(inline is LinkInline))
                    continue;

                var link = inline as LinkInline;
                if (link.Url.Contains("://"))
                    continue;

                // Fix up the relative Url into an absolute Url
                var newUrl = new Uri(uri, link.Url).ToString();
                
                markdown = markdown.Replace("](" + link.Url + ")", "](" + newUrl + ")");
            }
        }
    }
    return markdown;            
}
```

This function walks the downloaded Markdown document looking for any image and reference links that are not absolute and turns them into absolute urls **based on the location of the page you are loading**. You can opt out of this by setting the value to `false` explicitly.

Note that this only fixes up Markdown links and Urls - it won't catch embedded HTML links or images.

#### Url Loading - Is this Useful?
Link loading may not sound very exciting, but it can be a great solution for certain scenarios - specifically for CMS and documentation needs. Using this feature you can easily store content on a public site or - more likely a source code repository like GitHub - and serve Markdown content directly from there. By doing so you can update the documentation separately from your application and simply link in topics remotely.

The content is always up to date when you or other contributors update the documents by simply committing changes. No publishing or other changes required other than getting the links in place.

It's a great way to pull in Markdown content that is shared and updated frequently.

### Replacing the Markdown Parser
A number of people have asked how to swap out the Markdown parser in this library and use a different parser. Markdig is pretty awesome as a generic Markdown parser, but there are a few specialized Markdown parsers around and heck it would even be possible to completely replace the parsing to something different like **AsciiDoc** for example.

This was previously possible but pretty hacky. The default implementation of this library and middleware uses the [MarkDig Markdown Parser](https://github.com/lunet-io/markdig) for processing of Markdown content. However, you can implement your own parser by implementing:

* IMarkdownParserFactory
* IMarkdownParser

These two simple single-method interfaces have a `IMarkdownParserFactory.GetParser()` and `IMarkdownParser.Parse()` methods respectively that you can implement to retrieve an instance of your own custom parser that can then handle the parsing tasks.

To configure a custom parser apply it to the `Configuration.MarkdownParserFactory` property in the `Startup.ConfigureServices()` method:

```cs
 services.AddMarkdown(config =>
{
	// Create your own IMarkdownParserFactory and IMarkdownParser implementation
	config.MarkdownParserFactory = new CustomMarkdownParserFactory();
	
	...
}	
```

The custom parser is then used for all further Markdown processing.


## Growing up
This library has grown a lot more than I originally intended. I started with the TagHelper initially because I needed to embed text, then needed to serve entire pages and added the Markdown middle ware pipeline. Then I ran into large blocks of statically embedded Markdown in existing pages and found that external files are **much easier** to edit then inline Markdown. And finally in a recent document management application found that the easiest way to manage a large set of Markdown documents was via external files that are being pulled in remotely from Github via URL loading.

I'm sure there will be more uses cases and scenarios in the future but I'm happy to see this library now solves a lot of Markdown related usage scenarios out of the box and I'm finding I'm adding this to most of my applications these days for content centric by product features of most Web sites. Hopefully some of you also find it useful...

I also want to leave you with a shoutout to the excellent [Markdig Markdown Parser](https://github.com/lunet-io/markdig) that this library relies on by default - it's really the core piece that makes all of this possible. I know a lot of other libraries also depend on **Markdig**, so if you're using it show some love to that core component by starring the repository on GitHub or maybe even leaving a donation. I just did in my year end round of donations for projects I use - **show some love for the 'free' stuff you use...**

Aloha

## Resources

**Access the Code**

* [Westwind.AspnetCore.Markdown on Github](https://github.com/RickStrahl/Westwind.AspNetCore.Markdown)
* [Westwind.AspnetCore.Markdown NuGet Package](https://github.com/RickStrahl/Westwind.Web.Markdown)

**Previous Posts**

* [Creating an ASP.NET Core Markdown TagHelper and Parser](https://weblog.west-wind.com/posts/2018/Mar/23/Creating-an-ASPNET-Core-Markdown-TagHelper-and-Parser)
* [Creating a generic Markdown Page Handler using for ASP.NET Core Middleware](https://weblog.west-wind.com/posts/2018/Apr/18/Creating-a-generic-Markdown-Page-Handler-using-ASPNET-Core-Middleware)
* [A literal Markdown Control for ASP.NET WebForms](https://weblog.west-wind.com/posts/2017/Sep/13/A-Literal-Markdown-Control-for-ASPNET-WebForms)


<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
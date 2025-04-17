---
title: Creating an HTML Packager
abstract: Recently I needed to add the ability to save HTML documents in Markdown Monster. Saving raw rendered Markdown is not really sufficient and so I set out to create an HTML packager that can package an HTML Web endpoint into a self-contained local package either as a single self-contained file, or an HTML document with all dependencies localized. In this post I discuss why this is needed and how to implement and use this library to capture HTML output in a few different ways.
keywords: HTML, Packaging, Markdown, HtmlPackager
categories: Markdown, HTML, .NET
weblogName: West Wind Web Log
postId: 996799
postDate: 2018-11-01T00:20:00.6159934-10:00
---

# Creating an HTML Packager
<img src="https://github.com/RickStrahl/Westwind.HtmlPackager/raw/master/HtmlPackagerIcon.png" align="left" height="100" />

As some of you probably know I've been building out my Markdown Editor, [Markdown Monster](https://markdownmonster.west-wind.com) with many enhancements around the process of Markdown editing. One task that many users perform is - not surprisingly - to turn the edited Markdown into HTML output of some sort that can later be read on its own without a previewer. One question that comes up frequently is:

<div class="clearfix"></div>

> *How do I save my Markdown as HTML **including all of its styling and formatting** so I can view it later offline?*

In this post I discuss **a tool that packages HTML into self-contained HTML packages**. This is roughly the same behavior as what most browsers with **Save as HTML**, but as a standalone feature that can be integrated into an application or scripted from the command line. 

You can find **Westwind.HtmlPackager** on:

* [GitHub](https://github.com/RickStrahl/Westwind.HtmlPackager)
* [Chocolatey](https://chocolatey.org/packages/HtmlPackager)
* [NuGet](https://www.nuget.org/packages/Westwind.HtmlPackager).

I didn't find any pre-existing library that matched my needs for this task, so I created one that I'll discuss here. The library includes a .NET Standard library and a  Windows console app (for now) that lets you automate the process via scripts. Both the library and the command line tool let you point at a URL or local HTML file and it'll pick up all the dependencies and create one of the following:

* A single self-contained HTML file with all resources embedded
* An HTML file with external dependencies dumped into a folder
* A Zip file with the HTML file plus dependencies

These options are also available now in Markdown Monster via the **Save As Html** option from the File Menu:

![](https://weblog.west-wind.com/images/2018/Creating-an-HTML-Packager/SaveAsHtmlInMM.png)

<small>**Figure 1** - Save as HTML in Markdown Monster has a number of HTML packaging option</small>

You can see the 3 options from the packaging library, as well as raw output.

## Raw Markdown Output
**Raw Output** is very simple as it simply renders the Markdown and either dump it to a file on disk, or onto the clipboard. Markdown by itself produces only an **HTML Fragment** rather than a full blown HTML document natively, so **raw output** from Markdown is just a block of raw HTML without an HTML document header or any sort of styling associated with it.

> #### @icon-info-circle Markdown and Styling
> Styling of the Markdown HTML display is not determined by the Markdown itself, but the hosting HTML page into which the rendered HTML is embedded. 

If you take raw Markdown output and render it as an HTML fragment and then display it in a browser the result usually is a pretty sad display of non-pretty HTML:

![](https://weblog.west-wind.com/images/2018/Creating-an-HTML-Packager/RawOutput.png)

<small>**Figure 2** - raw Markdown output is unstyled and generally useless for display</small>

It works but it's nothing like what you'd expect to see if you want to read the HTML document. In order for the HTML output to be useful it generally needs to be embedded into a host document that provides the overall page layout and styling.

For example, when you go to GitHub and you see a `README.md` file, GitHub actually renders the Markdown into an HTML page. What you see on GitHub is the rendered Markdown HTML **embedded** into GitHub's Web Chrome that makes up chrome of the HTML page. The Github page header, repository details etc isn't part of the Markdown - that is provided as part of the hosting application that embeds the rendered Markdown into the page.

Likewise in Markdown Monster the application previews Markdown as HTML in the Previewer by first rendering the Markdown into HTML, and then merging the raw HTML into a pre-designed preview template that provides the appropriate styling. In MM you can switch between a number of different templates, modify an existing one or create a new one. In all cases **it's the template, not the rendered Markdown that determines the page styling** of the rendered HTML output.

![](https://weblog.west-wind.com/images/2018/Creating-an-HTML-Packager/PreviewHtml.png)

<small>**Figure 3** - HTML Preview in Markdown Monster is formatted via a host template </small>

Raw output may be OK if you are just pasting the HTML output into an existing HTML page which BTW can be useful if you're editing large blocks of static HTML text.

But for any sort of display purposes you almost always want to merge the raw Markdown generated HTML into host document.

## Exporting Markdown to Packaged Output
To be useful on its own, Markdown has to be either rendered into some other document format or the HTML has to be merged into a host template to make it look properly.

There are a couple of common ways to do this:

* Exporting to PDF 
* Exporting to an 'HTML Package'

### PDF Output
PDF output is popular because it provides an easy way to create a packaged document that's relatively small in size. With PDF viewing built into modern browsers this can be a good choice and Markdown Monster provides that option as well via **Save As Pdf**.

![](https://weblog.west-wind.com/images/2018/Creating-an-HTML-Packager/PdfOutput.png)


<small>**Figure 4** - PDF is an easy way to save HTML output in reusable form</small>

PDF output works but it too actually has to render to HTML first and then has to be converted to PDF from HTML. In Markdown Monster I use [wkHtmlToPdf](https://wkhtmltopdf.org/) which is a command line tool that uses Chromium to render HTML and then turns it into PDF files. This works surprisingly well.

The nice thing about PDF is that it's fully self-contained - all images, styling and formatting is rendered right into the PDF and it only pulls in what is actually on the page. On the downside PDF is not a plain text format so it's not indexed as well as HTML, and maybe more importantly PDF content on the Web generally renders **separate** from your Web site - you can't really make PDF content behave like other integrated HTML content, but rather you have to rely on some sort of viewer to host the PDF. That's both a good and bad thing depending on the use case. For later viewing the separateness is a benefit, but for integration it is not.

### HTML Output
As nice as PDF output is for documents and sharing, sometimes you want HTML output that can be viewed with the original HTML fidelity or perhaps you want to take a document that you've written and re-use it on your Web site **with all the formatting from the preview template intact**.

For that to work you have to be be able to turn an HTML document into a package that you can copy. One of the strengths of HTML is that makes it really easy to create distributed documents that merge content from many different sources. It's not uncommon for Web pages to contain HTML content from many Web sites - your CSS style sheets and scripts may come from a CDN, while your actual HTML and custom styling lives on a local Web Server.

In Markdown Monster I preview Markdown into HTML documents using a template. The output is generated to a local file which is then previewed in the browser. But templates are user customizable and users can and do create custom templates that often pull in styling from their Web sites for example, so that the preview matches their live site's layout and styling.

In order to save either online or local content in an **offline format** all the dependencies have to be respected and properly packaged.

## Creating an HTML Packager
So, in order to do this I created an HTML Packager project. 

The idea of the library is pretty simple: You can point the packager at any URL or local HTML file and it'll try to parse the HTML document into all of its component parts.

You can find the library NuGet and small Windows executable on Chocolatey:

### Chocolatey

```
choco install HtmlPackager
```

### Nuget

```
install-package Westwind.HtmlPackager
```

### How does it work?
The easiest way to try this out is using the Console app. The app is a Windows console app compiled into a single ILMerged executable.

There are two general output modes:

* Single file HTML Document with all resources embedded 
* HTML file with all dependencies dumped into a folder

The first produces a potentially very large fully self contained document. The document embeds all css, scripts, images, url() resources directly into the document. css is embedded as raw text, script, images and other resources are loaded and embedded as base64 binary expressions directly in the document. As you might expect, binary dependencies like images and fonts can make this file very large, but it ends up being fully self contained as a single file which is nice.

The other option is a *normal* HTML file that re-routes all related depdency resources into the local folder as a local resource.

### Console Examples
For the Console app the syntax looks like this:

```txt
Syntax:
-------
HtmlPackager <sourceUrl> -o <outputFile> [-x|-z] -d

Commands:
---------
HELP || /?          This help display           

Options:
--------
sourceUrl           Source Url or local file to an HTML document
-o <outputFile>     Output HTML file or Zip file (-z)
                    (if output file is not provided output is sent to StdOut)                                       
-x                  Create external dependencies in folder of HTML document
-z                  Create zip file with all dependencies included in zip
-d                  Display generated HTML page or Zip file
```

If you don't provide the `-x` or `-z` parameters, HtmlPackager creates that single, large, self contained HTML file.

The following are a few examples you can try to capture output.

#### Single Self Contained File
Create a single self-contained HTML document from a URL and display in your browser:

```
HtmlPackager  https://markdownmonster.west-wind.com  -o c:\temp\github_home.html -d
```

#### HTML Document with Dependencies in a Folder
Create an HTML file from a URL with all dependencies stored as loose files in the output file's folder (`-x`) and display in your browser (`-d`):

```
HtmlPackager  https://weblog.west-wind.com -o c:\temp\west-wind.html -x -d
```

#### Self-Contained HTML File from a local HTML File
Create a self-contained HTML file from a local HTML file:

```
HtmlPackager  %userprofile%\Documents\myapp\somePage.html -o %TEMP%\app_saved.html
```

#### Package output into a Zip File
Create a zip file package of HTML file plus dependencies:

```
HtmlPackager  https://github.com -o c:\temp\github-home.zip -z -d
```

#### Send Output to the StdOut Console
Create self-contained document output to the console by not providing the `-o` output file:

```
HtmlPackager  https://weblog.west-wind.com
```

This is useful if you want to pipe the generated HTML into another application for additional processing. Note that this only works with the self contained 


### Library Examples
There are a few highlevel methods you can use with this library to capture HTML from a Web site or local file:

* **PackageHtmlToFile()**  
Captures to a single self-contained, large HTML file with all resources embedded.

* **PackageHtmlToFolder()**  
Captures an HTML file and dumps all related depedencies into the same folder as the HTML document.

* **PackageHtmlToZipFile()**  
Same as the latter, but packages the final output of HTML plus depdencies into a Zip file.


#### Capture HTML File to embedded HTML as File

```cs
var inputFile = Path.Combine(Path.GetTempPath(), "_MarkdownMonster_Preview.html");
string outputFile = InputFile.Replace(".html", "_PACKAGED.html");

var packager = new HtmlPackager();
string packaged = packager.PackageHtmlToFile(inputFile,outputFile);


// display html in browser
Utils.GoUrl(outputFile);
```

#### Capture Web Url to single File
```cs
var packager = new HtmlPackager();
string packaged = packager.PackageHtml("https://west-wind.com");

string outputFile = InputFile.Replace(".html", "_PACKAGED.html");
File.WriteAllText(outputFile, packaged);

Utils.GoUrl(outputFile);
```

#### Capture File to HTML File + Loose Resources

```cs
var packager = new HtmlPackager();
string outputFile = @"c:\temp\GeneratedHtml\Output.html";
bool result = packager.PackageHtmlToFolder(@"c:\temp\tmpFiles\_MarkdownMonster_Preview.html", outputFile,
    null, true);
Assert.IsTrue(result);

// Display html in browser
Utils.GoUrl(outputFile);
```

#### Capture Web Url to HTML File + Loose Resources

```cs
var packager = new HtmlPackager();
string outputFile = @"c:\temp\GeneratedHtml\Output.html";
bool result = packager.PackageHtmlToFolder("http://west-wind.com/", outputFile, null, true);

Utils.GoUrl(outputFile);
```

#### Capture Output to a Zip File

```cs
var packager = new HtmlPackager();
string zipFile = @"c:\temp\GeneratedHtml\HtmlOutput.zip";
bool result = packager.PackageHtmlToZipFile("https://MarkdownMonster.west-wind.com/",zipFile);
Assert.IsTrue(result, packager.ErrorMessage);

ShellUtils.GoUrl(zipFile);
```

## Implementing the HtmlPackager
The implementation of this packager is fairly straight forward. The library uses [HtmlAgilityPack](https://html-agility-pack.net/) to parse the HTML document and essentially looks for any resource links and tries to localize them either by embedding them into the document directly, or by writing them out to file in the same folder as the HTML document to be saved. All dependency links are re-written using a relative path to the new local files.

### Code is on GitHub
You can check out the code on [GitHub](https://github.com/RickStrahl/Westwind.HtmlPackager/blob/master/Westwind.HtmlPackager/HtmlPackager.cs). It's a pretty rough, *"just get 'er done"* implementation, but it seems to work well for many URLs I've thrown at it. I'm sure there will be things that don't work, but if nothing else this code base might be a good starting point for more complex scenarios.

My initial goal was of course for rendering Markdown documents out of Markdown Monster and it does well for that - there's no problem converting the Preview generated Markdown into easily portable HTML documents.

### For Documents - Not SPAs!
I know something like this will ultimately used in all sorts of weird situations, but keep in mind that my goal for this was to basically duplicate the **Save As HTML** features available in browsers and the goal of that tooling is to be able to capture **document centric content**. For this the HTMLPackager should work well, but it won't work for more complex scripted **applications** or full blown SPAs. You might be able to get to the first page (or whatever resources are initially loaded) but the dynamically loaded content will not be picked up by this tool. 


### Todo List
It would be nice to build this thing into a cross platform tool, by adding a .NET SDK Global Tool implementation. I haven't played with that functionality yet, and this might be a good use case to try out playing with that tooling. I have to say that a Windows Console app still sounds a lot more user friendly though :-) I'll leave that excercise for another late night play project that I can blog about.

## Summary
So this is a fairly specialized tool, but I have to say I was surprised that there wasn't something available to do this already. When I was searching I found a few incomplete and badly implemented Node components, but that wouldn't have worked for me inside of Markdown Monster. This has a narrow use case but hopefully it'll be useful to some of you in the future... 

Packages away, pretzel boy!


## Resources
* [Html Packager on GitHub](https://github.com/RickStrahl/Westwind.HtmlPackager)
* [HtmlPackager on Chocolatey](https://chocolatey.org/packages/HtmlPackager)
* [HtmlPackager on NuGet](https://www.nuget.org/packages/Westwind.HtmlPackager)


<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
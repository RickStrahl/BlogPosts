---
title: Creating an HTML Packager
weblogName: West Wind Web Log
postDate: 2018-09-09T23:20:00.6159934-07:00
---
# Creating an HTML Packager
As some of you probably know I've been building out my Markdown Editor, [Markdown Monster](https://markdownmonster.west-wind.com) with many enhancements around the process using Markdown for editing. One task that many users perform is - not surprisingly - turn the edited Markdown into HTML output of some sort.

Markdown Monster provides a number of ways for doing this:

* Using Save as HTML
	* Raw Export of HTML Snippet
	* Packaged single-file HTML Document
	* Packaged single-file HTML with external dependencies
* Render output to Clipboard for pasting


### Raw Markdown Output
Both **Raw Output** and **Render Output to Clipboard**  are very simple and simply take the raw HTML fragment generated from Markdown and save it to disk or write it out to the clipboard respectively.

Raw output is just that though: Raw HTML without an associated HTML document and thus without any of the styling or base links necessary to render support assets like images or CSS.

That may be OK if your Markdown hard links to fully qualified URLs for images, css and other dependencies.

Most commonly however, your Markdown references relative resources so if you save your raw HTML output, you'll find that the output doesn't look very nice because there's simply not formatting and most likely any depedent images are missing.

> #### @icon-info-circle Markdown and Styling
> Styling of the Markdown HTML display is not determined by the Markdown itself, but the hosting HTML page into which the rendered HTML is embedded. 

For example, when you go to GitHub you may view a `README.md` file, which GitHub then renders into an HTML page. What you see on GitHub is actually the rendered Markdown HTML **embedded** into GitHub's Web Chrome that makes up chrome of the HTML page. The page chrome determines the master layout, as well as the style and script links that provide for the styling of your rendered Markdown content.

Likewise in Markdown Monster the application previews Markdown as HTML by first rendering the Markdown into HTML, and then embedding that HTML into a pre-designed preview template that provides the appropriate styling. In MM you can switch between a number of different templates, modify an existing one or create a new one. In all cases the template, not the rendered Markdown determines the styling of the rendered HTML output.

## Packaged HTML
This is where **packaged HTML** comes in. It's one thing to render Markdown HTML into a given template and display as the text in the browser as it  is rendered by an application like GitHub on a Web Server, or Markdown Monster in a Desktop application preview. 

But once the HTML is rendered, how can you **save** it in a meaningful way?

There are a few ways. One common one is to **print to PDF** which as of late is supported by just about all browsers. With PDF viewing built into modern browsers this can be a good choice and Markdown Monster provides that option as well via **Save As Pdf**.

![](PdfOutput.png)

Another choice and the topic of this post is to save the HTML into a packaged HTML document that allows you to render a page 

This is true for HTML in general, not just for Markdown rendering. What we commonly do is capture HTML pages as PDF. But it's also possible to package up HTML content directly so it can be viewed in the browser and that's the topic of this post.





If you want to capture your Markdown document output in a way that you can later on read, some sort of packaging has to happen that can optionally bring down all related document assests as local resources that are either embedded directly into the HTML document or are saved alongside the HTML document.

Raw HTML works fine if your Markdown references absolutely referenced resources only. If all images and CSS and other dependencies point at full `https://` URLs then the markdown can render without any special


But before we jump into what's needed to created HTML packaging let's review how Markdown rendering works.

### Markdown and Html Rendering
To understand how this works, we'll need to take a look at how Markdown is rendered into a browser in relationship to the host page that it **gets embedded into**. 

Markdown on its own is just an HTML fragment - a disconnected piece of HTML that lives outside of an HTML document. In order to render the Markdown into HTML in a way that it can be viewed it usually has to be merged into a larger document that provides the core styling, base path upon which image references may be based and so on. This may sound very basic, but this can actually be quite complex depending on how the rendered result is embedded into the document.

Likewise in Markdown Monster,
 

HTML creation runs the Markdown in the editor through a Markdown Parser and then depending on how the output is to be used generates HTML output. The **Sa
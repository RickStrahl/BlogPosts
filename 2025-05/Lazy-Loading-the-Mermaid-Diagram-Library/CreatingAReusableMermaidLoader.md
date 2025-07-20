---
title: Lazy Loading the Mermaid Diagram Library
featuredImageUrl: https://weblog.west-wind.com/images/2025/Lazy-Loading-the-Mermaid-Diagram-Library/MermaidLoading.png
abstract: "The Mermaid library is a large beast, and if you're using it selectively in your Web content you probably want to make sure you don't load it unless you actually need it, due to it's download footprint and load time. If you're loading Mermaid with server only code it's pretty straight forward, but if you use it on the client there you may want to delay loading the library until you actually need to display a diagram. "
keywords: Mermaid, Lazy Load, Javascript
categories: Javascript, Web
weblogName: West Wind Web Log
postId: 4856296
permalink: https://weblog.west-wind.com/posts/2025/May/10/Lazy-Loading-the-Mermaid-Diagram-Library
postDate: 2025-05-10T23:26:29.4366690-07:00
postStatus: publish
dontInferFeaturedImage: false
stripH1Header: true
---
# Lazy Loading the Mermaid Diagram Library

![Mermaid Loading Banner](MermaidLoading.jpg)

The [Mermaid Diagrams Library](http://mermaid.js.org/) is a widely used, open source Javascript diagram library that uses text based markup to render diagrams. It's easy to use and integrate, but it's a large beast, and if you're using it selectively in your Web content you probably want to make sure you don't load it unless you actually need it due to it's large download footprint and load time. If you're loading Mermaid with server only code it's pretty straight forward, but if you use it on the client you may want to delay load the script file until you actually need to display a diagram.

If you're anything like me in my Mermaid usage, you probably have only a few pages that actually use Mermaid while the majority of other content doesn't use it. It's easy enough to slap Mermaid into a page, but personally I prefer to not load it until the page that it's on actually needs it. In my case that tends to be a very small percentage of pages.

In addition there's the issue of client side navigation: If you decide to conditionally load Mermaid, you may end up loading a page that doesn't use Mermaid so you don't load it, but then navigate on the client to a page that does use it.

The latter is a common use case for me as I use Mermaid primarily in documentation scenarios, where literally one or two pages use Mermaid and the rest do not.

In the past I've often just eaten the download and load time hit - because you know *'we need to get stuff done and get it working'*. But it's always nagged at me and so today I created a small loader that essentially can lazy load Mermaid **when it's actually needed**, both for server rendered pages (generic) or for client navigation (app specific).

##AD##

## The easy way: Server Only Rendering
If you're rendering Mermaid into purely server generated code, loading Mermaid on demand might be pretty simple as long as you can examine the content of the page when the page is rendered.

In my scenario I'm dealing with Markdown content so I can look for `` ```mermaid `` in my content to determine if I need to initialize Mermaid on an outgoing request.

In my case this is easy as the main content is user provided in a specific field that i can look at. In this case I can conditionally render the Mermaid initialization code into the page (Razor):

```csharp
@if (Topic.Body?.Contains("\n```mermaid") ?? false) { 
    <script id="MermaidScript" 
            src="@Model.Configuration.Markdown.MermaidDiagramsUrl"></script>
    <script>
        mermaid.initialize({startOnLoad: true});
        
        document.addEventHandler("DOMContentLoaded", ()=> {
            function renderMermaid() {
                mermaid.init(undefined,'.mermaid');    
            }  
            document.addEventHandler('previewUpdated', () => {
                renderMermaid();
            });
            renderMermaid();
        });
    </script>
    
    <style>
    pre.mermaid {
        border: none !important;
    }
    </style>
}
```

I also use similar code to this in my Desktop App documentation solution which uses a Handlebars like rendering engine. Same idea - I can render my previews with the script embedded as needed.
  
### Server Rendering may not work reliably
This worked great for the offline app and previewing - but I ran into problems once I published my application into a documentation viewer HTML page, that uses client navigation to navigate topics.

The initial topic is 'server rendered' (static page but Mermaid was rendered into it as needed).  But if I start out on a topic that doesn't have Mermaid in it, then navigate to another topic that does have Mermaid in it, the Mermaid script and startup code are not available and the diagrams don't render.

## Loading Mermaid On Demand
There a couple of ways you can deal with this:

1. Just always load Mermaid and *fogettaboutit*
2. Lazy load Mermaid **only when it's needed**

We already talked about option #1 - it works but it wastes resources.

For option #2, the following code is a small component that handles Mermaid lazy loading and a couple of other useful features:

* On demand loading of the Mermaid script library 
* Event based refresh via `previewRefresh` event handler
* Optionally pass in Library Url
* Optionally pass in Mermaid configuration options
* Easy to use and remember

The component ends up being a drop in script block that is called as a one-line function.

<small><i>**Note:** This scenario specifically uses the straight script version of Mermaid (USM) and the `previewRefresh` implementation is specific to my application that fires these events (namely when the document is previewed and navigated via client link navigation).</i></small>

Here's the code:

```javascript
/*
    Loads mermaid onto a page if there's mermaid code in the page, 
    and renders any mermaid diagrams. 
*/
function mermaidLoader(mermaidUrl = "https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js", 
    mermaidConfig = {
    startOnLoad: true,
    theme: "default",
    themeVariables: {
        primaryColor: "#ffcc00",
        edgeLabelBackground: "#ffffff",
        tertiaryColor: "#ffffff"
    } }) 
{    
    // handle previewUpdated event - must be declared here so always available!
    document.addEventListener("previewUpdated", ()=> renderMermaid());

    if (!window.mermaid)
    {
        if (!document.querySelector(".mermaid"))  return;       
        loadMermaid();  // also fires initial render on load
        return;            
    }
    
    function initializeMermaid() {
        mermaid = window.mermaid;
        mermaid.initialize(mermaidConfig);            
        renderMermaid();
    }

    function renderMermaid() {        
        if (!document.querySelector(".mermaid"))  return;     

        if (!window.mermaid)
            loadMermaid();                
        else            
            mermaid.init(undefined,'.mermaid');    
    } 

    function loadMermaid() {            
        if (window.mermaid) return;

        const script = document.createElement("script");
        script.src = mermaidUrl;
        script.async = true;            
        script.onload = function () {                                
            initializeMermaid();            
        };
        document.head.appendChild(script);
    }
}
```

What's nice is that you can drop this into a top level application page with a single line of code:

```javascript
<script>                            
    document.addEventListener("DOMContentLoaded", ()=> {
        docMonster.initializeLayout();
        setTimeout(docMonster.tocExpandTop, 5);

        // THIS: check for, load and run mermaid
        mermaidLoader();                                                           
    }); 
</script>
```

> Note that you do need to wait for page load, so that you can accurately check for Mermaid script in the page - so execute in `DOMContentLoaded` event or `$()` etc.

As you can see there's no URL specified and no configuration provided so everything uses defaults. Unless the page contains Mermaid tags, the script is not loaded which improves page load time - in my case for 99% of my pages don't use Mermaid so between script load and parsing of the large library page load time improves quite a bit for pages that don't use it.

The function can pass in:

* the Mermaid Library Url
* a Mermaid configuration object

With parameters it looks like this:

```js
mermaidLoader("@MarkdownMonster.mmApp.Configuration.Markdown.MermaidDiagramsUrl",
{
    startOnLoad: true,
    theme: "dark",
    themeVariables: {
        primaryColor: "#ffcc00",
        edgeLabelBackground: "#ffffff",
        tertiaryColor: "#ffffff"
    } 
 });          
```             

Note that I'm providing the Mermaid Url here using a server generated configuration setting, but that's optional. The default Mermaid Url is likely appropriate in 90% of use cases unless you want to use a local copy (which wouldn't be cached as well).

Mermaid configuration is useful primarily for switching the rendering scheme. Mermaid has some pretty horrific default themes unfortunately, and none of them work very well with both light and dark themes, so providing at minimum some configuration based on the render theme is not unusual.

#### Client Page Refresh Notifications
One important aspect of this component is that it also handles client navigation and more importantly loading the script from client code, so that the library isn't loaded until needed.

For client page updates my host application creates a `previewUpdated` event:

```javascript
// Raise a previewUpdated event on the document
var event = new Event("previewUpdated", { bubbles: false, cancelable: true });            
event.target = document;
event.currentTarget = document;
document.dispatchEvent(event);
```

That event is then captured by the `mermaidLoader`:


```js
document.addEventListener("previewUpdated", ()=> renderMermaid());
```

which then goes on to call `renderMermaid()` which in turn checks to see if the library is already loaded and if not loads it:

```javascript
function renderMermaid() {        
    if (!document.querySelector(".mermaid"))  return;     

    if (!window.mermaid)
        loadMermaid();                
    else            
        mermaid.init(undefined,'.mermaid');    
}
```

The `loadMermaid` call handles inserting the script and then process Mermaid scripts. Otherwise `mermaid.init()` just processes the page.

The code for this seems a little circuitous with the nested function calls, but breaking out like this allows for both server rendered code (initial page load) and client code (client navigation) to use the same logic.

## Workey, Workey
To see how this works you can check out the Markdown Monster documentation which uses this component.

If you go to this page which includes some sample Mermaid charts:

* [Rendering Mermaid Charts](https://markdownmonster.west-wind.com/docs/Markdown-Rendering-Extensions/Rendering-Mermaid-Charts.html)

You can use the browser tools to see that this page - if you access it directly - loads the Mermaid library and it's immediately loaded when the page come up. 

If you go to most other pages directly - or if you navigate in the tree Refresh the page to completely reload the page - you'll see that the Mermaid library **is not immediately loaded**. It's not loaded until you navigate in the tree to a page that contains Mermaid tags, using client navigation. In this use case, Mermaid usage is two pages out of the entire documentation which makes it worth the extra effort to avoid loading anything Mermaid related unless the page uses it.

##AD##

## Summary
Nothing too exciting but whenever I use Mermaid I end up with a similar situation and I tend to just slap Mermaid on the page and take the 660k download hit, but it's just wasted resources. The code I show here is simple and reusable and it handles a multiple scenarios including client navigation automatically. Next time I'll be ready :smile:


## Resources

* [Mermaid Diagrams](http://mermaid.js.org/)
* [Mermaid Configuration Options](http://mermaid.js.org/intro/syntax-reference.html#configuration)
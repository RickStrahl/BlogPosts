---
title: IPad Scroll Issues with Fixed Content
abstract: Ran into some issues with fixed headers again in one of my mobile applications where on an iPad it appeared the content wouldn't scroll properly. I've run into this issue a few times and it turns out it's related to positional layout and specifically problematic on iPad Safari browsers. In this post I'll discuss the problem and the relatively simple workarounds.
categories: CSS,HTML5
keywords: scrolling,-webkit-overflow-scrolling,lockup
weblogName: West Wind Web Log
postId: 1195357
postStatus: 
permalink: https://weblog.west-wind.com/posts/2015/Jun/05/IPad-Scroll-Issues-with-Fixed-Content
postDate: 2015-06-05T17:51:41.0000000
---
# IPad Scroll Issues with Fixed Content


![](DivScroll.jpg)

I’ve run into problems with scrolling &lt;div&gt; tags with iOS Safari on a number of occasions and each time, I end up wasting untold amounts of time. In typical mobile apps I create, I tend to have a header area, a content area and in some cases a footer area. The content area is wedged between the header and the footer (or the bottom of the document if there is no footer) and the content needs its own scroll functionality rather than what the built-in browser scrollbar provides.
 
To make this work I use absolutely positioned headers and footers (if used – typically for phone sizes only) using ‘fixed’ styling.
 
All of this works great in desktop browsers and just about any mobile browser. It works fine even on an iPhone, but when running on an iPad more often than not (but not always – apparently it depends on the type of content) **the content area will simply not scroll.**
 
When it happens the content appears to 'stick' where the page behaves as if there where no scrollbars at all – not on the page or the content area. No amount of rotating and refreshing makes it work. Oddly though it’s not every page using the same scrollable content container layout. The content styling on the container is applied to most pages in the application, yet frequently the failure occurs only on a few or even just one of the content pages – even though the content is hosted in the same freaking scrolling container.
 
### position:fixed and –webkit-overflow-scrolling
 
As [I’ve written about before](http://weblog.west-wind.com/posts/2013/Jun/01/Smoothing-out-div-scrolling-in-Mobile-WebKit-Browsers), iOS doesn’t do smooth **&lt;div&gt;** tag scrolling by default. In order to get a div to scroll you have to use the **–webkit-overflow-scrolling: touch** style to force scrolling to work smoothly. Most reasonably modern mobile browsers (ie. Android 4.x and newer and even Windows Phone) do just fine with smooth scrolling by default, but iOS and old Android browsers need this special CSS hint to avoid the extremely choppy default scrolling.
 
According to rumors Apple does this on purpose to discourage custom scroll schemes in browsers to more or less force usage of the stock browser scrollbar. The reasoning is that the stock scrolling is very efficient while custom scrolling is supposed to be confusing and also is a resource hog for battery life. Whatever the reasoning – the behavior sucks when you run into it and while I can appreciate the ideology behind it, it’s just not realistic to expect that you won’t need quality custom scrolling in a mobile Web app.
 
The problem with using ‘stock’ scrolling is that applications that use sticky headers can’t effectively use the stock scrollbar, especially if the app also has to run on the desktop where the scrollbar is a big content hogging control and it just looks plain wrong to have a scrollbar next a non-scrolling region.
 
So in most applications headers tend to be created as 'sticky' elements that take up the width of the viewport, with a scrollable content area that contains the relevant content for the application.
 
For typical content that might look like this:

```css
.content-container {
    position: absolute;
    left: 0;
    top: 80px;
    bottom: 1px;
    width: 100%;
    z-index: 11;
    overflow-x: hidden;
    overflow-y: scroll;
    -webkit-overflow-scrolling: touch;
}
```

Now if you also end up using a fixed header you might add something like this:

```css
.banner {
    position: fixed;    top: 0;     left: 0;     height: 58px;     width: 100%;    background: #7b0105;
    background-image: linear-gradient(to bottom, #7b0105 0%, #b8282c 100%);
    color: #e1e1e1;
    border-bottom: solid 1px #7b0105;    
    padding-top: 7px; 
    z-index: 9999;
}
```

Notice the **position: fixed**style, which would appear to be the most obvious thing for sticky headers.

Now all issues of positions fixed aside, the above actually worked just fine for my application on every browser except on an iPad. And then only on a few content pages. The above is basically a base container layout into which other content is loaded for each page. In this case Angular views inside of the **content-container** element. Out of 10 pages though 2 of them would fail to scroll properly. Bah…

##AD##

### Remove or Override –webkit-overflow-scrolling

After doing a bit of research I’ve found that there are many problems with scrolling on iOS and most of them are related to the use of –webkit-overflow-scrolling. Countless questions regarding the ‘sticky’ scrolling and ‘stuck’ scrolling which I’m referring to here where you try to scroll the div and instead the entire page tries to move up – it appears as if the entire document is clipped without scrolling enabled at all.

The first – unsatisfactory – solution was to remove the **–webkit-overflow-scrolling** style (or setting it to **auto**) from the CSS class and the problem pages would become ‘un-stuck’. But unfortunately the scroll behavior went to shit as well as the nasty choppy scrolling returned.

This might be a reasonable solution if the content you’re trying to work with doesn’t need to scroll very much. If you only need to scroll a single screen or less, this might be just fine. However, if you have longer content that scrolls more than a screen the default scroll choppiness is really unacceptable so this is not going to work.

### Use position:absolute instead

The better solution however is to  simply replace **position:fixed** with **position:absolute** if possible.

Position fixed and absolute are somewhat similar in behavior. Both use x,y positioning in the view port and both are outside of the DOM document flow so other content is not affected by the placement of containers. Both require `zindex` positioning to determine vertical priority in the view stack.

Position fixed keeps the element pinned at whatever position you set it to regardless of the scroll position of the browser. This makes sense in some scenarios where you actually want to scroll the entire page but leave content in place. The key to remember is to not use it when you build have your own scrollable content on the page.

It turns out in my case I don’t really need position:fixed because I manage the position and size of the container and toolbar headers and footers myself anyway. I know where everything is positioned and keep the content area effectively wedged in the middle of the statically sized elements. By way of CSS and media queries I can force the header to the top and the footer on the bottom using fixed sizes which means I can safely use **position:absolute.**

And yes by simply changing the position:fixed to position:absolute in the header:

```css
.banner {
    position: absolute;
    …
}
```

My problem that I spend an hour trying to work around was resolved.

It’s a simple, but non-obvious solution and I’m not the first to discover it. But it also wasn't one of the solutions I ran into while searching either at least not an easily discovered one.

In most cases when you’re doing mobile layouts you can probably get just fine by using **position:absolute** instead of **position:fixed** because you’re bound to control the viewport positioning of the top level container elements yourself. And if you **really** need fixed positioning, you can often use JavaScript to force the content to stay in position. And anywhere else but at the top level position:fixed doesn't really make sense.

One place where position:fixed comes up a lot is with the [Bootstrap](http://getbootstrap.com) CSS framework. Bootstrap uses **position:fixed** for header and footer navbars and you can easily run into the issues described here using default Bootstrap layouts. I avoid the Bootstrap headers and footers, but the fixed positioning is just one of the many problems I've had with them. However, I have fallen prey to copying part of the Bootstrap header styling which is probably why I ended up with position:fixed in the first place when I created my custom headers. Live and learn.

I hope by writing this down this time I might burn this lesson into my brain as I’ve discovered this very problem before and forgot it about it, only to struggle with it again. Hopefully this post will jog my memory next time, and maybe some of you find this a useful reminder as well…

### Related Resources

- [Smoothing out `<div>` scrolling in Mobile Webkit Browsers](http://weblog.west-wind.com/posts/2013/Jun/01/Smoothing-out-div-scrolling-in-Mobile-WebKit-Browsers)

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
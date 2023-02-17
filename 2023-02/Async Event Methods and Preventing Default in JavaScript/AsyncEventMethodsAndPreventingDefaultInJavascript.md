---
title: Async Event Methods and preventDefault() in JavaScript
abstract: When using async events, it's important to understand how events work when called asynchronously. Specifically if you need to interact with the event context for things like preventDefault(), cancelBubble() or returning values that determine completion state, you need to be careful as these may have no effect if called after an `await` call.
categories: JavaScript, HTML
keywords: preventDefault, async, event, javascript
weblogName: West Wind Web Log
postId: 3716983
dontInferFeaturedImage: false
dontStripH1Header: false
postStatus: publish
featuredImageUrl: https://weblog.west-wind.com/images/2023/Async-Event-Methods-and-Preventing-Default-in-JavaScript/EventsCancelled.png
permalink: https://weblog.west-wind.com/posts/2023/Feb/16/Async-Event-Methods-and-preventDefault-in-JavaScript
postDate: 2023-02-16T15:55:19.3257056-10:00
---
# Async Event Methods and Preventing Default in JavaScript

![](EventsCancelled.jpg)

Async and Await make asynchronous operations in JavaScript a lot easier, but as easy at it seems at times you can get into trouble with `async` and `await` as it can subtly change behavior from similar synchronous code. Subtly being the operative word: You might think it's working the same, when really it is not! At the end of the day one still has to have an understanding on what happens under the hood with async\await.

## From Sync to Async
I ran into an issue recently where I was trying to intercept document link clicks and route them to an external browser window in the Windows host application [Markdown Monster](https://markdownmonster.west-wind.com). The code recently had to move from sync to async as the WebView callbacks into .NET are required to be asynchronous.

Specifically I was using code like the following synchronously:

```js
document.addEventListener("click", function (e) {
    if (e.target.nodeName != "A" || !te.mmEditor) return;

    const el = e.target;
    const url = el.href;                // fixed up url
    const rawHref = el.attributes["href"].value;
    if (!rawHref) return false;

    // call into .NET - get true or false if navigation was completed (sync)
    const handled = te.dotnetInterop.previewLinkNavigation(url, rawHref);

    // handled: don't navigate the browser
    if(handled) {
        e.preventDefault();
        return false;
    }

    // If we opened a document with a hash
    // navigate to the hash location in the new document
    if (el.hash) {
        if (!navigateHash(el.hash)) {
            e.preventDefault()
            return false;
        }
    };
    
    return; // default behavior: navigate the browser
});  
```

This code calls into an external component that returns `true` or `false` in this line:

```js
const handled = te.dotnetInterop.previewLinkNavigation(url, rawHref);
```

Then based on the result, if navigation was handled by the external application ([Markdown Monster](https://markdownmonster.west-wind.com/)) I want to stop the browser's native navigation:

```js
// if externally handled we're done here!
if(handled) {
    e.preventDefault();
    return false;
}
```

That all worked fine for years, when the code was synchronous.

##AD##

### Moving to Async - Breaking the Logic
A while back I had to switch to async APIs due to changes in the host WebView application's interface requirements which required that the call be made asynchronously firing into a `async Task<bool>` in .NET. This was required to allow the .NET code to properly pass forward an async context - the old synchronous call was randomly locking up the asynchronous UI operations.

Async and Await is easy, so we'll just change the code to this, right?

```js
document.addEventListener("click", async function (e) {
    if (e.target.nodeName != "A" || !te.mmEditor) return;

    const el = e.target;
    const url = el.href;                // fixed up url
    const rawHref = el.attributes["href"].value;
    if (!rawHref) return false;

     const handled = await te.dotnetInterop.previewLinkNavigationAsync(url, rawHref);

    // if externally handled don't navigate this window
    if(handled) {
        e.preventDefault();
        return false;
    }

    // If we opened a document with a hash
    // navigate to the hash location in the new document
    if (el.hash) {
        if (!navigateHash(el.hash)) {
            e.preventDefault();
            return false;
        }
    };
    
    return;  // default behavior: navigate window
});  
```

Notice that the changes for async are ridiculously minimal:

* `async function(e)` for function header
* `await` to call the async interop method

Isn't async simple? 😄

And that *seemed* to work at first. 

I didn't notice it right away, but navigation now fired into the host application to do the external navigation (good), but... the internal browser also navigated to the linked page (bad). 

The code is **supposed to not navigate** because of the `e.preventDefault()` block and `return false`. That code **is executed**, but `e.preventDefault()` has no effect.

What's going on here?

### Async Behavior of preventDefault()
Async is not the same as sync and in this scenario, it's one of those instances where it can bite you. Specifically the issue is this:

> If you call `e.preventDefault()` and `return false` **after a call to `await`**, `e.preventDefault()` has no effect.

In hindsight that makes sense:

* the `await` call executes out of band
* the event completes before the first `await` call

What this means is that `click` event completes before the first `await` call. 

In my code above this means that the `e.preventDefault()` and `return false` have no effect, because the event is already done and has already navigated the document. The code after the `await` still executes, but it is now effectively executing **out-of-band** outside of the original event context.

In simple terms: The `click` event is not waiting for the `await` call to complete before completing.

And the result is: Both my .NET code which navigates the external browser fires, as well as the local document which now also navigates to the same page.

Not what I want!

## Work around Async Event State 
In hindsight this is fairly obvious. The `await` introduces a wait state and context switch, so the event completes before the await and the code following it runs. But, if you're converting code from sync, this is often **anything but obvious**.

Knowing the behavior now, the key is to take over the event interaction directly, by handling the link navigation manually rather than relying on the event to trigger the navigation. So instead of using `preventDefault()` conditionally, I can **always disable navigation** at the start of the event, and then manually navigate the document or not all depending on my application logic.

For `<a>` links this is easy to do, for other UI events this may be trickier.

The key is to **fire e.preventDefault() before the await** call, so it is applied to the event before it completes.

Then make the `await` call for the external navigation.

If the external navigation doesn't handle the navigation completely, I can then manually navigate the document. Here's what this logic looks like:

```javascript
document.addEventListener("click", async function (e) {
    if (e.target.nodeName != "A" || !te.mmEditor) return;

    const el = e.target;
    const url = el.href;                // fixed up url
    const rawHref = el.attributes["href"].value;
    if (!rawHref) return false;

    // prevent ALL clicks from navigating
    e.preventDefault();

    // pure hash navigation  - have to do this here now
    if (rawHref[0] == "#") {
        navigateHash(el.hash);
        return false;
    }
    
    const handled = await te.dotnetInterop.previewLinkNavigationAsync(url, rawHref);

    // document hash navigation if we opened MD document
    if (el.hash) {
        if (!navigateHash(el.hash))
            return;
    }

    // navigate manually if not handled
    if (!handled)
       window.location.href = url;
    
    return;
});
```

The `preventDefault()` call prevents the browser from navigating, even though I may still need it to later. If the result comes back as handled there's nothing else to do but exit.

If the result is not handled I then manually navigate the browser to the new location.

##AD##

## Summary
At the end of the day async code is not sync code even if `async` and `await` sometimes can lull you into thinking that it is. Behind the scenes the code is still asynchronous and **it will change the way the code executes**. And that can have side effects. 

In the example the side effect is that the `event` object's state was already applied by the time the `await` call returns and any further state changes on the event properties/methods are ignored. If you need to access that behavior after the fact, you may have to find another way.

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
---
title: 'WebView2: JavaScript to .NET Async Call Hell'
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2022-12-21T10:03:58.8768355-10:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# WebView2: JavaScript to .NET Async Call Hell

Calling .NET code from JavaScript in the WebView2 control has been a pain in the ass since the initial release of this control. Initial versions had no support for `async` calls at all, and while more recent releases have fixed that, they have completely broken old code that worked around the problem.

The behavior of callbacks from JavaScript into .NET continue to be riddled with inconsistencies and the lack of transparency by the WebView team into how this shit is supposed to work is only making this problem worse. There's ZERO documentation on this topic and as mentioned the behavior has changed - so even if you find an older post (like my earlier posts on this subject)  those posts are likely to be out of date. It also doesn't help that the way this works is incredibly inconsistent with rules that defy any logical patterns.

In this post I try to make sense of all that - mostly for my own sanity because I've not been able to keep this straight in my head without constant trial and error to double check my assumptions.

### Callbacks 101
First off understand that when using the WebView there are two ways of interaction between .NET and JavaScript:

* Calling from .NET into JavaScript
* Calling from JavaScript into .NET

### Calling into JavaScript from .NET
Calling into .NET has a couple of avenues available to it:

* Message based via `SendMessage()`
* Script Execution via `ExecuteScript()`

Both of these are 100% async and **require async** calls into JavaScript. Both are awkward compared to direct method calls as they require you to essentially create message formatters to pass messages around as strings - typically JSON formatted.

I don't want to spend a lot of time on this because I've covered this in previous posts and because - despite being awkward code wise - it works and is quite reliable. I've had good luck with this approach. 

In Markdown Monster I rely on ~100 .NET to JavaScript calls and they work flawlessly and despite the string conversion overhead, performance of these operation is also good. I exclusively use `ExecuteScript()` with some wrapper methods that allow me to `Invoke()` global functions in JavaScript that are mapped to a 'Root object', which is typically the `window` or some top level object. In Markdown Monster that would be my editor instance which is `window.textEditor` that these functions are invoked on.

This looks something like this then using a wrapper class that contains the JavaScript call methods:

```csharp
public async Task SetSelectionRange(int startRow, int startColumn, int endRow, int endColumn)
{
    await Invoke("setSelectionRange", startRow, startColumn, endRow, endColumn);
}
```

Most if these are straight pass-through methods, some have a little more logic in them to fix up the parameters for easier use in JavaScript. For example, here's a method that translates the host configuration object to the configuration object used in the editor:

```csharp
public static string GetJsonStyleInfo(ApplicationConfiguration config = null)
{
    // determine if we want to rescale the editor fontsize
    // based on DPI Screen Size
    decimal dpiRatio = 1;
    try
    {
        dpiRatio = WindowUtilities.GetDpiRatio(mmApp.Model.Window);
    }
    catch
    {
    }

    if (config == null)
        config = mmApp.Configuration;

    var fontSize = config.Editor.FontSize *
                   ((decimal) config.Editor.ZoomLevel / 100) * dpiRatio;

    // CenteredModeMaxWidth is rendered based on Centered Mode only
    int maxWidth = config.Editor.CenteredModeMaxWidth;
    if (!config.Editor.CenteredMode)
        maxWidth = 0; // 0 means stretch full width

    var style = new
    {
        Theme = config.EditorTheme,
        FontSize = (int) fontSize,
        MaxWidth = maxWidth * dpiRatio,
        config.Editor.Font,
        config.Editor.LineHeight,
        config.Editor.Padding,
        config.Editor.HighlightActiveLine,
        config.Editor.WrapText,
        config.Editor.ShowLineNumbers,
        config.Editor.ShowInvisibles,
        config.Editor.ShowPrintMargin,
        config.Editor.PrintMargin,
        config.Editor.WrapMargin,
        config.Editor.KeyboardHandler,
        config.Editor.EnableBulletAutoCompletion,
        config.Editor.TabSize,
        config.Editor.UseSoftTabs,
        config.PreviewSyncMode,
        config.PreviewTheme,
        RightToLeft = config.Editor.EnableRightToLeft,
        config.Editor.NoAutoComplete,
        config.Editor.ClickableLinks,
        LinefeedMode = (config.Editor.LinefeedMode == MarkdownMonster.Configuration.LinefeedModes.CrLf ? "windows" : "unix")
    };

    var settings = new JsonSerializerSettings()
    {
        ContractResolver = new CamelCasePropertyNamesContractResolver(),
    };
    var json =  JsonConvert.SerializeObject(style, settings);
    return json;
}
```


The `Invoke()` method handles serializing all the parameters and calling into an Invoke method in JavaScript that then makes the calls on its behalf.

Here's the JavaScript helper (`window.Invoke()`):

```javascript
/*
* Generic invocation script that invokes
* a function on the editor instance
*/
function Invoke(teFunction)
{
    if (arguments.length < 1)
        return null;

    var func = eval("te." + teFunction);
    if (typeof func != "function")
        throw new Error("Invalid Function to Invoke: " + teFunction);

    if (arguments.length > 1)
        Array.prototype.shift.call(arguments);

    return func.apply(window, arguments);
}
function GetValue(property) {
    return eval("te." + property);
}
```




So far so good - this part of the story is actually a success story for the WebView.


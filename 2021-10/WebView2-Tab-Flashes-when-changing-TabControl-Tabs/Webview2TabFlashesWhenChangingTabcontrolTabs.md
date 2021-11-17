---
title: WebView2 Flashing when changing TabControl Tabs
abstract: I've been running into major issues with the WebView control and TabControls in WPF where switching between tabs that contain WebView controls causes a very annoying white flash. In this post I demonstrate the problem and provide an arcane fix that works around this frustrating issue.
categories: WebView2 WPF
keywords: WebView2, TabControl, Flashing, UI
weblogName: West Wind Web Log
postId: 2722266
dontInferFeaturedImage: false
dontStripH1Header: false
postStatus: publish
featuredImageUrl: https://user-images.githubusercontent.com/1374013/122156127-3d22db00-ce1d-11eb-9e09-e7ce56540058.gif
permalink: https://weblog.west-wind.com/posts/2021/Oct/04/WebView2-Tab-Flashes-when-changing-TabControl-Tabs
postDate: 2021-10-04T12:02:50.5120817-07:00
---
# WebView2 Flashing when changing TabControl Tabs

One of the biggest issues I've been running into with the new Edge `WebView2` control in WPF is that the control's rendering has some serious issues with flashing a blank control surface before loading and also when switching a UI context, such as when opening or switching to tabs with a WebView on them. In [Markdown Monster](https://markdownmonster.west-wind.com) each open document runs in its own `WebView2` control (so it can maintain full editor and UI state) and you can switch between the documents via the tabs.

The problem is that using the WebView without any mitigations - especially when using dark backgrounds - you'll find that you get a lot of nasty UI 'white' flashes caused by the WebView's internal blank control state.

To give you an idea how annoying this is, here's what I see in Markdown Monster with unmitigated WebView controls loaded onto the TabControl pages (editor and preview are WebViews):

![Tab Flashing in the Web View Control](https://user-images.githubusercontent.com/1374013/122156127-3d22db00-ce1d-11eb-9e09-e7ce56540058.gif)

In this screenshot the editors on the left and the preview on the right are all WebView2 controls. You can see the flashing occur when pages are first loaded, and then also when tabs are changed **even though the WebView controls are already initialized and hold rendered content**.

Yikes. Not a nice UI experience.

## Avoid Startup Flash
The good news is that the WebView team has made some progress on minimizing startup flashing, via the `DefaultBackground` property that is applied by the control before it renders, and some timing improvements that allow you make the control visible just a little sooner than you used to get requested background color set.

The first step is to set the `DefaultBackgroundColor` which lets you apply a background color that the control internally uses before it renders any content  - well is supposed to anyway. It mostly works but as I'll show there are some exceptions that cause the white flash. 

The second bit is to hide the WebView control until it's been initialized by rendering it `hidden` or `collapsed`:

```cs
// assign host form/control background
EditorWebBrowser.DefaultBackgroundColor = WindowUtilities.BrushToColor(Background);
EditorWebBrowser.Visibility = Visibility.Hidden;
```

Then during control initialization you can delay making the control visible **after** calling `EnsureCoreWebview2Async()`:


```cs
void async InitilializeAsync() 
{
    ...
    
    await WebBrowser.EnsureCoreWebView2Async(_browserEnvironment);

    WebBrowser.Visibility = Visibility.Visible;  // hide initially, make visible here
    
    ...
}
```

This now appears to work to get the control to render without flashing, where older versions used to still flash required intercepting later events like `NavigationComplete`  or `DomContentLoaded`.

> Avoid delaying Visibility too long or the WebView won't fire various load events until the control is made visible. This can seriously bite you both in code not activating at all or sometimes code delaying execution until some other UI interaction occurs like a mouse swipe or keyboard press.

For one time initialization scenarios where you have a WebView in a fixed UI location that stays visible this is all you probably need to worry about to avoid white flashes. But if you have UI that frequently is shown and hidden explicitly via control layering like a Tab control, then you are likely to still see the WebView white flashing I showed above.

## Tab Control Tab Change Flashes
The bigger problem in Markdown Monster as you can see in the screen capture is the flashes that occur when **switching tabs between different documents**. Each of the Tab pages contain a full frame WebView2 control. As you can see in the screen shot there are a lot of annoying white flashes that occur whenever a tab is switched **even when the WebView is already loaded with content**.

I eventually figured out that the problem occurs as the **old WebView  control is deactivated** and before the new one is activated - there's a slight delay between the two and it appears that the control getting deactivated is what is actually flashing white. I can see the same behavior when closing a tab which also was flashing. However that latter scenario is easy to fix because tab closing has events that you can capture that allow you immediately hide the WebView or the tab content before the white flash can occur.

For tab selection changes however, it's not so easy because:

* `TabControl_SelectionChanged` fires **after** the new tab has already been activated
* There's no direct event that fires before the tab is changed
* To make this work I had an explicit binding property to detect the tab change

The first problem is that the TabControl doesn't fire an event before a tab is changed. By the time the `SelectionChanged` event code hit, the tab has already changed and the white flash has already happened. If I stop code in the debugger in `SelectionChanged` I basically get a blank, white WebView control surface.

The workaround for this is to make the WebView control invisible **before the new tab is activated**. To do this:

* Create a Property that binds to the `SelectedItem` of the Tab Control
* Create a Setter on that property to intercept the 'before tab change'

The binding is applied immediately before and lets me make the old WebView invisible before the actual tab change occurs. When it does the control is not visible and there's no white flash. Even with this code though there's some nuance...

### SelectedItem Binding for OnBeforeActivate Behavior
In my app this looks something like this with the property added to my Application level Model:

```csharp
public TabItem ActiveEditorTabItem
{
    get { return _activeEditorTabItem; }
    set
    {
        if (value == _activeEditorTabItem) return;

        var oldTabItem = _activeEditorTabItem;
        var oldEditor = _activeEditorTabItem?.Tag as MarkdownDocumentEditor;

        _activeEditorTabItem = value;
        OnPropertyChanged(nameof(ActiveEditorTabItem));

        // Another model property
        SelectedEditor = value?.Tag as MarkdownDocumentEditor;

        // Use this code to minimize flash when switching tabs
        // this doesn't appear to work any longer

        // hide the old WebBrowser Control
        if (oldEditor?.EditorHandler?.WebBrowser != null)
        {
            oldEditor.EditorHandler.WebBrowser.Visibility = Visibility.Collapsed;
            mmApp.Model.Window.Dispatcher.Invoke(() =>
            {
                oldEditor.EditorHandler.WebBrowser.Visibility = Visibility.Collapsed;
            }, DispatcherPriority.ApplicationIdle);
        }
    }
}
private TabItem _activeEditorTabItem;
```

This can then be hooked up to the TabControl like this:

```xml
<mmcontrols:MarkdownMonsterTabControl 
       x:Name="TabControl"
       ...
       SelectedItem="{Binding ActiveEditorTabItem}" 
/>
```

The `ActiveEditorTabItem` property setter now fires **before** the tab is actually changed, which lets me hide the old WebBrowser **before** the tab is deactivated. This avoids the white flash. The code makes it possible to interact both with the old and new tabs and specifically it lets me hide the old WebBrowser control before activating the new one. Just hiding however isn't quite enough - there's a timing issue that needs to be dealt with as well.

As you probably know the WebView2 is not a native WPF/WinForms control but rather a Win32 control hosted inside of .NET, which means that there's some logic that shows and hides this control in the appropriate container. The flashing appears to be due to timing issues when the WebView2 is released.

The 'before selection' logic using a Model Binding property is hacky enough as it is, but the real hack is the code that actually hides the old control:

```cs
if (oldEditor?.EditorHandler?.WebBrowser != null)
{
    oldEditor.EditorHandler.WebBrowser.Visibility = Visibility.Collapsed;
    
    mmApp.Model.Window.Dispatcher.Invoke(() =>
    {
        oldEditor.EditorHandler.WebBrowser.Visibility = Visibility.Collapsed;
    }, DispatcherPriority.ApplicationIdle);
}
```        

Note the second part of that code that appears to be redundantly setting visibility a second time. That block of code serves as a sort of `DoEvents()` to let other events fire - specifically the creation of the new tab/webbrowser. The idea is that the code immediately hides the old WebView letting the new WebView become visible in another UI context, while the current context briefly waits. Surprisingly **this code works** and the tab switching flashes disappear!

Remove the `Dispatcher.Invoke()` the flashing returns, or use something other than `DispatcherPriority.ApplicationIdle` and the flashing returns. I have no idea why, other than it appears to let the WebView render the newly activated tab control before this code finishes. This particular combo is the only thing that worked for me.

The final bit of code has to make sure that the WebBrowser is made visible each and every time a tab is activated in the `TabControl_SelectionChanged` event:

```csharp
/// <summary>
/// Handles various tasks around tab changes:
/// * Update Preview
/// * Window Title Update
/// * Active Flag checking
/// * Update Document Outline
///
/// IMPORTANT: Additional change handling in `AppModel.ActiveEditorTab`
/// used to handle WebView2 Tab Flicker Issues
/// </summary>
internal async void TabControl_SelectionChanged(object sender, SelectionChangedEventArgs e)
{
    ... 
    // ensure it's visible
    if (editor?.EditorHandler != null && !editor.EditorHandler.IsFirstRender)
          editor.EditorHandler.ShowWebBrowser();   // internally ensures visibility
    ...
}          
```

https://west-wind.com

As you can see with the lengthy comment on the method, because this is such an obscure and hacky fix, I made sure I left a note that points back to `AppModel.ActiveEditorTab` property to make sure I can find this fix in the future.

So yeah: All of this is a major hack! It took a lot of trial and error to arrive at this solution, which is why I'm writing it down in this post for my own sanity and future recollection, as well as to help out anybody else running into this same Tab flashing issue I describe here.

## Flash - No more.
The good news is with this solution in place I now have UI that doesn't flash during tab loading or when tabs are changed.

Here's what this looks like now:

![No Flashing WebView Tabs](https://github.com/RickStrahl/ImageDrop/raw/master/BlogPosts/2021/WebView2NoFlashingTabs.gif)

Rather mundane, since this is the expected behavior in the first place :smile:. But this has been a looooong road to success with a lot of false starts and trial and error along the way. With this code in place I've been able to remove a number of other mitigations that I'd used before, and with that some of the weird tab loading timing issues also disappeared to an overall better experience.

I suspect I'll be revisiting this post in the future as I have a number of UIs that use multiple browser views. And maybe this will save some of you in a similar situation a bunch of time and trial and error as well. 

## Resources

* [Github Issue around Tab Flashes in WebView2](https://github.com/MicrosoftEdge/WebView2Feedback/issues/1412)

<div style="margin-top: 30px;font-size: 0.8em; border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
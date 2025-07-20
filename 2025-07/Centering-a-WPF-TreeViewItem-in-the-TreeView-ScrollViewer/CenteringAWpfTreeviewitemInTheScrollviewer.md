---
title: Centering a WPF TreeViewItem in the TreeView ScrollViewer
featuredImageUrl: https://weblog.west-wind.com/images/2025/Centering-a-WPF-TreeViewItem-in-the-TreeView-ScrollViewer/DigitalTreeBanner.jgp.png
abstract: One of the annoying features of the TreeView in WPF is the inability to easily select and make an item prominently visible. While there is `TreeView.BringIntoView()` it doesn't do a good job dropping the item that the very bottom (or top) of the viewport with no way to center. In this post I show a few helper methods that facilitate this process and a few related tasks with some useful TreeView helpers.
keywords: WPF,TreeView,BringIntoView,Selection,Centering
categories: WPF
weblogName: West Wind Web Log
postId: 4934685
permalink: https://weblog.west-wind.com/posts/2025/Jul/15/Centering-a-WPF-TreeViewItem-in-the-TreeView-ScrollViewer
postDate: 2025-07-15T18:23:03.9154941-07:00
postStatus: publish
dontInferFeaturedImage: false
stripH1Header: true
---
# Centering a WPF TreeViewItem in the TreeView ScrollViewer

![Digital Tree Banner.jgp](./DigitalTreeBanner.jgp.png)

The TreeView control in WPF is a pain of a control with so many obvious features that should be but are not automatically handled. One of the problems is trying to select an item and keeping it visible and centered in the active Viewport. You would think that would be automatic or at least there would be an easy way to bring an item into a prominently visible view, but you'd be wrong! 

In my use case I need to programmatically filter or rather unfilter a bunch of nodes in a TreeView and I want to make sure that the item focused stays visible when the tree is reorganized. Well... the default behavior doesn't do this unfortunately.

There is a `TreeViewItem.BringIntoView()` method and it seems like that should do the trick. Unfortunately it does a really crappy job at it, bringing the `TreeViewItem` into the view at the edges - top or bottom, rather than where you would likely want to see it which is closer to or smack in the center of the control.

I've dealt with this one too many times in my apps on a one-off basis I finally created a small helper method that does this **right** and that's what this post is about.

##AD##

## What's the Problem with BringIntoView
Using just `BringIntoView()` the default behavior looks like this in this example where I 'unfilter' a search list to re-display the whole list, which should then keep the selected item in the viewport:

![Bad Centering Tree View](https://raw.githubusercontent.com/RickStrahl/ImageDrop/refs/heads/master/BlogPosts/2025/BadCenteringTreeView.gif)  
<small>**Figure 1** - BringIntoView() brings the TreeViewItem into view, but does so at the edges: Very top or bottom where it doesn't feature prominently.</small>

Note that the selected item ends up at the very bottom of the TreeView. It's easy to miss there and  let's be frank - functionally it looks like shit in that position. In a pinch this works, but it's not exactly  good UI.

In this UI scenario I'm using a search filter to filter the list of topics in a documentation project. In this case the match is a somewhat deeply nested header item which filters down to just a couple of items, and when I undo the filter I want that item to show up in the TreeView, preferably centered, so it's easy to see. As it is the item stays visible, but it's at very bottom - buried alive!

## Fixing TreeViewItem Centering
Let's start with the base application code needed to make this happen. This code is needed regardless of the item placement within the view so we'll need that in both the original bad and fixed good implementations. In the example this code gets fired off the X clear button handler of SearchBox:

```csharp
public void MakeTopicVisible(DocTopic topic)  // bound data item
{
    if (topic == null)
        return;

    var tvi = WindowUtilities.GetNestedTreeviewItem(topic, TreeTopicBrowser);
    if (tvi == null) return;

    // expand all parents
    var tvParent = tvi;
    while (tvParent?.Parent is TreeViewItem parentTvi)
    {
        tvParent.IsExpanded = true;
        if (tvParent.DataContext is DocTopic dt)
            dt.IsExpanded = true;
        tvParent = parentTvi;
    }

    tvi.IsSelected = true;
    tvi.Focus();
    tvi.BringIntoView();
}
```

As is typical for UI operations on a TreeView you need to first map the Model value that you have access to (most likely via `TreeView.SelectedItem`) and convert that into a `TreeviewItem`. I use a helper function called `GetNestedTreeViewItem()` (see [below](#support-methods)) which walks the TreeView hierarchy and looks at the DataContext items for a match.

Once I have the TreeViewItem I then have to expand all parent items to ensure the item will actually be visible.

Finally, once that's all done, the item is selected, focused and hopefully brought into the View. But as shown in the Screen Capture above, if the item is not already visible it'll be pulled into the active Viewport, but likely at the very bottom or top of the view port.

That's a lot of work for a simple thing that **should be built into the bloody base control** since this is something one does all the time with a `TreeView`!

The main problem at hand here is that `BringIntoView()` really does an inadequate job of what it's designated job - it gets the TreeViewItem into view, but not where you typically want it. `element.scrollIntoView()` in JavaScript.

### Ooooohhmmmmm... Centering the Tree
Alright so how does this get fixed? Manually, my friend. Manually, by explicitly moving the `ScrollViewer` so the the TreeViewItem is centered.

Here's the code that does the trick:

```csharp
/// <summary>
/// Centers a TreeViewItem inside of the scrollviewer unlike ScrollIntoView
/// which scrolls the item just into the top or bottom if not already
/// in the view
/// </summary>
/// <param name="treeView">TreeView to scroll</param>
/// <param name="treeViewItem">TreeView Item to scroll to</param>
public static void CenterTreeViewItemInScrollViewer(TreeView treeView, TreeViewItem item)
{
    if (item == null)
        return;

    // Ensure item is visible in layout
    item.IsSelected = true;
    item.BringIntoView();

    treeView.Dispatcher.InvokeAsync(() =>
    {
        var scrollViewer = FindVisualChild<ScrollViewer>(treeView);
        if (scrollViewer == null)
            return;

        // Find the header content presenter
        var header = FindVisualChild<ContentPresenter>(item);
        if (header == null)
            return;

        // Get header position relative to ScrollViewer
        var transform = header.TransformToAncestor(scrollViewer);
        var position = transform.Transform(new System.Windows.Point(0, 0));

        double headerHeight = header.ActualHeight;
        double viewportHeight = scrollViewer.ViewportHeight * scrollViewer.ScrollableHeight / scrollViewer.ExtentHeight;

        double targetOffset = scrollViewer.VerticalOffset + position.Y - (viewportHeight / 2) + (headerHeight / 2);
        scrollViewer.ScrollToVerticalOffset(targetOffset);
    }, DispatcherPriority.Loaded);
}
```

This code measures the size of the TreeViewItem's **Content** and then adjusts the Viewport by the height or width to try and bring the item into the center of the Viewport - shifting the offset from its current location.

Note that this code specifically looks at the **Content** object (the `ContentPresenter`) rather than the entire TreeViewItem using `FindVisualChild<ScrollViewer>()` (code [below](#support-methods)). Why? Because a TreeViewItem  contains all of its children and you don't want to center an expanded `TreeViewItem` with all of its items which would show the selected item in the wrong place at best and not at all at worst.

So rather than the `TreeViewItem` the code looks for the `ContentPresenter` which then lets me correctly center the actual item in the Viewport rather than the whole block.

I can now fix my calling code to use this function instead of `BringIntoView()`:

```csharp
tvi.IsSelected = true;
tvi.Focus();

WindowUtilities.CenterTreeViewItemInScrollViewer(TreeTopicBrowser, tvi);    
```

Here's what the desired behavior looks like:

![Proper Centering Tree View](https://raw.githubusercontent.com/RickStrahl/ImageDrop/refs/heads/master/BlogPosts/2025/ProperCenteringTreeView.gif)

Et Voila! 

This is what `BringIntoView()` should be doing in the first place, but this helper does the trick if you want the TreeViewItem centered. If you don't care about the centering, you can still just `BringIntoView()` or if you need it at some other location you can tweak the method above to put it where you want it. Centering seems like the right thing to do most of the time. 

Some refinements for alternate behavior might allow checking if the item is already visible or at least slightly off the top and bottom and not scrolling the viewer in that case to avoid jumping around the UI.  Positioning might be another option - top, center, bottom, where top and bottom would be closer to the top or bottom without directly butting  up against the top or bottom. Not something I need, but if you need some extra credit homework - there you go...

### Support methods
For completeness sake here are the two helper functions referenced in the code snippets above:

**FindVisualChild**  
Finds a child control by its control type. 

```csharp
public static T FindVisualChild<T>(DependencyObject currentControl) where T : DependencyObject
{
    if (currentControl != null)
    {
        for (int i = 0; i < VisualTreeHelper.GetChildrenCount(currentControl); i++)
        {
            var child = VisualTreeHelper.GetChild(currentControl, i);
            if (child is T)
            {
                return (T) child;
            }

            T childItem = FindVisualChild<T>(child);
            if (childItem != null) return childItem;
        }
    }

    return null;
}
```

**GetNestedTreeViewItem**  
Looks up a Treeview item by its model value.

```csharp
public static TreeViewItem GetNestedTreeviewItem(object item, ItemsControl parent)
{
    // look at this level
    var tvi = parent.ItemContainerGenerator.ContainerFromItem(item) as TreeViewItem;
    if (tvi != null)
        return tvi;

    // otherwise, recurse into each generated TreeViewItem
    foreach (object child in parent.Items)
    {
        if (parent.ItemContainerGenerator.ContainerFromItem(child) is TreeViewItem childContainer)
        {
            var result = GetNestedTreeviewItem( item, childContainer);
            if (result != null)
                return result;
        }
    }

    return null;
}
```

##AD##

## Summary
File this one away under *Things that should just work, but don't!* So many things that have to do with the TreeView control are not designed in anyway to deal with the hierarchical nature of this control that it's almost comical. The good news is that the tools to do this manually are available and it's relatively straight forward to build reusable helpers that solve that problem.

Of course if you're anything like me, you'll do this manually a 100 times before you wisen up and build something reusable. And that's the point of this post - it'll serve as a reminder to me and quickly find the solution.

Or you can ask an LLM and get an incomplete solution... ask me how I know! 😂  And yeah, that's why I still bother writing helper functions like this, and even write them up in a blog post.
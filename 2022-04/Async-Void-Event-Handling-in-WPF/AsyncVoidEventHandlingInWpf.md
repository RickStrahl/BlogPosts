---
title: Async and Async Void Event Handling in WPF
abstract: When running WPF and WinForms applications with async operations, I've run into a number of issues with event handling 'hanging' the UI thread in unexpected ways, where the UI hangs until the mouse is moved or a key is pressed. A lot of times these issues are associated with events that fire async code, and in this post I take closer look at one scenario that can cause these hang ups along with a workaround that has proven useful in a number of occasions for me.
categories: WPF, CSharp, .NET
keywords: async,await,async void,Dispatcher,WPF,
weblogName: West Wind Web Log
postId: 3114844
dontInferFeaturedImage: false
dontStripH1Header: false
postStatus: publish
featuredImageUrl: https://weblog.west-wind.com/images/2022/Async-Void-Event-Handling-in-WPF/AsyncFiring.jpg
permalink: https://weblog.west-wind.com/posts/2022/Apr/22/Async-and-Async-Void-Event-Handling-in-WPF
postDate: 2022-04-22T13:05:13.5687317-10:00
---
# Async and Async Void Event Handling in WPF

![](AsyncFiring.jpg)

Async usage in C# is the recommended way to build UI based applications. But if you're using an older platform like WinForms or WPF, event handling still relies on the older decidedly non-async event delegate processing. In the past [I've written about pitfalls when using async with WPF specifically](https://weblog.west-wind.com/posts/2021/Jul/07/Thoughts-on-AsyncAwait-Conversion-in-a-Desktop-App) a while back in the context of porting a commercial application - [Markdown Monster](https://markdownmonster.west-wind.com/) -  from mostly sync code to mostly async.

In this post I want to re-iterate one of the most common problems that I have and still continue to run into in Markdown Monster with async code, over 1 year after the async migration:

> Event handlers that use `async void` or even just plain synchronous `void` can often hang while processing operations that eventually trigger or fire other overlapping async calls, especially if those operations end up triggering longer running operations that are offloaded on new threads.

Before I jump into dissecting this problem and show my workaround that has worked to 'free up' intermittent hangs, or UI hangs (hanging until you move the mouse etc.) on various occasions, let's do a quick very high level review of how async code work.

## Async 101
Async code can be called in a variety of ways, and the `async void` handling that is the focus of this post is an exceptional use case that you generally want to avoid in your code. In fact, `async void` is widely panned as a C# anti-pattern, because at its core it doesn't originate from a `Task` based root operation. But for classic event handling there's not much of a choice.

Before we look at why that's a problem let's look at 'proper' async/await behavior.

### Creating Async Methods
'Proper' `async` method definitions tend to be in the form of:

```cs
public async Task Method() 
{
	await Task.Delay(10);
}
```

or 

```cs
public async Task<bool> MethodWithResult() 
{
    await Task.Delay(10);
    return true;
}
```

The key is the `Task` or `Task<T>` result value from the method called which allows the called method to participate in the Async call continuation sequence that somewhere up the chain typically gets initiated by a `Task.Run()` or similar operation. IOW, the code is executing a continuation of an existing `Task` operation via `await` or via `Task.ContinueWith()`.

### Calling Async Methods
Adding the `async` keyword to a method then allows you to use `await` to wait on other `Task` or `Task<T>` based operations.

```cs
await Method();   

bool result = await MethodWithResult();
```

Both methods are called asynchronously - meaning the code executes potentially off the main UI thread so UI (or other background operations on a servers main call context) stay responsive. The `await` however, waits for the completion of the async call and then continues as if the code had been called synchronously.

##AD##

### The Mechanix 101
Behind the scenes, the `async` `await` pattern is essentially a compiler generated *Task Continuation State Machine* (my term), that uses `Task.ContinueWith()` to nest multiple `await` code blocks inside of each other. Each `await` triggers the following code to be abstracted into a new continuation block. The logistics behind this are complex, but the compiler does the heavy lifting of making many sequenced async calls work in a way that **makes it much easier to reason about even complex asynchronous code in a linear fashion**.

As nice as `async` and `await` is, the underlying complexity of nested `Task.ContinueWith()`  blocks remains, and this shows up when you need to debug async code. When you do, the code often can't show the entire call stack in an easy to read, linear code sequence, but rather shows a bunch of nested anonymous, compiler generated closures that are difficult to decipher and read in the call stack. It can be a mess especially if the you are many calls deep already. For this reason  async code can be a real bitch to debug. 

> #### @icon-warning Captain Obvious Alert
> There are big differences between async and sync code, and you should **never assume** that `await` called code is in any way similar to purely synchronous code, even though the way you write the code is not all that different.

To wit:

```cs
bool result = await MethodWithResult();
```

does not have the same semantics as:

```cs
bool result = SyncMethodWithResult();
```

[There are pitfalls here](https://weblog.west-wind.com/posts/2021/May/15/Async-Await-with-the-Null-Propagator), because the result of the first method call is actually `Task<bool>` rather than `bool` and only the unwrapping of the Task - invisibly handled by the compiler - yields the final `bool` value result. There are actually multiple code steps between the the method call and the result being assigned and that can trip you up in a number of ways the compiler will not flag.

This isn't in any way meant to discourage use of `async` methods, but rather as a reminder to be extra aware of the differences between sync and async code. **It's easy to forget**! 

## async void and Event Handling
`async` methods are generally a boon that are easy to consume with `await` syntax.

This is all fine and dandy, but **.NET events do not support `async Task`** as a result type! Instead, **you have to cast event handlers as `async void`** if you want to run async code inside of an event handler method and to comply with the classic .NET event delegate signature. 

However, the real problem is that the event delegate is **not called from a `Task` based context**. IOW, the event delegate is essentially called synchronously.

You can fake `async` usage in the method, and use the `async void` method declaration, which gives you the ability to use `await` code inside of your event handler:

```cs
public async void HandleAnEvent()
{
	await Task.Delay(100);
    ...
}
```

The compiler happily sets up the async state machinery that makes the `await` calls work, but that doesn't change the fact that the delegate calls the method **synchronously** and doesn't `await` the result.

This changes the event behavior from the synchronous version.  There are two problems with this `async void`  event handling that can bite you:

1. **Event Handlers that `await` exit before the `await` method completes**  
The first issue is that the event immediately completes execution when it hits an `await` in the handler method, while the async task continues to run in the background. This is because nothing is awaiting the Task result on the event handler. So the method immediately completes while the async code continues on in the background.

    If your event sequencing in some way depends on one event firing after another (think `KeyUp` and `KeyDown`) this can cause sequencing issues. While probably rare, I've run into this on a few occasions.

2. **Event handlers are not Dispatched Asynchronously**  
Events are not fired asynchronously as they are not part of an actual Task event chain. This means that often the async code runs entirely on the UI thread which can cause events to block and keep other events from firing. So even though you're making an `await` call, the source thread is the Main UI thread. So you actually may still be blocking even though your event handler is `async`.  

    This can also cause UI events to not fire immediately, if multiple events all running on the UI thread interact with each other in async methods, because they are each blocking on the UI thread to marshal back to. This can manifest in some UI transition being required to trigger event continuations (ie. moving the mouse out of control, etc.).
    
The latter point is what I've run into a lot and it's shitty issue to run into, because it's usually quite intermittent. Rather than just failing outright, these errant event interactions often occur under specific combinations of operations that are difficult to impossible to reproduce reliably.

### async void - The Problem Child
Here's one scenario, I'll describe here and use as my example. In Markdown Monster I use the `WebView2` control to host an HTML/JS based editor that handles the editor functionality. There are lots of events going back and forth between the editor and the WPF host application. 

Recently I ran into an issue where drag and drop operations from a TreeView - a Favorites Browser that holds filenames - into the editor would mysteriously hang, until focus moved out of the WebView again. This would then screw up a number of related things like the mouse pointer, and also incorrectly trigger another click event on the TreeView item that wasn't supposed to fire on a drag operation.

This demonstrates several of the problems I described above:

* **UI Hanging**  
When dropping the file into the editor which triggers an async operation in the editor, doesn't fire because the host thread is blocking on the `DoDragDrop()` operation. It hangs until I move the cursor out of the WebView and then it fires. This seems to be caused by calling into async code as part of the drop operation which is simultaneously blocked by another async operation from the Click handler which also fires due to sequencing.

* **Event Sequencing**  
The `MouseMove` event that triggers the Drag and Drop start, also ends up firing the `Click` event because the event sequencing is not working as expected. Rather than waiting for the `MouseMove` to complete, the Click handler is fired almost simultaneously to the MouseMove/Drag handling resulting in the document being opened rather than being dragged. Additionally, as the UI is hung neither events fire. When the UI unfreezes (when moving out of the control which forces a context change) both frozen events start running again which now causes the click to fire (and open a new document) and the drop operation to fire which now is firing and at best pastes the dropped item into the wrong location (because the mouse moved) or at worst into an entirely incorrect document. Yikes!

Here's an example of what this event handling failure looks like:

![](https://github.com/RickStrahl/ImageDrop/raw/master/BlogPosts/2022/April/AsyncVoidEventFail.gif)

Notice that as I drag the 'favorite' - which is linked as a file item - and then drop it into the editor, that **nothing happens until I move the cursor out of the editor**. Once I do the drop code fires **as well as the `Click` handler** which otherwise would not be firing due to a flag set that we are still in drag mode.

Here's what this **should look like** (with mitigation I'll describe below applied):

![](https://github.com/RickStrahl/ImageDrop/raw/master/BlogPosts/2022/April/AsyncVoidEventWithDispatchInvokeAsync.gif)

##AD##

### The Problem in Code
The original code that runs the MouseMove and subsequent `DoDragDrop` operation that hangs is a `MouseMove` handler that checks mouse state to determine on whether it should start dragging the tree view item. If it does, it then issues a `DoDragDrop()`  which in this case is the blocking operation.

Here's the original code:

```csharp
// This version locks up on ``DoDragDrop()`
private async void TreeFavorites_MouseMove(object sender, MouseEventArgs e)
{
    if (e.LeftButton != MouseButtonState.Pressed) return;
    
    if (Model.ActiveEditor == null || 
       !(await Model.ActiveEditor.IsEditableDocument()))
       return;
       
    var selected = TreeFavorites.SelectedItem as FavoriteItem;
    if (selected == null) return;

    var mousePos = e.GetPosition(null);
    var diff = startPoint - mousePos;
    
    if (Math.Abs(diff.X) > SystemParameters.MinimumHorizontalDragDistance * 2
        || Math.Abs(diff.Y) > SystemParameters.MinimumVerticalDragDistance * 2)
    {
        var effect = DragDropEffects.Move;
        if (Keyboard.IsKeyDown(Key.LeftCtrl))
            effect = DragDropEffects.Copy;

        var treeViewItem = WindowUtilities.FindAnchestor<TreeViewItem>((DependencyObject) e.OriginalSource);
        if (treeViewItem == null) return;

        // add both files and text
        var dragData = new DataObject(DataFormats.FileDrop, new string[] {selected.File});
        
        // *** Hangs here - until moved out of WebView when dropping
        dragData.SetText(selected.File + "|" + selected.Title);
        DragDrop.DoDragDrop(treeViewItem, dragData, effect);
    }
}
```

This event handler uses `async void` to handle Mouse 


## A better way to Handle `async void` Events
So what does work reliably in this scenario? Turns out that using a `Dispatcher.IncokeAsync()` call and `await`ing the call is the only way this works without hang ups and weird context switches:

```csharp
private async void TreeFavorites_MouseMove(object sender, MouseEventArgs e)
{
    // THIS!
    await Dispatcher.InvokeAsync(() =>
    {
        if (e.LeftButton != MouseButtonState.Pressed) return;
    
	    if (Model.ActiveEditor == null ||
	        !(await Model.ActiveEditor.IsEditableDocument()))
	       return;
	       
	    var selected = TreeFavorites.SelectedItem as FavoriteItem;
	    if (selected == null) return;
	
	    var mousePos = e.GetPosition(null);
	    var diff = startPoint - mousePos;
	    
	    if (Math.Abs(diff.X) > SystemParameters.MinimumHorizontalDragDistance * 2
	        || Math.Abs(diff.Y) > SystemParameters.MinimumVerticalDragDistance * 2)
	    {
	        var effect = DragDropEffects.Move;
	        if (Keyboard.IsKeyDown(Key.LeftCtrl))
	            effect = DragDropEffects.Copy;
	
	        var treeViewItem = WindowUtilities.FindAnchestor<TreeViewItem>((DependencyObject) e.OriginalSource);
	        if (treeViewItem == null) return;
	
	        // add both files and text
	        var dragData = new DataObject(DataFormats.FileDrop, new string[] {selected.File});
	        
	        // *** Hangs here - until moved out of WebView when dropping
	        dragData.SetText(selected.File + "|" + selected.Title);
	        DragDrop.DoDragDrop(treeViewItem, dragData, effect);
	    }
    });
}
```

You might think that some other `Dispatcher` combination might also work, but I tried a few different ones that also did not work:

* `Dispatcher.Invoke(()=>{ })` not async
* `Dispatcher.InvokeAsync(()=> { })`  not async
* `await Dispatcher.Invoke(async ()=>  {} )`

### Another Alternative: Top Level `await` Operation
The fact that `await Dispatcher.InvokeAsync()` works might just be an artifact of the async structures that the compiler creates with `async` methods, as there is another way you can 'fake' the behavior to make the event handling work properly.

This code uses a `await Task.Delay(1)` to trigger a task continuation of the main code:

```cs
private async void TreeFavorites_MouseMove(object sender, MouseEventArgs e)
{
    // THIS ALSO WORKS - no hang below
    await Task.Delay(1);
    
	if (e.LeftButton != MouseButtonState.Pressed) return;
	
	if (Model.ActiveEditor == null || !(await Model.ActiveEditor.IsEditableDocument()) )
	   return;
    ...
    
    DoDragDrop(...);    // doesn't hang here
}
```


Note however that moving the `await` operation down even one line makes it not work again. In other words this 'trick' only works to the same effect if the `await` operation runs as **the very first command executed in the method**.

This means moving the `await Task.Delay(1)` down just one line, once again goes back to blocking on the `DoDragDrop()`:

```cs
private async void TreeFavorites_MouseMove(object sender, MouseEventArgs e)
{
   
   if (e.LeftButton != MouseButtonState.Pressed) return;

    // THIS DOES NOT WORK - still hangs below
    await Task.Delay(1);
   
    if (Model.ActiveEditor == null || !(await Model.ActiveEditor.IsEditableDocument()) )
	   return;
    ...
    
    DoDragDrop(...);    // Hangs here
}
```

This is likely due to the fact that the **top level async Task** immediately causes the event handler to exit, while the remainder of the code continues executing in the Task continuation in the background. The entire block of code then runs inside of a Task based continuation context and something in that threading environment appears to allow the events to fire smoothly. 

Of the two solutions, I think that the cleaner solution is to wrap the entire event handler into an `await Dispatcher.InvokeAsync()` call as that is more descriptive in its purpose. While operationally this may introduce additional overhead, you'll likely have a pretty good idea what the intent of the wrapped code block is.

## Summary
The bottom line is that wrapping plain .NET Event handlers into `await Dispatcher.InvokeAsync()` has solved a number of *weird event hang up issues* for me on various occasions. I don't 100% understand **why** it works, but it has solved problems with event hangups and blocking in MM in many different places to the point where when I run into a problem with hanging this is one of the first things I'll try to resolve the issue.

It sucks that these we have to deal with these kinds of mysterious inconsistencies with Task based processing and threading in our applications, but that's async code for you and especially async code in classic application frameworks that weren't designed for Task based asynchronicity . A lot of trial and error goes into figuring things like this out, and sometimes you can even have similar code in a different part of the app that behaves completely differently (this issue in particular).

I hope this post might prove useful to a few of you running into similar issue. For me... it'll serve as my reference to future self...

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
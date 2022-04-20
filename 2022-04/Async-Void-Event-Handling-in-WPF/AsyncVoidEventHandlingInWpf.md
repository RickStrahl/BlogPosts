---
title: Async Void Event Handling in WPF
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2022-04-19T13:05:13.5687317-10:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Async Void Event Handling in WPF
Async usage in C# is the recommended way to build UI based applications. But if you're using an older platform like WinForms or WPF, event handling still relies on the older decidedly non-async event delegate processing. In the past [I've written about pitfalls when using async with WPF specifically](https://weblog.west-wind.com/posts/2021/Jul/07/Thoughts-on-AsyncAwait-Conversion-in-a-Desktop-App) a while back in the context of porting a commercial application from sync to mostly async.

In this post I want to re-iterate one of the most common problems that I have and still continue to run into in Markdown Monster with async code:

> Event handlers that use `async void` can often hang while processing operations that fire into overlapping `await` calls, especially if those operations end up triggering longer running operations that are offloaded on new threads.

Before I jump into dissecting this problem and one workaround that seems to consistently work for, let's do a quick review of async code.

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

The key is the `Task` or `Task<T>` result value from the method called which allows the called method to participate in the Async call continuation sequence that somewhere up the chain typically gets initiated by a `Task.Run()` or similar operation. IOW, the code is executing a continuation of an existing `Task` operation.

### Calling Async Methods
Adding the `async` keyword to a method then allows you to use `await` to wait on other `Task` or `Task<T>` based operations.

```cs
await Method();   

bool result = await MethodWithResult();
```

Both methods are called asynchronously - meaning the code executes potentially off the main UI thread so UI (or other background operations on a servers main call context)  stay responsive. The `await` however, waits for the completion of the async call and then continues as if the code had been called synchronously.

### The Mechanix 101
Behind the scenes, the `async` `await` pattern is essentially a compiler generated Promise continuation statemachine, that usese `Task.Continue()` to nest and string together multiple `await` code blocks. The logistics behind this are complex, but the compiler does the heavy work of making many sequenced async calls work in a way that's much more natural to write.

As nice as `async` `await` is though, the underlying complexity of nested `Task.Continue()`  blocks remains and this shows up when you need to debug async code which often can't show the entire call stack in an easy to read linear code sequence that you're used to with synchronous code. Async code can be a real bitch to debug as often the call stack is not complete or downright points at the wrong thing. 

> #### @icon-warning Captain Obvious Alert
> 
> There are huge differences between async and sync code, and you should never assume that `await` called code is in any way similar to purely synchronous code, even though the way you write the code is not all that different.

To wit:

```cs
bool result = await MethodWithResult();
```

does not have the same semantics as:

```cs
bool result = SyncMethodWithResult();
```

[There are pitfalls here](https://weblog.west-wind.com/posts/2021/May/15/Async-Await-with-the-Null-Propagator), because the result of the first method call is actually `Task<bool>` rather than `bool`.

This isn't in any way meant to discourage use of `async` methods, but rather a call to be hyper aware of the differences between sync and async code **because it's easy to forget when making an `await` call to an async method**. 

Guilty as charged! 

##AD##

### Void Async and Event Handling
So in short `async` methods are generally a boon that are easy to consume with `await` syntax.

This is all fine and dandy, but **.NET events do not support `async Task`** as a result type! Instead, **you have to cast event handlers as `async void`** in order for them to be called. 

The real problem isn't that you can't have `async Task` results, but rather that the event delegate is not actually called from a `Task` based context. IOW, the event delegate is called synchronously.

As mentioned, you can fake it and use an `async void` method declaration, which gives you the ability to use `await` code inside of your event handler:

```cs
public async void HandleThis()
{
	await Task.Delay(100);
    ...
}
```

The compiler happily sets up the async state machinery that makes the `await` calls work.

But... `async void` and the way the delegate calls this event handle, changes the event behavior somewhat from the synchronous version.  There are two problems with this `async void`  event handling that can bite you:

1. **Event Handlers that `await` exit before the `await` completes**  
The first issue is that the event immediately completes execution, while the async task runs in the background. This is because nothing is awaiting the Task result on the event handler. So the method immediately completes while the async code continues on in the background.

If your event sequencing in some way depends on one event firing another (for example, `KeyUp` and `KeyDown`) this can cause sequencing issues. This is probably rare, but I've run into this on a few occasions. As far as I know there's no good work around for this other than manually tracking event state and managing the sequencing manually (which is messy as hell).

2. **Event handlers are not Dispatched Asynchronously**  
Events are not fired asynchronously as they are not part of an actual Task event chain. This means that often the async code runs on the entirely on the UI thread which can cause events to block and keep other events from firing. So even though you're making an `await` call, the source thread is the Main UI thread. So you actually may still be blocking even though your event is `async`.  

    This can also cause to UI events to not fire, if multiple events all running on the UI thread interact with each other in async methods, because they are each blocking on the UI thread to marshal back to. This can manifest in some UI transition being required to trigger event continuations (ie. moving the mouse out of control, etc.).
    
    
The latter point is what I've run into a lot and it's shitty issue to run into, because it's usually quite intermittent. Rather than just failing outright, these event interactions often occur under specific combinations of operations that are difficult to impossible to even reproduce reliably.


## Problem Child
One scenario I had recently is what I'll describe here and use as my example. In Markdown Monster I use the WebView control to host an HTML/JS based editor that handles the editor functionality. There are lots of events going back and forth between the editor and the WPF host application.

Recently I ran into an issue where drag and drop operations from a TreeView - a Favorites Browser that holds filenames - into the editor would mysteriously hang, until focus moved out of the WebView again. This would then screw up a number of related things like the mouse pointer, and also incorrectly trigger another click event on the TreeView item that wasn't supposed to fire on a drag operation.

This demonstrates several of the problems I described above:

* **UI Hanging**  
When dropping the file into the editor which triggers an async operation in the editor, doesn't fire because the host thread is blocking on the `DoDragDrop()` operation. It hangs until I move the cursor out of the WebView and then it fires.

* **Event Sequencing**  
The mousemove that triggers the Drag and Drop start, also ends up firing the Click event because the event sequencing is not working as expected. As the UI is hung both events don't fire. When the UI unfreezes both events fire which causes the click to fire (and open a new document) and the drop operation to fire which now is firing and at best pastes the dropped item into the wrong location (because the mouse moved) or at worst into an entirely incorrect document. Yikes!

Just to make this extra lovely, I use **almost the same exact code** using the same drag and drop semantics for another component of the application (the File and Folder Browser) and there the code 'just works'. Same event handling logic, nearly identical mouse move code - only difference is how the Tree Item click event is handled. Yikes again!

Here's an example of what this looks like:






## A better way to Handle `async void` Events

```csharp
private async void TreeFavorites_MouseMove(object sender, MouseEventArgs e)
{
    await Dispatcher.InvokeAsync(() =>
    {
        if (e.LeftButton != MouseButtonState.Pressed) return;

        var selected = TreeFavorites.SelectedItem as FavoriteItem;
        if (selected == null)
            return;

        var mousePos = e.GetPosition(null);
        var diff = startPoint - mousePos;

        if (Math.Abs(diff.X) > SystemParameters.MinimumHorizontalDragDistance * 2
            || Math.Abs(diff.Y) > SystemParameters.MinimumVerticalDragDistance * 2)
        {
            var effect = DragDropEffects.Move;
            if (Keyboard.IsKeyDown(Key.LeftCtrl))
                effect = DragDropEffects.Copy;

            var treeView = sender as TreeView;
            var treeViewItem = WindowUtilities.FindAnchestor<TreeViewItem>((DependencyObject) e.OriginalSource);
            if (treeView == null || treeViewItem == null)
                return;

            var files = new string[] {selected.File};

            // add both files and text
            var dragData = new DataObject(DataFormats.FileDrop, files);
            dragData.SetText(selected.File + "|" + selected.Title);

            IsDragging = true;
            DragDrop.DoDragDrop(treeViewItem, dragData, effect);
        }
    });
}
```

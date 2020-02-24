---
title: Ensuring WPF Forms are Visible on the Screen in High DPI
weblogName: West Wind Web Log
postDate: 2020-02-13T01:36:11.7571684-10:00
---
# Ensuring WPF Forms are Visible on the Screen in High DPI

With the advent of High DPI monitors, using multiple monitors, and switching frequently between high and low resolutions, having applications that can track previous screen positions and then restoring to a different resolution, window management of an application has become a non-trivial process. Not only do you have to track the previous location, but you also have to know how many screens are active, what scale factor they are running in and which screen you application is launching on. To make things even more tricky switching between resolution between restarts of an application can leave an application easily stranded in the non-visible wasteland of a former screen resolution. In short, applications have to be fairly smart to handle window restoration effectively.

And you can see this in many applications doing a shitty job of it, when you shut down in one resolution and restore in another. Many - especially older - applications completely ignore the new 2D reality and end up hidden or only partially visible.

Take the following example in an application like Markdown Monster that remembers the last location that it was running in next time it's restarted:

* Open the app on a 4k Screen 
* Move the main window into the right half of the 4k screen
* Shut down

Later:

* Take the laptop off the 4k Screen
* Use the 1080p or 4k 150% scaled laptop display 
* Open the application
* The window doesn't come up - it's invisible in negative land

Sound familiar? Lots of apps don't handle this scenario well. There are are other iterations of this scenario that leave windows partially visible which is a little better, but still kind of obnoxious.

Another similar scenario is that you run the 4k big screen at 100% and later decide to scale it down to 125%. As in the scenario above the restarting the application causes a large part of the original application's width and height to be off-screen now. Not cool.

A few years ago this was fairly rare, but these days most of us change resolutions whether its from an office setup to a portable setup, or whether you frequently change resolutions depending on your workflow.

If you're building desktop applications on Windows it's a damn good idea to have our applications try to move themselves into visible space if they get rendered off the screen somewhere and that's what this article is about in regard to WPF.

## Windows Support
Windows has some automatic built in support for moving and resizing Windows. But... it really only works when change resolutions interactively. 

If you scale up your screen resolution from say 100% to 125% Windows sends notifications to windows to resize themselves and performs some rudimentary checking of window sizes to resize windows so they fit into the new (smaller resolution). That's great when you do it interactively while the app is running, but doesn't help you in the offline scenario where you run in one resolution and restart in another. For that scenario we have to manually reset screen location.

Windows does send messages for these events and it's possible to intercept these events but I found that most of the time that's not really necessary as the base Windows behavior handles this reasonably well out of the box.

The bigger issue is if the resolution change happens non-interactively in between being connected and disconnected or restarting the machine on a different screen. Windows itself is no help here - there are no notifications or checks which makes sense - no way for Windows to know whether the obscured location is on purporse or not. So it's left up to the application to handle this.

## Resetting Screen Location in WPF
In case you didn't know: Trying to position a WPF window in the physical Windows screen is a pain in the ass. Why? Because WPF uses device specific pixels while Windows natively uses 'old  school' fixed pixel size (96dpi). This means that whenever you place or size things using WPF and reference anything in the physical Windows device space you have to calculate the DPI ratio and adjust. There's a mixture of which values require the Device Specific Pixels (widths and heights vs. positions) and so this gets confusing as shit very quickly.

To make this even worse, the Windows related APIs like Screen,  some of this requires `System.Drawing` which is based in pixel based formats, while the WPF `System.Window.Graphics` format uses the device specific values. The system sizes (like `Screen`) all use pixels while WPF uses the device specific values.

Having fun yet? :joy:

In Markdown Monster I have several things that deal with interaction with the physical screen:

* Screen Capture tool
* Startup screen positioning
* Addin screen positions

Because this is a frequent thing in MM I ended up creating a few generic routines that help with this.

The short version is that most of this code for this lives here in the Github repository:


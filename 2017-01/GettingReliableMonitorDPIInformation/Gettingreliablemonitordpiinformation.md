
# Getting Reliable DPI Scaling Information

As part of Markdown Monster I ship a built-in screen capture component. MM has built in support for Techsmith's excellent SnagIt tool, but it's a paid tool so not everybody has it (but you should!), and of late Techsmith has unfortunatey shipped SnagIt13 with a bug in their Automation interface that renders the screen capture integration non-functional (they're working on it, but it's been two releases and no fixes :-().

Either way, screen captures is something that's near and dear to me personally that I need in my blogging and documentation work, so it was very important to me that Markdown Monster ships at least with a basic solution. I don't want to get sidetracked with the screen capture here - that's the topic for another post - but rather with a related issue that deals with figuring out exactly where to capture content from.

### WPF - Why do you hate me so?
WPF is awesome in some ways, but in others it can be an infuriating beast. The screen capture has easily been the biggest time sink I've run into with Markdown Monster. Basic screen capture is complex but manageable, but once you thrown in multiple monitors with different DPI scalings you quickly find out that WPF is very inconsistent when dealing with DPI scale.

I'll spoil the final answer here, which is if you want to deal with multiple DPI scaled monitors properly in WPF you really want to be running .NET 4.6.2 which fixes a number of the issues I'll discuss here.

### Why do I care about per monitor DPI Scaling?
Markdown Monster captures a full desktop bitmap, before taking your actual screen shot in order to capture the current cursor, and things like menus order other artifacts that might be open on the screen. So the first thing that needs to happen is to capture a massive image that holds all of this data.

In order to get this image properly returned you need to scale it by a DPI ratio. The global desktop (the one that spans all screens) has an internal DPI setting and that setting needs to be applied if I want to overlay the screen and display it as if it were the actual desktop.

Once the time comes to capture content from the desktop - when the user clicks on a window - I then need to know which window to capture. Windows provides the coordinates but to figure out the size of the window on the bitmap and the capture area I have to scale the capture area based on the DPI Scale. 

Yeah it gets complicated fast. Windows does things one way, the captured bitmap does things another, and each monitor has its own scaling that is reflected on the bitmap. Ugh.

### WPF and Desktop Position
Now if this was a WinForms application this would be easy because WinForms don't know squat about DPI. They just get the info from Windows and you can grab the rectangle and you're done. In fact, the actual final capture I do can do just that - I can just use the raw Windows coordinates to pick what I need off the bitmap.

The problem comes in when you want to create a window or other drawing area with WPF. Because WPF uses DPI aware pixels everything has to be translated to device dependent pixels - including you guessed it: desktop windows and other areas. So for me to show a highlight window like this:

**** IMAGE HERE ****

I have to draw a the window that outlines the potential capture area. And this is where the fun with DPI scaling begins.

### Main Screen - Never a Problem
So it appears that the main screen is never a problem. 



<!-- Post Configuration -->
<!--
```xml
<blogpost>
<title>GettingReliableMonitorDPIInformation</title>
<abstract>

</abstract>
<categories>

</categories>
<isDraft>False</isDraft>
<featuredImage></featuredImage>
<keywords>

</keywords>
<weblogs>
<postid></postid>
<weblog>
West Wind Web Log
</weblog>
</weblogs>
</blogpost>
```
-->
<!-- End Post Configuration -->

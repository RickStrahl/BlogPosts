---
title: Shooting the AI Troubleshooting
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2025-05-16T17:39:57.1156148-07:00
postStatus: publish
dontInferFeaturedImage: false
stripH1Header: true
---
# Shooting the AI Troubleshooting
Like many of you, I'm still trying to footing in the AI coding morass. There's so much stuff to try and figure out it can make your head spin. I've had my fingers in a lot of different things from using Chat to talk through development issue, to large and small scale code gen - with varying levels of success.

One frustration I've run into repeatedly though is how to deal with trouble shooting with coding agents like GitHub CoPilot or the one in Cursor which are the two I've been using mostly. But same also applies to regular chatbots - the difference being that the built-in tools can look at your code that you're working on directly - with varying levels of success.

Today's rant is about troubleshooting a difficult issue. Before I ever  got to 'asking for help' I had already spent an hour trying to fix the issue myself. The problem essentially is that I'm running a multi-document parser that runs through documents to verify links for validity. It works fine with local content, but when I add Http calls the results are oddly truncated.

The code is async all the way through - with async file access and Http access, but the actual code is not actually async. There's no parallel code (not yet). It all works until the Http calls are added at which point it seems that the 

But today's post is about something a little different which is troubleshooting difficult problems in an application.

I ran into a nasty bug in the current application I'm working, where I'm parsing a bunch of Markdown documents for bad links. THe logic works fine but and I'm using it one of my applications and have been for some time. Now I'm using the same code in another application 


Trying to work through an actual problem with AI is like working with a shitty dev reading off a script. At first, suggestions are good, but usually things I've already tried.

I'm here for shit I can't figure out, not to be told what I already know, eh?  Especially when I've provided most of the info in the first place.

But that's where it gets real sucky. After the initial - let's try to nail this down to where the AI has the scope and where answers seem pretty good even if not solving the issue. This lulls you along to keep going thinking.

But it never gets better from there...

I've tried this in CoPilot which is actually really bad at this particular scenario. And the Visual Studio CoPilot UI really needs some work - it's terribly awkward with its tiny windows that show like 3 columns initially and buttos at the bottom of the window. 

I typically have much better luck with ChatGPT or even in Cursor chat.

No matter, all of them failed to get me through my problem (which is some weird Async issue where a called async method appears to not await (or throw w/o capturing the exception).

At this point I've laid out my problem and CoPilot (or whatever) has correctly repeated back the problem and the tried solutions. 

... only to then go on suggest things that were already answered 10 questions back. A few more prompts and several other things that were already tried are repeated. When you get to that point... walk away. It's done.

The point is this: For troubleshooting at least AI is good for basic or well-known issues, but once you hit a real difficult snag it'll lead you down an hour of wasted time more often than not. In these cases at first it seems you're getting closer to a solution, but you're actually just running in circles around the problem.

The frustrating thing is that the AI engines do a good job at summarizing and breaking problems down which makes it all sound very convincing. But when it comes to finding solutions for actual problems that are difficult I've struck out way more than I've had success.

In the end, I ended up throwing out the async code and using sync code to get this to work the way it needs to work - not my choice but I can't waste more time on this issue.
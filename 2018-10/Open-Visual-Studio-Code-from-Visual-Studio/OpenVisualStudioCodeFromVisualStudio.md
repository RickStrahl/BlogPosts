---
title: 'Tip: Open Visual Studio Code from Visual Studio as an External Tool'
abstract: I use both Visual Studio and Visual Studio Code in my development. Although I tend to still default to the full version of Visual Studio, I tend to run Visual Studio Code side by side with Visual Studio and flip back and forth a lot. To make things a little easier and being able to jump directly to a document in VS Code from full VS you can create an External Tool entry and a shortcut mapping to quickly open documents and/or folders in VS Code.
categories: Visual Studio, Visual Studio Code
keywords: Visual Studio, Visual Studio Code, External Tools, ShortCut
weblogName: West Wind Web Log
postId: 962289
postDate: 2018-10-06T11:33:07.7553542-10:00
---
# Tip: Open Visual Studio Code from Visual Studio as an External Tool

When working on .NET and mostly server side Web development I tend to use the full version of Visual Studio. I also use Visual Studio Code separately quite often for client side development as well as a general purpose editor. 

Although Visual Studio Code is pretty awesome and getting more feature rich all the time (mostly via plug-ins), the full version of Visual Studio still has many editor enhancements - especially in the way of auto-completion for dependencies and navigation to dependencies - that are simply much better integrated than VS Code. CSS intellisense, library auto-completions, drag and drop of scripts and cross document (f12) navigation of code, css and script as well as the host of refactoring options (especially with Resharper) are just a few of the things that make full Visual Studio more productive to me that I often default to Visual Studio rather the VS Code.

Until I'm heads down typing gobs of HTML or JavaScript... and **then** I prefer VS Code. Because lets face it the full Visual Studio is pretty laggy (even with my new 12 core beast of a laptop) especially if you have third party refactoring/code analysis tools installed (hint: Resharper which I turn off most of the time now due to the overhead it causes). The VS Code editor just feels buttery smooth especially compared to the full VS editor and that can make writing gobs of code much quicker in some situations. I also love the simple way you can create code snippets in VS code, compared to the more clunky and verbose Visual Studio snippet syntax let alone having to hunt down the snippets in an obscure buried folder. Finally many client side tool addons for modern libraries and snippets show up in Visual Studio Code and not in Visual Studio. For example, to get a decent set of Bootstrap 4 snippets I had to go to VS code.


##AD##

### Using Both Visual Studio and Visual Studio Code
Long story short: 

* For most Web projects today I use both Visual Studio and Visual Studio Code **at the same time**
* Both have features that the other is lacking
* I switch back and forth between them quite frequently

Since most of my projects tend to be .NET based, I usually start in Visual Studio and then use VS Code as a fallback when I need things that VS Code tends to do better.

### Open in Visual Studio Code as an External Tool
So here's a little tip that makes things easier: A quick way to open VS Code from Visual Studio. Now I know [Mads Kristensen has a Open in Visual Studio Code Extension](https://marketplace.visualstudio.com/items?itemName=MadsKristensen.OpeninVisualStudioCode), but I dunno - an extension seems a bit much when you can simply set up an external tool mapping.

The [External Tools option in Visual Studio](https://docs.microsoft.com/en-us/visualstudio/ide/managing-external-tools?view=vs-2017) seems to be under appreciated in Visual Studio, as I see few people using it. It's quite useful as you can add any arbitrary executables and run them with parameters that let you point at the current item, path etc. It's a great way to integrate external executable tools and applications that you want to have quick access to.

For example, [I have shortcuts](https://weblog.west-wind.com/posts/2015/Jan/09/Tip-Create-a-Visual-Studio-Menu-option-to-Open-a-Command-Window) to open my custom [XPlorer2](https://www.zabkat.com/) or a [ConEmu](https://conemu.github.io/) console in the selected folder which I use all the time. Sure I can install addins for all these but the last thing I want to 3 separate addins for each type of document I want to open or application I want to run. A more light weight approach is to use an External Tool and add a hotkey.

To add a new External Tool go to **Tools-> External Tools** then **Add** a new item:

![](https://weblog.west-wind.com/images/2018/Open-Visual-Studio-Code-from-Visual-Studio/ExternalToolOpenInVsCode.png)

I can point at my local Visual Studio install path (which in latest versions is `%localappdata%\Programs\Microsoft VS Code\Code.exe`) and add an Argument of `$(itemPath)`. This parameter picks up the active Solution Explorer item that's selected, and so it is either a file or folder. 

If you select a file, the file is opened on its own, if it's a folder the folder is opened in the VS Code Folder pane which is great. Once it's done it shows up on the External Tools list:

![](https://weblog.west-wind.com/images/2018/Open-Visual-Studio-Code-from-Visual-Studio/ExternalToolOnMenu.png)

For bonus points you can also add a hotkey which you can do by using **Tools->Options->Keyboard** and then searching for **ExternalCommand**. Command hot keys can be set in positional order so in the figure the third item is my VS Code opener that I assign *Ctrl-Alt-V* to.

![](https://weblog.west-wind.com/images/2018/Open-Visual-Studio-Code-from-Visual-Studio/AssignHotKey.png)


The one downside to External Tools is that they are not easily exportable. So if you re-install Visual Studio on another machine those same external applications have to be reconfigured. Also the hotkeys are only positional so you have to make sure you keep your hotkeys synced to the items you keep on this menu in the proper order. Not a big deal - I tend to have very few of these and the order rarely matters.

Still I use the heck out of `Ctl-Alt-\` to open a console and `Ctrl-Shift-\` to open Explorer. And I suspect I'll be doing a lot more `Ctrl-Alt-V` now too that VS Code is hooked up to that hotkey.

### Switch Me
So now when I'm working in Visual Studio and I quickly want to jump to Visual Studio code I can do so easily by pressing *Ctrl-Alt-V*. Visual Studio Code is also smart enough to know if a folder or file is already open and it jumps me right back to the already open 'project' and or file so if I flip back and forth I can even keep my place in the document where I left off.

It's the little things that make things easier...
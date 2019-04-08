---
title: 'Tip: Create a Visual Studio Menu option to Open a Command Window'
abstract: I'm finding myself using the command line more and more, especially with ASP.NET vNext for running Web apps from the command line, accessing git and JavaScript build tools. Here's a real easy way to pop open a Command Window in the active project directory from Visual Studio.
categories: Visual Studio
keywords: Console,Visual Studio
weblogName: West Wind Web Log
postId: 922728
permalink: https://weblog.west-wind.com/posts/2015/Jan/09/Tip-Create-a-Visual-Studio-Menu-option-to-Open-a-Command-Window
postDate: 2015-01-09T02:35:49.0000000
---
# Tip: Create a Visual Studio Menu option to Open a Command Window


This isn’t exactly news, but I’ve been doing a lot more work with the command line these days from using build tools, file monitors, local Web servers, running Git, to doing Cordova builds and so on. My typical workflow for this has been to click on my [Console2](http://sourceforge.net/projects/console/) shortcut on the Windows shortcut menu and then copy and paste the path to my project that’s buried 5 levels down from the root usually. This works, but gets tedious after a while.

BTW, if you need any convincing on using [Console2](http://sourceforge.net/projects/console/) over the plain vanilla command prompt, check out [Scott Hanselman’s blog post](http://www.hanselman.com/blog/Console2ABetterWindowsCommandPrompt.aspx) from a few years back (he has several actually) – it’s an extremely worthwhile shell replacement if for nothing else than the easier cut and paste features, but you also get multiple tabbed command shells and support for pre-configured shells of Command Prompts, PowerShell, Bash etc.. You can basically create custom shells for anything that has a CLI.

Here’s a screen shot of Console 2 in this case fired from a vNext project in a project folder.

![Console2](http://weblog.west-wind.com/images/2015Windows-Live-Writer/Open-a-Command-Window-from-Visual-Studio_F4D5/Console2_thumb.png "Console2")

Anyway, back to Visual Studio: My most common scenario for opening a command prompt is that I’m in Visual Studio and decide I need to shell out quickly for doing one of the tasks I mentioned above. I usually switch to a folder I typically have open on the project or use Visual Studio’s Open in Folder option to get to the folder in Explorer and copy the path from Explorer’s Address bar.  I then click on a shortcut on my Windows task bar to fire up Console 2 and paste in the path. It’s even worse if you use the plain Windows Command prompt as you can’t just paste the path – you have to use the menus. Either way it’s obviously very tedious.

##AD##

### Using External Tools in Visual Studio

One of the often overlooked features buried in the pile of features in Visual Studio is the *External Tools* section on the *Tools* menu.

![ToolsMenu](http://weblog.west-wind.com/images/2015Windows-Live-Writer/Open-a-Command-Window-from-Visual-Studio_F4D5/ToolsMenu_thumb.png "ToolsMenu")

The External Tools section tends to be near the bottom of the big menu and there are a number of items in there already. I killed the C++ related ones so my list is a little shorter than what is usually there and I’ve already added my Windows Command Line menu option that you see as the first entry.

To add Console2 as a tool click the External Tools button and add it like this:

![AddExternalTool](http://weblog.west-wind.com/images/2015Windows-Live-Writer/Open-a-Command-Window-from-Visual-Studio_F4D5/AddExternalTool_thumb.png "AddExternalTool")

Click add to add a new tool, then type in name and point at your EXE file. In my case console.exe is in my user path globally so I don’t have to specify a path, but if it isn’t use the directory selector instead and point at the actual file on disk.

In order to get the shell to open in the correct folder use Console.exe’s **–d** switch and set it to the $(ProjectDir).

Once you click OK the new menu option is immediately available in the Tools menu.

### Other Command Prompts to Open

You can of course open other prompts. Maybe you like to open a plain Windows Command Prompt, Powershell, Bash or ConEmu.

Here are a few variations:

#### Windows Command Prompt

**Command:**  
`cmd.exe`

**Initial Directory:**  
`$(ItemDir)`

#### Powershell

**Command:**  
`C:\windows\system32\windowspowershell\v1.0\powershell.exe`

**Initial Directory:**  
`$(ItemDir)`

#### Powershell Admin

**Command:**  
`C:\windows\system32\windowspowershell\v1.0\powershell.exe`

**Arguments:**  
`-Command “Start-Process PowerShell -Verb RunAs”`

**Initial Directory:**  
`$(ItemDir)`

#### ConEmu with PowerShell

**Command:**  
`C:\Program Files\ConEmu\ConEmu64.exe`

**Arguments:**  
`/dir $(ItemDir) /cmd {Powershell}`

Where `{Powershell}` is the name of one of the predefined consoles in the ConEmu Settings. If you'd rather run an elevated prompt you can use this instead:

**Arguments:**  
`/dir $(ItemDir) /cmd {Powershell:Admin}`

Once you’re done, click OK and then you should find your option on the Tools menu ready for use.

##AD##

### Setting a Keyboard ShortCut

This still leaves you with a keystroke plus probably some mousing to get to the actual menu option since it’s in the middle of the menu – no quick access.

If you rather like to key-surf, you can add a short cut using the Tools | Options | Keyboard settings:

![ShortCut](http://weblog.west-wind.com/images/2015Windows-Live-Writer/Open-a-Command-Window-from-Visual-Studio_F4D5/ShortCut_thumb.png "ShortCut")

Search for **Tools.ExternalCommand** to find the list of external commands that are assignable. Commands are numbered 1 –24 in the order they are defined in the list. I moved my Command Prompt to position #1, but you can just count out (1 based) the position and use that ExternalCommand number instead. Set the menu option to an available key combination – I use Ctl-Shift-\ – and you’re off.

And voila – I can now press Ctrl-Shift-\ anytime to open a command prompt in my project folder.

### Opening a Command Prompt from Explorer Menus

You probably know that in Windows Explorer you can right click and hold down the shift key on a folder and to get a menu option to Open *Command Window here*.

If you’d rather use Console 2 as I do you can easily add a menu shortcut to your Explorer shortcuts like this:

![Console2ShortCut](http://weblog.west-wind.com/images/2015Windows-Live-Writer/Open-a-Command-Window-from-Visual-Studio_F4D5/Console2ShortCut_thumb.png "Console2ShortCut")

There are two different ways that this option can be accessed:

- Selecting a directory in the tree
- Inside of a directory folder


The following .reg file will push the above to the shortcut menus:

Windows Registry Editor Version 5.00

```
[HKEY_CLASSES_ROOT\Directory\shell\open_console]
@="Open with Console2" Icon="C:\\utl\\Console.ico"
[HKEY_CLASSES_ROOT\Directory\shell\open_console\command]
@="\"C:\\utl\\Console.exe\" -d \"%v\"" [HKEY_CLASSES_ROOT\Directory\Background\shell\open_console]
@="Open Console2 Here"
"Icon"="c:\\utl\\console.exe" [HKEY_CLASSES_ROOT\Directory\Background\shell\open_console\Command]
@="\"C:\\utl\\Console.exe\" -d \"%v\""

```

In my case Console2 lives in a c:\utl folder – you’ll have to adjust the path for the EXE and ICO files. Of course if you prefer a plain command prompt just switch to cmd.exe instead.

I find both opening a Command Prompt in Visual Studio via a shortcut key and in Windows Explorer and with a simple right click very useful every day. Maybe this will inspire you too to make it a little bit easier to get to a command prompt…
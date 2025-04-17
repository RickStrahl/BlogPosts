---
title: Dragging and Dropping Images and Files into the Web Browser Control
abstract: Dragging content into the Web Browser control and capturing the content dropped can be tricky. The Web Browser Control is based on Internet Explorer and is actually an ActiveX control hosted inside of a container and because of that is difficult to deal with. In this post I describe how you can get around this issue and still capture images and files dropped on the control and handle the drop operations.
categories: Internet Explorer, WPF, WinForms, Windows, FoxPro
keywords: Drag and Drop, Files, Embedding, Navigating, Internet Explorer
weblogName: West Wind Web Log
postId: 169717
---
# Dragging and Dropping Images and Files into the Web Browser Control

![Drag Racing](Dragster.jpg)
 
Dragging content into the Web Browser control and capturing the content dropped is tricky. The Web Browser Control is based on Internet Explorer and is actually an ActiveX control hosted inside of a container. If you're running .NET and embedding the Web Browser control you're actually embedding an ActiveX control and there are some limitations on how the container interacts with drop events (and quite a few other things actually).

Standard drag and drop operations that you can use on standard WPF or WinForms controls don't work with the Web browser control, so you have to resort to other approaches that I'll cover in this post so I can do this:

![](DraggingImagesIntoMarkdownMonster.gif)

> #### @icon-warning No Drag and Drop in Admin Mode
> If you're running your application as Administrator Drag and Drop - even onto a main window and also non text clipboard operations like image pasting - is not allowed. This can bite you if you run Visual Studio in Administrator mode and you try to debug your application. To test drag and drop and clipboard operations make sure you always run as a non-elevated user.

##AD##

### Web Browser Controls and Drop Events
The Web Browser control itself in the host doesn't support Drag and Drop operations. Neither the WinForms nor WPF (nor the ActiveX container in older Win32 apps) support drop operations, so if you do something like:

```csharp
WebBrowser.AllowDrop = true;
WebBrowser.Drop += (s,e) => { /* never fires */ };
```

the drop event code never actually fires, so that doesn't work.

### HTML DOM Based Drop Events
You can however implement a drop event **inside of the HTML page** using the **window.ondrop** handler running inside the Web Browser control, but that requires that you control the content which may or may not be the case.

With JavaScript inside of the loaded HTML page you can do something like this to capture the image content from a single dropped file:

```javascript
window.ondrop = function (e) {
        // don't replace document
        e.preventDefault();
        e.stopPropagation();

        // capture file
        var dt = e.dataTransfer;
        var files = dt.files;

        var file = files[0];        
        
        var reader = new FileReader();
        reader.onload = function(e) {
            var res = e.target.result;

            var pos = $.extend({}, te.mousePos);

            var sel = te.editor.getSelection();
            var range = sel.getRange();
            range.setStart(pos);
            range.setEnd(pos);
            sel.setSelectionRange(range);

            // push the captured image data to the host application
            // te.mm is a WPF object and textbox is the browser/editor instance
            te.mm.textbox.FileDropOperation(res, file.name);
        }
        try {
            bin = reader.readAsDataURL(file); //ReadAsArrayBuffer(file);
        } catch (ex) {
            status("Drag and drop error: " + ex.message);
        }
    };
```    

Inside of my .NET code I can pick up the file with:

```csharp
/// <summary>
/// Fired by the browser when a file is dropped. This method
/// looks at the filename dropped and if it's an image handles
/// it. Otherwise an error is displayed and recommended to 
/// drop files on the header since we cannot capture the filename
/// of the originally dropped files.
/// </summary>
/// <param name="hexData"></param>
/// <param name="filename"></param>
/// <returns></returns>
public bool FileDropOperation(string hexData, string filename)
{
    var docPath = Path.GetDirectoryName(MarkdownDocument.Filename);
    string imagePath = null;

    var ext = Path.GetExtension(filename.ToLower());

    if (ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif")
    {
        ShowMessage(
            "To open or embed dropped files in Markdown Monster, please drop files onto the header area of the window.\r\n\r\n" +
            "You can drop text files to open and edit, or images to embed at the cursor position in the open document.",
            "Please drop files on the Window Header", "Warning", "Ok");
        return false;
    }

    var sd = new SaveFileDialog
    {
        Filter =
            "Image files (*.png;*.jpg;*.gif;)|*.png;*.jpg;*.jpeg;*.gif|All Files (*.*)|*.*",
        FilterIndex = 1,
        Title = "Save dropped Image as",
        InitialDirectory = docPath,
        FileName = filename,
        CheckFileExists = false,
        OverwritePrompt = true,
        CheckPathExists = true,
        RestoreDirectory = true
    };
    var result = sd.ShowDialog();
    if (result == null || !result.Value)
        return true;

    string relFilePath = FileUtils.GetRelativePath(sd.FileName, docPath);

    var tokens = hexData.Split(',');
    var prefix = tokens[0];
    var data = tokens[1];

    var bytes = Convert.FromBase64String(data);
    File.WriteAllBytes(sd.FileName, bytes);

    SetSelectionAndFocus($"![]({relFilePath.Replace("\\", "/")})");
    return true;
}
```

Again this works, but there are few problems here:

* You need to be in control of the page to add the **window.ondrop** code
* You can't get the full path to the file
* You have to prompt to save the file

While you do get a **file.name** property, that property doesn't include the full local path, only the actual pathless filename so if you drag a file from Explorer you can't access the full path.

In Markdown Monster I have two scenarios: I want to open text files dropped on the editor, or I want to embed images into the content. The latter is doable by simply forcing the user to re-save the file with a new name. This is actually Ok because in most case you'd probably want to move the file anyway. BUt the former scenario of opening an existing file doesn't really work. While I could copy the file to disk and then edit it, I wouldn't be able to know where to save to the original location the user dragged from which is not acceptable. :angry:

##AD##

### A better way: Using the Navigating Event
It may not seem obvious, but you can actually detect drop events by checking for browser navigation. Whaaaat?

When you drop a file on the WebBrowser control, the control actually assumes you want to open that file and it internally tries to navigate to that file. You can intercept the **Navigating** event and pick up the file name(s) dropped.

Note that this assumes the document in the browser doesn't handle the a drop operation internally - if it has a drop handler that will supersede the navigation.

Handling the **Navigating** event solves the problems described in the last section. Here I don't get binary data, but just the fully qualified file name(s) that come in as the document's navigation Uri. With this I can capture the files and based on what types of files I'm dealing with either open the files (text files) or embed images directly into the document (image embedding).

Start by hooking up a **Navigating** handler:

```csharp
WebBrowser.Navigating += WebBrowserNavigatingAndDroppingFiles;
```

Then implement the handler with something like the following. The code picks up files and decides whether to open dropped file(s) in the editor or embed image links into the document:

```csharp
/// <summary>
/// Handle dropping of files 
/// </summary>
/// <param name="sender"></param>
/// <param name="e"></param>
private void WebBrowser_NavigatingAndDroppingFiles(object sender, NavigatingCancelEventArgs e)
{
    var url = e.Uri.ToString().ToLower();
    if (url.Contains("editor.htm") || url.Contains("editorsimple.htm"))
        return; // continue navigating

    // otherwise we either handle or don't allow
    e.Cancel = true;

    // if it's a URL or ??? don't navigate
    if (!e.Uri.IsFile)
        return;

    string file = e.Uri.LocalPath;
    string ext = Path.GetExtension(file).ToLower();

    if (ext == ".png" || ext == ".gif" || ext == ".jpg" || ext == ".jpeg" || ext == ".svg")
    {
        var docPath = Path.GetDirectoryName(MarkdownDocument.Filename);
        string imagePath = null;

        // if lower than 1 level down off base path ask to save the file
        string relFilePath = FileUtils.GetRelativePath(file, docPath);
        if (relFilePath.StartsWith("..\\..") || relFilePath.Contains(":\\"))
        {
            var sd = new SaveFileDialog
            {
                Filter =
                    "Image files (*.png;*.jpg;*.gif;)|*.png;*.jpg;*.jpeg;*.gif|All Files (*.*)|*.*",
                FilterIndex = 1,
                Title = "Save dropped Image as",
                InitialDirectory = docPath,
                FileName = Path.GetFileName(file),
                CheckFileExists = false,
                OverwritePrompt = true,
                CheckPathExists = true,
                RestoreDirectory = true
            };
            var result = sd.ShowDialog();
            if (result == null || !result.Value)
                return;

            relFilePath = FileUtils.GetRelativePath(sd.FileName, docPath);

            File.Copy(file, relFilePath, true);
        }

        if (!relFilePath.Contains(":\\"))
            relFilePath = relFilePath.Replace("\\", "/");
        else
            relFilePath = "file:///" + relFilePath;

        // push into Ace Editor JavaScript control
        AceEditor.setselpositionfrommouse(false);
        SetSelectionAndFocus($"![]({relFilePath})");
    }
    else if (mmApp.AllowedFileExtensions.Contains($",{ext.Substring(1)},"))
    {
        Window.OpenTab(e.Uri.LocalPath);
    }
}
```

This code checks first to see if it's allowed to load the file requested by the navigation. In my case I only allow my Editor to load so there are two allowable pages - **Editor.htm** and **EditorSimple.htm** -  and these pages are loaded as always.

Anything else is something 'dropped' onto the browser window and I need to deal with it. The first thing is to cancel the navigation - we don't want to actually open a new document in the browser.

If the file(s) dropped is an image, I want to embed the image as an image link. If the image is in a non-relative path I offer to save it locally otherwise the image is just linked directly.

If the dropped file is a text file in one of the supported formats I simply open it in a new tab in the editor.

When it's all said in done, I can now drag images into the editor like this:

![](DraggingImagesIntoMarkdownMonster.gif)

The same works with text files which open rather than embedding a link.

### Tip: JavaScript debugging in the Web Browser Control
If you take the route of handling `window.ondrag` events in the HTML of your page, you might like to have some debugging help by plugging in the FireFox Lite debugger into your page, since natively the Web Browser control doesn't support debugging or even console output.

* [Debugging the Web Browser Control with Firebug Lite](https://weblog.west-wind.com/posts/2017/Mar/08/Debugging-the-Web-Browser-Control-with-FireBug)

##AD##

### Summary
Cool - I've been noodling with how to make this work for a while and I was looking in all the wrong places figuring I'd have to deal with Drop events. Drag and Drop in Windows is always a pain, but with this approach in the Navigating handler I get to bypass that completely. Not obvious, but that's what this post is for.

(mic drop)

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
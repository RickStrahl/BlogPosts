---
title: Retrieving Images from the Clipboard and WPF Image Control Woes
weblogName: West Wind Web Log
postDate: 2020-08-26T09:48:18.6897325-10:00
customFields:
  mt_github:
    key: mt_github
    value: https://somesite.com
---
# Retrieving Images from the Clipboard and WPF Image Control Woes

![](CutPaste.png)

Getting images from the clipboard correctly in WPF - or heck in general in Windows - is hard if you need it to be consistent and accurate. The Windows clipboard is based on ancient Windows APIs and the way many things on the clipboard are formatted by default is pure insanity. If you need an example just try to use copy and paste HTML content to and from the clipboard (ugh!). 

By comparison images are a little not quite as bad, but it's not straight forward either. The problem with image retrieval from the clipboard is that there's no single standard format.  Rather applications that push images onto the clipboard, just blast a load of different image formats onto the clipboard leaving a client application guessing of which image type to use. Worse even amongst those formats provided the actual image content may vary and in the process you may loose image quality or more commonly - transparency. To top things off the WPF `Clipboard.GetImage()` method doesn't work with some image formats and fails silently producing an invalid bitmap that can't be displayed or saved correctly.

Specifically in WPF `Windows.System.Clipboard.GetImage()` fails with some common image formats, most prominently [SnagIt from Techsmith](https://techsmith.com/snagit) and classic Windows Paint - there are probably more but those are two that I've noticed.

### Image Formats
When an application puts images onto the clipboard, it tends to put them on there in multiple formats so that various client applications and old tools and applications can work and use the image content as well as more modern applications. Unfortunately it looks like modern technologies and image formats are an after thought and only provided 'unofficially'.

At the end of the day images on the clipboard are bitmaps but the default formats provided and how they are supported by different applications that paste images to the clipboard is nothing short of confusing.

I came to this problem - once again - in Markdown Monster which has a number of ways that it allows images to be imported from the clipboard:

* The image dialog that picks up images from the clipboard by default
* Pasting images into open documents at the cursor position
* Pasting images into the Azure Blob Storage Addin for publishing and linking

All of these mechanisms need to get image data from the clipboard. Take a look at all the image formats that you get when you capture a pasted image from Word for example:

```txt
 - Art::GVML ClipFormat
 - GIF
 - EnhancedMetafile
 - System.Drawing.Imaging.Metafile
 - MetaFilePict
 - Bitmap
 - System.Drawing.Bitmap
 - System.Windows.Media.Imaging.BitmapSource
 - PNG
 - JFIF
 - Object Descriptor
 - Art::GVML ClipFormat
 - GIF
 - EnhancedMetafile
 - System.Drawing.Imaging.Metafile
 - MetaFilePict
 - Bitmap
 - System.Drawing.Bitmap
 - System.Windows.Media.Imaging.BitmapSource
 - PNG
 - JFIF
 - Object Descriptor
```

Wholly crap that's a lot of formats. In this case using the `PNG` format is probably the best choice. Then look at what SnagIt sends:

```txt
 - DeviceIndependentBitmap
 - Bitmap
 - System.Drawing.Bitmap
 - System.Windows.Media.Imaging.BitmapSource
 - Format17
 - {A87846A4-38CA-4be3-BDF1-71EF821EF333}
 - DeviceIndependentBitmap
 - Bitmap
 - System.Drawing.Bitmap
 - System.Windows.Media.Imaging.BitmapSource
 - Format17
 - {A87846A4-38CA-4be3-BDF1-71EF821EF333}
```

Much shorter list as you can see and no `PNG` for example. Here the System.Drawing. Bitmap can be used to retrieve the image. Using `System.Windows.Media.Imaging.BitmapSource` however fails to produce a valid one for example.

You get the idea. Each application has different types and even among the image types there are variations.

### What's wrong with Clipboard.GetImage()
Ok, so what does all this mean? It means that retrieving images from the clipboard is not quite as easy as using `System.Windows.Clipboard.GetImage()` or even `System.Windows.Forms.Clipboard.GetImage()`. While the latter always works, the latter does not support transparency. The former supports transparency, but it doesn't work with all image types from all applications.

This means sometimes these functions are what should be used and at yet other times a different format has to be used.

Let's start out with the obvious: You might say it's pretty easy to get image data using the WPF `System.Windows.Clipboard.GetImage()` API which retrieves a BitmapSource that can then be assigned to any image source:

```cs
BitmapSource src =  var src = System.Windows.Clipboard.GetImage();
ImageControl1.Source = src;
```

Easy right? Well...

#### BitmapSource - Seriously?
There are a number of problems with this heavy handed API. For one, it returns a high level UI object, a `BitmapSource` which is a wrapper around an image but one that doesn't expose the raw image directly itself. While an image source sounds like a great idea for showing images in the WPF UI, it's terrible for a Clipboard API because **there are many use cases that need to retrieve images directly into raw data**.  For example in Markdown Monster I need to capture images from the clipboard and save them to disk, for pasting into Markdown documents and then displaying the images in the HTML previewer. There's no `ImageSource` involved in that process, but if I want to use only the WPF API, I now have to capture to image source and then use a non-existing conversion routine that has to be created to convert the Bitmap source to a Bitmap that can be saved. 

That said, it's not too complicated to convert a bitmap but it's insane to think that BitmapSource (or some other WPF API) doesn't include a way to convert a BitmapSource to Bitmap. The arrogance of the designers that you'd never use a raw bitmap is thick...

Luckily it's not too hard to find a conversion routine like this:

```cs
public static Bitmap BitmapSourceToBitmap(BitmapSource source)
{
    if (source == null)
        return null;

    var pixelFormat = PixelFormat.Format32bppArgb;  //Bgr32 default
    if (source.Format == PixelFormats.Bgr24)
        pixelFormat = PixelFormat.Format24bppRgb;
    else if(source.Format == PixelFormats.Pbgra32)
        pixelFormat = PixelFormat.Format32bppPArgb;
    else if(source.Format == PixelFormats.Prgba64)
        pixelFormat = PixelFormat.Format64bppPArgb;
    
    Bitmap bmp = new Bitmap(
        source.PixelWidth,
        source.PixelHeight,
        pixelFormat);

    BitmapData data = bmp.LockBits(
        new Rectangle(Point.Empty, bmp.Size),
        ImageLockMode.WriteOnly,
        pixelFormat);

    source.CopyPixels(
        Int32Rect.Empty,
        data.Scan0,
        data.Height * data.Stride,
        data.Stride);

    bmp.UnlockBits(data);

    return bmp;
}
```

And just for good measure here's the reverse functionality that converts a Bitmap to a BitmapSource:

```cs
[DllImport("gdi32.dll")]
[return: MarshalAs(UnmanagedType.Bool)]
internal static extern bool DeleteObject(IntPtr hObject);

public static BitmapSource BitmapToBitmapSource(Bitmap bmp)
{
    var hBitmap = bmp.GetHbitmap();
    var imageSource = Imaging.CreateBitmapSourceFromHBitmap(hBitmap, IntPtr.Zero,
        System.Windows.Int32Rect.Empty,
        System.Windows.Media.Imaging.BitmapSizeOptions.FromEmptyOptions());
    DeleteObject(hBitmap);
    return imageSource;
}
```        

It works but it takes extra code to run, extra memory etc. and in a case where you need to work with raw bitmaps rather than image sources, all of that is overhead.

This works but it's extra effort that simply should not be necessary.

### Clipboard.GetImage() isn't reliable
The more serious problem with `System.Windows.Clipboard.GetImage()` is that it's not reliable across all image types. In Markdown Monster I've had all sorts of issues with images loaded through this function coming back blank. The image off the clipboard has the right pixel count and even has what appears to be some binary data, image data is effectively blank.

When loading the image into the image source it will be blank, and when saving to file, a appropriate for the pixel size is created but the image data is basically invalid. 

Some examples of applications that don't work include images from [SnagIt](https://www.techsmith.com/screen-capture.html) and classic Windows Paint.  Not exactly obscure applications.

This is apparently a known bug in WPF that has been known for a long time, was complained about over many versions and never fixed.

### What about Windows.Forms.Clipboard.GetImage()
So the WPF version of `Clipboard.GetImage()` is not super reliable, but it's possible to use  `Windows.Forms.Clipboard.GetImage()` instead. This version of `Clipboard.GetImage()` returns a Bitmap object and, most importantly it's reliable. It works with all image types.

Lots of people abhor the the fact that you have to add `System.Windows.Forms` to a WPF applications, but seriously that's hardly a burden. If you're building a reasonably sized WPF application chances are there are other things from `System.Windows.Forms` is going to be required. Personally I don't have a problem with adding `System.Windows.Forms` into a WPF application.

The good news is that this works reliably. 

But... there's bad news too:The Windows Forms version **doesn't respect transparency** of images. 

Depending on your application this may or may not matter. In fact, in Markdown Monster I've for the longest time used the Windows Forms clipboard. If you're dealing almost exclusively with screen shots or camera images, then transparency is not that important the Windows.Forms clipboard is just fine. 

However if your application needs to generically accept images, maintaining transparency is somewhat important.

### Woe me - what to do?
So trade offs it is: I can get reliable image pasting with Windows Forms Clipboard, but no transparency. Or I can get transparency and unreliable image pasting that won't work from some applications.

For example, until recently Markdown Monster used the `Windows.Forms` clipboard for reliability. But due to occasional bug reports that transparency wasn't working for pasted images and I switched to the WPF clipboard. Then I started getting bug reports that images pasted from SnagIt weren't working. 

Damned if you do, damned if you don't...

### Low Level Image Conversions?
If you do any sort of search of WPF Clipboard and images you are likely to find a ton of different solutions that claim to reliably retrieve images from the clipboard.

One of the better ones is this old one from Thomas Levesque:

[Paste an image from the clipboard (bug in Clipboard.GetImage)](https://thomaslevesque.com/2009/02/05/wpf-paste-an-image-from-the-clipboard/) which aims at the same problem I'm describing here. Thomas' approach is the low level bit copy that copies the raw HBITMAP into a memory image.

Unfortunately this solution too, doesn't address transparency properly.

There are other solutions out there (like [this one](https://stackoverflow.com/questions/30727343/fast-converting-bitmap-to-bitmapsource-wpf))  that handle the transparency, but then have other color profile issues. In short, none of the solutions I've looked at and tweaked with solve the clipboard image retrieval reliably.

### Image Formats - again!
As mentioned earlier, the key to perhaps somewhat better support might be bypassing `GetImage()` and instead directly retrieving the raw image form using `Clipboard.GetDataObject()`. This lets you get the raw image format. 

In addition, it's also possible to query all the supported image formats with `Clipboard.GetFormats()` which I used to retrieve the list of all the supported image formats and then attempted to glean some patterns from the formats and use the appropriate function to retrieve the clipboard image.

I captured the image formats for a number of image types from different apps using this code:

```cs
var dataObject = Clipboard.GetDataObject();

var formats = dataObject.GetFormats(true);
if (formats == null || formats.Length == 0)
    return null;

foreach (var f in formats)
    Debug.WriteLine(" - " + f.ToString());
```            

Here are all the image formats some applications are generating:

Windows Alt/Ctl Print Screen

```txt
 - Bitmap
 - System.Drawing.Bitmap
 - System.Windows.Media.Imaging.BitmapSource
 - DeviceIndependentBitmap
 - Format17
```

Windows Clipping Tool

```txt
 - Bitmap
 - System.Drawing.Bitmap
 - System.Windows.Media.Imaging.BitmapSource
 - DeviceIndependentBitmap
 - Format17
 - Bitmap
 - System.Drawing.Bitmap
 - System.Windows.Media.Imaging.BitmapSource
 - DeviceIndependentBitmap
 - Format17
``` 

WPF Clipboard.SetImage()

```txt
 - Bitmap
 - System.Drawing.Bitmap
 - System.Windows.Media.Imaging.BitmapSource
 - Bitmap
 - System.Drawing.Bitmap
 - System.Windows.Media.Imaging.BitmapSource
```


Chromium Browser (Edge and Chrome):

```txt
 - Bitmap
 - System.Drawing.Bitmap
 - System.Windows.Media.Imaging.BitmapSource
 - HTML Format
 - DeviceIndependentBitmap
 - Format17
```


FireFox:

```txt
 - HTML Format
 - text/_moz_htmlinfo
 - text/_moz_htmlcontext
 - application/x-moz-file-promise-url
 - application/x-moz-file-promise-dest-filename
 - FileDrop
 - FileNameW
 - FileName
 - Preferred DropEffect
 - application/x-moz-nativeimage
 - Format17
 - DeviceIndependentBitmap
 - text/html
 - HTML Format
 - text/_moz_htmlinfo
 - text/_moz_htmlcontext
 - application/x-moz-file-promise-url
 - application/x-moz-file-promise-dest-filename
 - FileDrop
 - FileNameW
 - FileName
 - Preferred DropEffect
 - application/x-moz-nativeimage
 - Format17
 - DeviceIndependentBitmap
```


Paint .NET:

```txt
 - PaintDotNet.Rendering.MaskedSurface
 - PNG
 - Format17
 - DeviceIndependentBitmap
 - Bitmap
 - System.Drawing.Bitmap
 - System.Windows.Media.Imaging.BitmapSource
```

Image copied from MS Word:

```txt
 - Art::GVML ClipFormat
 - GIF
 - EnhancedMetafile
 - System.Drawing.Imaging.Metafile
 - MetaFilePict
 - Bitmap
 - System.Drawing.Bitmap
 - System.Windows.Media.Imaging.BitmapSource
 - PNG
 - JFIF
 - Object Descriptor
 - Art::GVML ClipFormat
 - GIF
 - EnhancedMetafile
 - System.Drawing.Imaging.Metafile
 - MetaFilePict
 - Bitmap
 - System.Drawing.Bitmap
 - System.Windows.Media.Imaging.BitmapSource
 - PNG
 - JFIF
 - Object Descriptor
```

The following two are examples of formats that **don't work with `System.Windows.Clipboard.GetImage()`:

SnagIt (doesn't work with ImageSource)

```txt
 - DeviceIndependentBitmap
 - Bitmap
 - System.Drawing.Bitmap
 - System.Windows.Media.Imaging.BitmapSource
 - Format17
 - {A87846A4-38CA-4be3-BDF1-71EF821EF333}
 - DeviceIndependentBitmap
 - Bitmap
 - System.Drawing.Bitmap
 - System.Windows.Media.Imaging.BitmapSource
 - Format17
 - {A87846A4-38CA-4be3-BDF1-71EF821EF333}
```

Paint (doesn't work with ImageSource)

```txt
 - Embed Source
 - Object Descriptor
 - MetaFilePict
 - DeviceIndependentBitmap
 - Embed Source
 - Object Descriptor
 - MetaFilePict
 - DeviceIndependentBitmap
 - Embed Source
 - Object Descriptor
 - MetaFilePict
 - DeviceIndependentBitmap
```


Holy shit that's a lot of different image formats and it all seems pretty random. What do you do with all that?

### Taking a stab at 'Curating' Image Formats
After playing around with this a bit, however I could come up with a few patterns that actually make it possible to use different image retrieval mechanisms depending on the incoming image format. This is probably not 100% foolproof but it certainly works for quite a few common scenarios and will always fall back to the Windows Forms one as a last resort which works, albeit without transparency.

The first thing is to identify the common use cases of where clipboard images come from in a typical document work flow that I use in Markdown Monster:

* Browser Images
* Windows Screen Capture (alt/ctrl prscn)
* Windows Snipping Tool
* SnagIt
* Other Image Capture tools? (not tested)
* Common image Editors - like Paint.NET

For these scenarios I was able to pick out a few patterns:

1. The `PNG` format if provided works reliably for retrieving transparent Bitmaps   
PNG images can be read directly as PNG byte data and read into a `Bitmap` object. Only works for a few applications like Paint.NET and Word as this is not an official format. If this was supported by all apps this would be ideal - easy to detect, easy to convert, supports high resolutions and transparency. 

2. Chromium Browsers and Windows Clipboard Captures always have `Bitmap` as the first entry   
Works with WPF's `Clipboard.GetImage()` and supports transparency. Basically the rule that if `Bitmap` is the first entry in the image format list it appears the WPF clipboard works - might be coincidence but it works for these common apps.

3. Firefox has custom `moz-` Image types  
Works with WPF's `Clipboard.GetImage()` and supports transparency.

4. System.Drawing.Bitmap   
If this type is present we can convert directly into a Bitmap, but transparency is lost.

5. If all else fails   
If all else fails fall back to `System.Windows.Clipboard.GetImage()` which works reliably but  transparency is lost.


This list might be adjusted but this seems to cover the most common scenarios people use. I'd say copying from browsers and using the Windows clip tools or SnagIt are probably the most common scenario, but of course there are lots of other combinations. If you use another app, it would be good to add to the list of formats above but it's likely it'll catch into one of the buckets.

### Implementing the Curated List Clipboard Helper
Given the list above I updated my `ClipboardHelper.GetImage()` method to incorporate the above logic.

Here's what that function looks like:

```cs
/// <summary>
/// Returns an image from the clipboard and capture exception
/// </summary>
/// <returns>Bitmap captured or null</returns>
public static Bitmap GetImage()
{
    try
    {
        var dataObject = Clipboard.GetDataObject();

        var formats = dataObject.GetFormats(true);
        if (formats == null || formats.Length == 0)
            return null;
        foreach (var f in formats)
            Debug.WriteLine(" - " + f.ToString());

        var first = formats[0];

        if (formats.Contains("PNG"))
        {
            Debug.WriteLine("PNG");

            using (MemoryStream ms = (MemoryStream) dataObject.GetData("PNG"))
            {
                ms.Position = 0;
                return (Bitmap) new Bitmap(ms);
            }
        }
        // Guess at Chromium and Moz Web Browsers which can just use WPF's formatting
        else if (first == DataFormats.Bitmap || formats.Contains("text/_moz_htmlinfo"))
        {
            Debug.WriteLine("First == Bitmap");

            var src = System.Windows.Clipboard.GetImage();
            return WindowUtilities.BitmapSourceToBitmap(src);
        }
        else if (formats.Contains("System.Drawing.Bitmap")) // (first == DataFormats.Dib)
        {
            Debug.WriteLine("System.Drawing.Bitmap");
            var bitmap = (Bitmap) dataObject.GetData("System.Drawing.Bitmap");
            return bitmap;
        }
        
        return System.Windows.Forms.Clipboard.GetImage() as Bitmap;
    }
    catch
    {
        return null;
    }
}
```

There's also a `Clipboard.GetImageSource()` which uses a roundabout way to first retrieve a bitmap and then assigns the bitmap to an image source. This is to ensure that the image can be converted and sidesteps the error where an image is not displayed in the image control if copied from Paint or SnagIt.

```cs
/// <summary>
/// Returns an image source from the clipboard if available
/// </summary>
/// <returns>image source or null</returns>
public static ImageSource GetImageSource()
{
    if (!Clipboard.ContainsImage())
        return null;

    var dataObject = Clipboard.GetDataObject();
    var formats = dataObject.GetFormats(true);
    var first = formats[0];

    // native image format should work with native WPF Clipboard.GetImage()
    if (first == DataFormats.Bitmap ||
        formats.Contains("text/_moz_htmlinfo") /* firefox check */)
    {
        return System.Windows.Clipboard.GetImage();
    }

    // retrieve image first then convert to image source
    // to avoid those image types that don't work with WPF GetImage()
    using (var bmp = GetImage())
    {
        // couldn't convert image
        if (bmp == null)
            return null;

        return WindowUtilities.BitmapToBitmapSource(bmp);
    }
}
```

Note that transparency is respected only for the `PNG` and `Bitmap` and `FireFox`  options (the first three). Anything else falls through to retrieving the raw Bitmap or using the Windows Forms clipboard (which technically should never happen). 

This seems to work fairly well, but to be fair I certainly have only tested with a few image tools.


### Summary
Image retrieval from the clipboard is a pain in the ass and all because WPF's `Clipboard.GetImage()` is broken which is sad. The amount of discussion and wasted effort around this fuck-up in WPF is monumental. Do a search and you know what I mean - there's a lot of information out there that also doesn't work or doesn't support.

Perhaps somebody more in tune with image processing can take one of the many bit copying solutions and make them work properly with transparency and PixelFormat translations to reliably produces captured images. It certainly would be much cleaner and more reliable than my curated list in the long run. I took a stab at a few of the existing solutions but didn't have any luck making transparency work reliably in the bit copied images.

Incidentally the [Clipboard Helper class](https://github.com/RickStrahl/MarkdownMonster/blob/master/MarkdownMonster/_Classes/Utilities/ClipboardHelper.cs) includes a number of other Clipboard helpers for WPF. It's got wrappers for retrieving and setting HTML text, and reliably text retrieval (which is notoriously flaky in WPF) that retries failed retrievals if they fail several times.

### Resources

[WPF Clipboard Helper Class on Github (Markdown Monster)](https://github.com/RickStrahl/MarkdownMonster/blob/master/MarkdownMonster/_Classes/Utilities/ClipboardHelper.cs)
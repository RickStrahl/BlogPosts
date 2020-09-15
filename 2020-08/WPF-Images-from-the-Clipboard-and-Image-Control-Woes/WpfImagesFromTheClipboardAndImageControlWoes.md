---
title: WPF Images from the Clipboard and Image Control Woes
weblogName: West Wind Web Log
postDate: 2020-08-26T09:48:18.6897325-10:00
customFields:
  mt_github:
    key: mt_github
    value: https://somesite.com
---
# WPF Images from the Clipboard and Image Control Woes



The simplest, but fairly resource intensive workout is to save the image to a stream, then reload the bitmap and ImageSource:

https://thomaslevesque.com/2009/02/05/wpf-paste-an-image-from-the-clipboard/


```cs
using (var bitmap = ClipboardHelper.GetImage())
{
    using (var ms = new MemoryStream())
    {
        bitmap.Save(ms, ImageFormat.Bmp);
        bitmap.Dispose();

        using (var b2 = new Bitmap(ms))
        {
            image = WindowUtilities.BitmapToBitmapSource(b2);
        }
    }
}
```              

This is simple and easy to understand, and it works. But it's has **a lot of overhead**. The code dumps the image to memory, creates another new bitmap instance (more memory) and then assigns to the image source. It's all short lived, but results in a huge memory spike especially if you have say full 4k screen shot.
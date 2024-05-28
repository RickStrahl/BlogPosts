---
title: Mime Base64 is a Thing?
featuredImageUrl: https://weblog.west-wind.com/images/2024/Mime-Base64-is-a-Thing/MimeBanner.jpg
abstract: Ran into an old legacy application recently that required that attached data was preformatted to Mime Base64 which I never even heard of before. Turns out it's a 'url-safe' version of base64 that replaces certain characters that can be present in base64 with 'safe' characters. In this short post I show a small helper that handles several Base64 Mime operations.
keywords: Base64 Mime
categories: .NET
weblogName: West Wind Web Log
postId: 4416829
permalink: https://weblog.west-wind.com/posts/2024/May/26/Mime-Base64-is-a-Thing
postDate: 2024-05-26T21:50:45.7376140-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Mime Base64 is a Thing?

![Mime Banner](MimeBanner.jpg)

In all my years of developing software, sending binary data back and forth I've never heard of Mime Base64. Apparently that is a thing for email encoding of binary data for some legacy applications that don't directly accept binary content.

This came up recently when working with a customer that is using MailGun's API. We were sending original data from a front end application to the server and found ourselves stymied when trying to attach files that were encoded in plain Base64 and results coming back as `400 - Bad Request`.

## MIME Base64

> MIME Base64 is based on the Base64 encoding but with specific rules for email communication. It ensures that the encoded data is safe for use in email headers and bodies.

Essentially this boils down to a slightly modified format that **is safe for Mime and URL encoding** so it can be used on URLs and form encoded body content in HTTP and email bodies for example.

##AD##

The rules are pretty simple as applied to base Base64 content:

* Trims any ending `=` 
* `+` is converted to `-`
* `/` is converted to `_`

The latter two work because the characters converted to are not present in base64 content. `+` and `/` are and they are URL 'unsafe' characters that can be misinterpreted by URL or MIME Encoding parsers. MIME Base64 basically replaces the unsafe characters with safe characters. As such it's essentially a transport format that's converted to and converted back before actual use in most cases. Additionally the format strips off the trailing `=` padding characters that are used to fill base64 content to exact 3 boundary chunks.

## Converting MIME Base64
To work around this is simple enough with a wrapper class around the `Convert` class base64 functionality native in the .NET base library.

The following class converts standard base64 to Mime base64 and back:

```cs
public static class Base64Mime
{
	public static string EncodeFromBytes(byte[] bytes)
	{
		var base64 = Convert.ToBase64String(bytes);
		return EncodeFromBase64String(base64);
	}
	
	public static byte[] DecodeToBytes(string mimeBase64)
	{		
		var base64 = DecodeToBase64(mimeBase64);
		return Convert.FromBase64String(base64);
	}

	public static string EncodeFromBase64String(string base64)
	{
		return base64
			.TrimEnd('=')
			.Replace('+', '-')
			.Replace('/', '_');
	}

	public static string DecodeToBase64(string mimeBase64)
	{
		mimeBase64 = mimeBase64.Replace('_', '/').Replace('-', '+');
		switch (mimeBase64.Length % 4)
		{
			case 2:
				mimeBase64 += "==";
				break;
			case 3:
				mimeBase64 += "=";
				break;
		}
		return mimeBase64;
	}	
}
```

Here's how you can use (LINQPad code):

```cs
var bytes = new byte[] { 32, 199,34,35, 233,137,38,39,40};
bytes.Dump();
var b64 = Convert.ToBase64String(bytes);

b64.Dump();

"-----".Dump();

var mimeB64 = Base64Mime.EncodeFromBase64String(b64);
mimeB64.Dump();

"-----".Dump();

b64 = Base64Mime.DecodeToBase64(mimeB64);
b64.Dump();

"-----".Dump();

mimeB64 = Base64Mime.EncodeFromBytes(bytes);
mimeB64.Dump();

"-----".Dump();

bytes = Base64Mime.DecodeToBytes(mimeB64);
Convert.ToBase64String(bytes).Dump();
bytes.Dump();
```	


### WebEncoders in ASP.NET Libraries
@Andrew in the comments mentioned that there's some work happening related to Base64 encoding to provide a dedicated Base64 encoding class that can handle many common operations - inculding URL encoded Base64 encoding. There's some more information in this [GitHub Issue](https://github.com/dotnet/runtime/issues/1658). 

One of the comments in that thread also points at the existing `WebEncoder` class in the ASP.NET Core libraries which mimic the `EncodeFromBytes()` and `DecodeToBytes()`` methods above:

```csharp
// Microsoft.AspNetCore.WebUtilities
var bytes = new byte[] { 32, 199,34,35, 233,137,38,39,40};
WebEncoders.Base64UrlEncode(bytes).Dump();
WebEncoders.Base64UrlDecode(mimeB64).Dump();
```	

As of .NET 8 these helpers are available in an installable NuGet package that can be used outside of ASP.NET:

```ps
dotnet add package Microsoft.AspNetCore.WebUtilities
```

Who knew there was so much attention to this? Not me :smile:

### Summary
Nothing new here, but it's something that I missed, and I'm making a note for myself with this post so I may find it again in the future...
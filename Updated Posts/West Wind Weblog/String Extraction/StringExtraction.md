---
title: String Extraction
abstract: One thing I do quite frequently in applications is parsing strings and a common scenario requires extracting a string from within another string with delimiters. Here's a small utility function out of my StringUtils library that provides this functionality easily.
keywords: String,Extract,Extraction,String Extraction,C#
categories: CSharp,.NET
weblogName: West Wind Web Log
postId: 574153
---
# String Extraction

Ah thought I go back to basics today for a post. An operation I rely on a lot when I’m working with text is the ability to extract strings with delimiters from within another string. RegEx can be quite useful for many scenarios of finding matches and extracting text, but personally for the 10 times a year when I need to use RegEx expressions I tend to relearn most of the cryptic syntax each time. What should take me a couple minutes usually turns into a half an hour of experimenting with [RegEx Buddy](http://www.regexbuddy.com/) for me.

So a long time ago I created some helper functions that make it easier to help me with the common task of string extraction. One of them is ExtractString() which is something I use quite frequently to well extract a string from within another string. This can be in small strings or larger strings. The function accepts a source string and a couple of delimiters around which text gets extracted.

Usage looks something like this:

```cs
// MS json Date format is "\/Date(9221211)\/" 
jsonDate = StringUtils.ExtractString(jsonDate, @"\/Date(", @")\/");
```

which extracts the only the milliseconds portion of the string inside of the date delimiter. Now here’s actually a good example of why this function is easier than using RegEx – try constructing that particular pattern with RegEx escape codes for some real fun and undecipherable gobbledygook. :-} Been there done that (for the JavaScript portion of the parser and it took a while to get right!).

ExtractString() also has a few additional parameters for case sensitivity and how to behave if the end delimiter is not found which is useful. For example in the following snippet a query string is passed and I need to find the value of value r parameter:

```cs
string res = StringUtils.ExtractString(Url,"?r=","&",false,true);
```

And no, before you ask: I couldn’t use Request.QueryString() because the string in this case is a parsed URL that doesn’t come from a query string input. The function call searches for a r= and & as delimiters, does so case insensitively (false) and specifies that the “&” delimiter can be missing which means the result returns up to the end of the string. In fact to create a generic query string parser you could now write:

```csharp
public static string GetUrlEncodedKey(string urlEncodedString, string key)
{
    string res = StringUtils.ExtractString(urlEncodedString, key + "=", "&", false, true);
    return HttpUtility.UrlDecode(res);
}
```

Again RegEx can solve this fairly easily as well, but doing or’d  expressions are a pain to get right and since I use this functionality all the time I don’t want to fuck around with RegEx’s constant relearning curve (for me).

I certainly prefer:

```csharp
string res = StringUtils.ExtractString(Url,"?r=","&",false,true);
```

to:

```csharp
public static string GetUrlEncodedKey(string urlEncodedString, string key)
{
    string res = StringUtils.ExtractString(urlEncodedString, key + "=", "&", false, true);
    return HttpUtility.UrlDecode(res);
}
```

I’m not saying that RegEx hasn’t got a place. Obviously for more complex searches RegEx is much more flexible. But for simple repetive scenarios RegEx is overkill and likely more resource intensive than a simple function that finds a couple of string indexes and extracts a substring. And to me at least RegEx usage seriously affects code readibility so if I have a chance to abstract behavior in such a way that I don’t have to use RegEx I will do so vehemently – either by wrapping the RegEx code or creating an alternative.

Anyway, here’s the implementation of ExtractString with various overloads:


```cs
/// Extracts a string from between a pair of delimiters. Only the first /// instance is found. /// 
/// Input String to work on
/// Beginning delimiter
/// ending delimiter
/// Determines whether the search for delimiters is case sensitive
/// Extracted string or "" 
public static string ExtractString(string source, string beginDelim, 
                                   string endDelim, bool caseSensitive, 
                                   bool allowMissingEndDelimiter)
{           
    int at1, at2;

    if (string.IsNullOrEmpty(source))
        return string.Empty;

    if (caseSensitive)
    {
        at1 = source.IndexOf(beginDelim);
        if (at1 == -1)
            return string.Empty;

        at2 = source.IndexOf(endDelim, at1 + beginDelim.Length);
    }
    else {
        //string Lower = source.ToLower(); at1 = source.IndexOf(beginDelim,0,source.Length,StringComparison.OrdinalIgnoreCase);
        if (at1 == -1)
            return string.Empty;

        at2 = source.IndexOf(endDelim, at1 + beginDelim.Length, StringComparison.OrdinalIgnoreCase);
    }

    if (allowMissingEndDelimiter && at2 == -1)
        return source.Substring(at1 + beginDelim.Length);

    if (at1 > -1 && at2 > 1)
        return source.Substring(at1 + beginDelim.Length, at2 - at1 - beginDelim.Length);

    return string.Empty;
}
  public static string ExtractString(string source, string beginDelim, string endDelim, bool caseSensitive)
{
    return ExtractString(source, beginDelim, endDelim, caseSensitive, false);
}
  public static string ExtractString(string source, string beginDelim, string endDelim)
{
    return ExtractString(source, beginDelim, endDelim, false, false);
}
```

It’s pretty basic stuff, but it’s one of those handy utility functions that are useful so frequently it’s nice to have them in my Utility set of classes (StringUtils to be exact).

So I’m curious to hear what the RegEx aficionados will have to say. I wonder if RegEx could be used inside of the function – the big issue I always have with RegEx in reusable/generic scenarios is that patterns that contain the start and end delimiters have to escaped properly. If I have backslash in the starting delimiter a generic expression will die the painful RegEx parsing death. So (he asks mockingly) - could the generic internals of ExtractString be re-written to use RegEx instead of indexOf and SubString to retrieve the string match – frankly I don’t know how (and it’s not really necessary, but an interesting thought).

BTW, for some of the FoxPro folks lurking this function might look familiar. It closely matches [West Wind Web Connection](http://www.west-wind.com/webconnection/)’s Extract method as well as VFP’s native StrExtract functions on which I had relied for many years. I think the above functions was one of the first things I ever created in .NET because its use was sorely missed when starting out in .NET.

Hopefully this method will be useful to some of you.

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
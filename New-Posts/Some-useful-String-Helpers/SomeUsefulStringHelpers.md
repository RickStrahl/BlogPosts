---
title: Some useful String Helpers
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2024-06-28T12:13:09.4924432-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Some useful String Helpers

I'm a sucker for string helper functions because I build a lot of applications that deal with heavy text manipulation and in app 'templating'. 

Today I was mucking around with a [Markdown Monster](https://markdownmonster.west-wind.com/) Render extension I'm working on that had some code like this to parse out a short hand icon syntax and turn it into FontAwesome icons.

The code basically takes any text that `@icon-icon-name-andor-prefix` and turns that into a Font Awesome icon HTML text.

There are quite a few combinations of prefixes and so the logic gets a bit lengthy and repetitive:

```csharp
foreach (Match match in matches)
{
    // extract @icon-XXX-XXX-XXX block
    string iconblock = match.Value.Substring(0, match.Value.Length - 1);
    string icon = iconblock.Replace("@icon-", "");

    if (icon.StartsWith("fas-") || icon.StartsWith("far-") || icon.StartsWith("fab-") ||
       icon.StartsWith("fa-solid-") || icon.StartsWith("fa-regular-") || icon.StartsWith("fa-duotone-"))
    {
        icon = icon.Replace("fas-","")
            .Replace("far-", "")
            .Replace("fad-", "")
            .Replace("fa-solid-", "")
            .Replace("fa-regular-", "")
            .Replace("fa-duotone-", "");

        html = html.Replace(iconblock, "<i class=\"" + icon + "\"></i> ");
    }
    else
        html = html.Replace(iconblock, "<i class=\"fas fa-" + icon + "\"></i> ");
}
```

Ugh - that's ugly. 

> I know you can use RegEx for some of this but - if a problem can be solved reasonably **without using RegEx** I try to stay away from RegEx to avoid the context switch and pretzel logic thinking required to work with it a day or two later. 😄

In any case, the code above is simple in logic and efficient enough, but it's unwieldy and the list can get long. And I realized I run into similar scenarios quite frequently.

So this isn't the first time I've written code like this, I decided to write a couple of simple String extension methods that can cut that code down to size. 

The following uses `StartsWithMany()` and `ReplaceMany()` to simplify this code and make it more readable:

```csharp
foreach (Match match in matches)
{
    string iconblock = match.Value.Substring(0, match.Value.Length - 1);
    string icon = iconblock.Replace("@icon-", "");

    string[] searchFor = ["fas-", "far-", "fad-", "fa-solid-", "fa-regular-", "fa-duotone-"];
    if (icon.StartsWithMany(searchFor))
    {
        icon = icon.ReplaceMany(searchFor, string.Empty);
        html = html.Replace(iconblock, "<i class=\"" + icon + "\"></i> ");
    }
    else
        html = html.Replace(iconblock, "<i class=\"fas fa-" + icon + "\"></i> ");
}
```

That's better, no?

## A few String Extensions for 'Many' operations
To put this to code there are three methods with various overloads:

* ContainsMany()
* StartsWithMany()
* ReplaceMany()


```csharp
public static class StringManyExtensions
{
    public static bool StartsWithMany(this string str, params string[] matchValues)
    {
        foreach (var value in matchValues)
        {
            if (str.StartsWith(value))
                return true;
        }

        return false;
    }

    public static bool StartsWithMany(this string str, StringComparison compare,
                                      params string[] matchValues)
    {
        foreach (var value in matchValues)
        {
            if (str.StartsWith(value, compare))
                return true;
        }

        return false;
    }

    public static bool ContainsMany(this string str, params string[] matchValues)
    {
        foreach (var value in matchValues)
        {
            if (str.Contains(value))
                return true;
        }

        return false;
    }

    public static bool ContainsMany(this string str, StringComparison compare, 
                                    params string[] matchValues)
    {
        foreach (var value in matchValues)
        {
            if (str.Contains(value, compare))
                return true;
        }

        return false;
    }

    public static bool ContainsMany(this string str, params char[] matchValues)
    {
        foreach (var value in matchValues)
        {
            if (str.Contains(value))
                return true;
        }

        return false;
    }

    public static bool ContainsMany(this string str, StringComparison compare, 
                                    params char[] matchValues)
    {
        foreach (var value in matchValues)
        {
            if (str.Contains(value, compare))
                return true;
        }

        return false;
    }

    public static string ReplaceMany(this string str, string[] matchValues, string replaceWith)
    {
        foreach (var value in matchValues)
        {
            str = str.Replace(value, replaceWith);
        }

        return str;
    }
}
```

You can also find these in the [Westwind.Utilities library](https://github.com/RickStrahl/Westwind.Utilities) in the [StringUtils](https://github.com/RickStrahl/Westwind.Utilities/blob/master/Westwind.Utilities/Utilities/StringUtils.cs) class.









---
title: Prettifying a JSON String in .NET
abstract: "Occasionally it's useful to prettify an existing JSON string that you've received from somewhere: An HTTP response you need to look at while debugging or a UI that needs to display JSON to the user. Here's a small tip that makes it easy to take a JSON string and prettify it using the JSON.NET library."
keywords: JSON,Prettify,Format,JSON.NET,JValue
categories: .NET,C#
weblogName: West Wind Web Log
postId: 1093157
postDate: 2018-05-09T15:15:16.3111874-07:00
---
# Prettifying a JSON String in .NET

Here’s a quick and dirty tip if you’re dealing with JSON strings that you at times need to display for debugging or simply seeing a quick view of data represented. It may be that you have an application that captures HTTP responses and you need to actually decipher the JSON that was sent to you, or you’re creating a quick and dirty admin form where you just want to dump some settings information into a screen.

As is usually the case, JSON.NET makes JSON manipulations super easy – in fact it’s a single line of code:

```cs
string jsonFormatted = JValue.Parse(json).ToString(Formatting.Indented);
```

Here’s how you can test this out:

```cs
[TestMethod]
public void PrettifyJsonStringTest()
{
    var test = new
    {
        name = "rick",
        company = "Westwind",
        entered = DateTime.UtcNow
    };

    string json = JsonConvert.SerializeObject(test);
    Console.WriteLine(json); // single line JSON string
           
    string jsonFormatted = JValue.Parse(json).ToString(Formatting.Indented);
            
    Console.WriteLine(jsonFormatted);
}
```

The code above of course is contrived as **SerializeObject()** also supports the **Formatting.Indented** option. But assume for a second that you are getting data already in string format from somewhere such as an HTTP stream or a file on disk. You then use the above code to convert into something much more readable.

In practice, it’s nice if you have any interfaces that need to display JSON in the UI. For example in [West Wind Web Surge](http://websurge.west-wind.com) I display sent and captured HTTP content and if the result is JSON the default _Raw Response_ output looks like this:

[![WebSurgeRaw](http://weblog.west-wind.com/images/2015Windows-Live-Writer/Converting-a_10ABB/WebSurgeRaw_thumb.png "WebSurgeRaw")](http://weblog.west-wind.com/images/2015Windows-Live-Writer/Converting-a_10ABB/WebSurgeRaw_2.png)

Workable but not exactly readable.

By applying formatting it sure is a lot easier to see what the JSON actually looks like:

[![WebSurgeFormattedJson](http://weblog.west-wind.com/images/2015Windows-Live-Writer/Converting-a_10ABB/WebSurgeFormattedJson_thumb.png "WebSurgeFormattedJson")](http://weblog.west-wind.com/images/2015Windows-Live-Writer/Converting-a_10ABB/WebSurgeFormattedJson_2.png)

Likewise if you’re dealing with objects that have `.ToString()` methods that return JSON (as many online SDKs do!), it’s nice to have an easy way to format the result into something more readable that you can dump into the Debug console.

It’s simple solution to a not so often required problem, but I’ve run into this enough times when I forgot exactly which JSON.NET object is required to handle this, so I wrote it down for next time for me to remember and maybe this might be useful to some of you as well.

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
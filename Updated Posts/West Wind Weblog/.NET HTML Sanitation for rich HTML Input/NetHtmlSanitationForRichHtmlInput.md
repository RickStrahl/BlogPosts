---
title: .NET HTML Sanitation for rich HTML Input
abstract: If you need to sanitize raw HTML for display in Web applications, the job at hand is scary for .NET backends. Unfortunately it seems there aren't a lot of tools available to help in this formidable tasks and the tools that are tend to be inflexible to the point of often being unusable. In this post I show a base implementation of an HTML Sanitizer that can be customized for your own needs.
keywords: XSS,Sanitize,HTML
categories: Security,HTML,ASP.NET,JavaScript
weblogName: West Wind Web Log
postId: 1408480
postDate: 2018-08-31T22:14:15.5888218-07:00
---
# .NET HTML Sanitation for rich HTML Input

![](Sanitize.jpg)

<iframe src="https://west-wind.com" style="height: 800px;width: 1200px"></iframe>

Recently I was working on updating a legacy application to MVC 4 that included free form text input. When I set up the new site my initial approach was to not allow any rich HTML input, only simple text formatting that would respect a few simple HTML commands for bold, lists etc. and automatically handles line break processing for new lines and paragraphs. This is typical for what I do with most multi-line text input in my apps and it works very well with very little development effort involved.

Then the client sprung another note: Oh by the way we have a bunch of customers (real estate agents) who need to post complete HTML documents. Oh uh! There goes the simple theory. After some discussion and pleading on my part :cry: to try and avoid this type of raw HTML input because of potential XSS issues, the client decided to go ahead and allow raw HTML input anyway.

### XSS
There has been lots of discussions on this subject on [StackOverFlow](http://stackoverflow.com/questions/341872/html-sanitizer-for-net) (and [here](http://stackoverflow.com/questions/8668446/html-sanitizer-in-asp-net-mvc-that-filters-dangerous-markup-but-allows-the-rest) and [here](http://stackoverflow.com/questions/188870/how-to-use-c-sharp-to-sanitize-input-on-an-html-page)) but to after reading through some of the solutions I didn't really find anything that would work even closely for what I needed. Specifically we need to be able to allow just about any HTML markup, with the exception of script code. Remote CSS and Images need to be loaded, links need to work and so. While the 'legit' HTML posted by these agents is basic in nature it does span most of the full gamut of HTML (4). Most of the solutions XSS prevention/sanitizer solutions I found were way to aggressive and rendered the posted output unusable mostly because they tend to strip any externally loaded content.

In short I needed a custom solution. I thought the best solution to this would be to use an HTML parser - in this case the [Html Agility Pack](http://htmlagilitypack.codeplex.com/) - and then to run through all the HTML markup provided and remove any of the blacklisted tags and a number of attributes that are prone to JavaScript injection.

There's much discussion on whether to use blacklists vs. whitelists in the discussions mentioned above, but I found that whitelists can make sense in simple scenarios where you might allow manual HTML input, but when you need to allow a larger array of HTML functionality a blacklist is probably easier to manage as the vast majority of elements and attributes could be allowed. Also white listing gets a bit more complex with HTML5 and the new proliferation of new HTML tags and most new tags generally don't affect XSS issues directly. Pure whitelisting based on elements and attributes also doesn't capture many edge cases (see some of the XSS cheat sheets listed below) so even with a white list, custom logic is still required to handle many of those edge cases.

### The Microsoft Web Protection Library (AntiXSS)
My first thought was to check out the Microsoft AntiXSS library. Microsoft has an HTML Encoding and Sanitation library in the [Microsoft Web Protection Library](http://wpl.codeplex.com/) (formerly AntiXSS Library) on CodePlex, which provides stricter functions for whitelist encoding and sanitation. Initially I thought the _Sanitation_ class and its static members would do the trick for me,but I found that this library is way too restrictive for my needs. Specifically the _Sanitation_ class strips out images and links which rendered the full HTML from our real estate clients completely useless. I didn't spend much time with it, but apparently [I'm not alone if feeling this library is not really useful](http://wpl.codeplex.com/releases/view/80289#ReviewsAnchor) without some way to configure operation.

To give you an example of what didn't work for me with the library here's a small and simple HTML fragment that includes script, img and anchor tags. I would expect the script to be stripped and everything else to be left intact. Here's the original HTML:

```cs
string value = "<b>Here</b> <script>alert('hello')</script> we go. Visit the " +
            "<a href='http://west-wind.com'>West Wind</a> site. " +
            "<img src='http://west-wind.com/images/new.gif' /> ";
```

and the code to sanitize it with the AntiXSS Sanitize class:

```html
@Html.Raw(Microsoft.Security.Application.Sanitizer.GetSafeHtmlFragment(value))
```

This produced a not so useful sanitized string:

**Here we go. Visit the <a>West Wind</a> site.**

While it removed the `<script>` tag (good) it also removed the href from the link and the image tag altogether (bad). In some situations this might be useful, but for most tasks I doubt this is the desired behavior. While links can contain javascript: references and images can 'broadcast' information to a server, without configuration to tell the library what to restrict this becomes useless to me. I couldn't find any way to customize the white list, nor is there code available in this 'open source' library on CodePlex.

### Using Html Agility Pack for HTML Parsing

The WPL library wasn't going to cut it. After doing a bit of research I decided the best approach for a custom solution would be to use an HTML parser and inspect the HTML fragment/document I'm trying to import. I've used the [HTML Agility Pack](http://htmlagilitypack.codeplex.com/) before for a number of apps where I needed an HTML parser without requiring an instance of a full browser like the Internet Explorer Application object which is inadequate in Web apps. In case you haven't checked out the [Html Agility Pack](http://htmlagilitypack.codeplex.com/) before, it's a powerful HTML parser library that you can use from your .NET code. It provides a simple, parsable HTML DOM model to full HTML documents or HTML fragments that let you walk through each of the elements in your document. If you've used the HTML or XML DOM in a browser before you'll feel right at home with the Agility Pack.

### Blacklist based HTML Parsing to strip XSS Code

For my purposes of HTML sanitation, the process involved is to walk the HTML document one element at a time and then check each element and attribute against a blacklist. There's quite a bit of argument of what's better: A whitelist of allowed items or a blacklist of denied items. While whitelists tend to be more secure, they also require a lot more configuration. In the case of HTML5 a whitelist could be very extensive. For what I need, I only want to ensure that no JavaScript is executed, so a blacklist includes the obvious `<script>` tag plus any tag that allows loading of external content including `<iframe>`, `<object>`, `<embed>` and `<link>` etc. `<form>`  is also excluded to avoid posting content to a different location. I also disallow `<head>` and `<meta>` tags in particular for my case, since I'm only allowing posting of HTML fragments. There is also some internal logic to exclude some attributes or attributes that include references to JavaScript or CSS expressions.

The default tag blacklist reflects my use case, but is customizable and can be added to.

Here's my HtmlSanitizer implementation:

```cs
using System.Collections.Generic;
using System.IO;
using System.Xml;
using HtmlAgilityPack;

namespace Westwind.Web.Utilities
{
    public class HtmlSanitizer
    {

        public HashSet<string> BlackList = new HashSet<string>() 
        {
                { "script" },
                { "iframe" },
                { "form" },
                { "object" },
                { "embed" },
                { "link" },                
                { "head" },
                { "meta" }
        };

        /// <summary>
        /// Cleans up an HTML string and removes HTML tags in blacklist
        /// </summary>
        /// <param name="html"></param>
        /// <returns></returns>
        public static string SanitizeHtml(string html, params string[] blackList)
        {
            var sanitizer = new HtmlSanitizer();
            if (blackList != null && blackList.Length > 0)
            {
                sanitizer.BlackList.Clear();
                foreach (string item in blackList)
                    sanitizer.BlackList.Add(item);
            }
            return sanitizer.Sanitize(html);
        }

        /// <summary>
        /// Cleans up an HTML string by removing elements
        /// on the blacklist and all elements that start
        /// with onXXX .
        /// </summary>
        /// <param name="html"></param>
        /// <returns></returns>
        public string Sanitize(string html)
        {
            var doc = new HtmlDocument();
            
            doc.LoadHtml(html);            
            SanitizeHtmlNode(doc.DocumentNode);            
            
            //return doc.DocumentNode.WriteTo();

            string output = null;

            // Use an XmlTextWriter to create self-closing tags
            using (StringWriter sw = new StringWriter())
            {
                XmlWriter writer = new XmlTextWriter(sw);
                doc.DocumentNode.WriteTo(writer);
                output = sw.ToString();

                // strip off XML doc header
                if (!string.IsNullOrEmpty(output))
                {
                    int at = output.IndexOf("?>");
                    output = output.Substring(at + 2);
                }

                writer.Close();
            }
            doc = null;

            return output;
        }

        private void SanitizeHtmlNode(HtmlNode node)
        {
            if (node.NodeType == HtmlNodeType.Element)
            {
                // check for blacklist items and remove
                if (BlackList.Contains(node.Name))
                {
                    node.Remove();
                    return;
                }

                // remove CSS Expressions and embedded script links
                if (node.Name == "style")
                {
                    if (string.IsNullOrEmpty(node.InnerText))
                    {
                        if (node.InnerHtml.Contains("expression") || node.InnerHtml.Contains("javascript:"))
                            node.ParentNode.RemoveChild(node);
                    }
                }

                // remove script attributes
                if (node.HasAttributes)
                {
                    for (int i = node.Attributes.Count - 1; i >= 0; i--)
                    {
                        HtmlAttribute currentAttribute = node.Attributes[i];
                 
                        var attr = currentAttribute.Name.ToLower();
                        var val = currentAttribute.Value.ToLower();
                        
                        span style="background: white; color: green">// remove event handlers
                        if (attr.StartsWith("on"))
                            node.Attributes.Remove(currentAttribute);
                        
                        // remove script links
                        else if (
                                 //(attr == "href" || attr== "src" || attr == "dynsrc" || attr == "lowsrc") &&
                                 val != null &&
                                 val.Contains("javascript:"))
                            node.Attributes.Remove(currentAttribute);
                        
                        // Remove CSS Expressions
                        else if (attr == "style" && 
                                 val != null &&
                                 val.Contains("expression") || val.Contains("javascript:") || val.Contains("vbscript:"))
                            node.Attributes.Remove(currentAttribute);
                    }
                }
            }

            // Look through child nodes recursively
            if (node.HasChildNodes)
            {
                for (int i = node.ChildNodes.Count - 1; i >= 0; i--)
                {
                    SanitizeHtmlNode(node.ChildNodes[i]);
                }
            }
        }
    }
}
```

_Please note: Use this as a starting point only for your own parsing and review the code for your specific use case! If your needs are less lenient than mine were you can you can make this much stricter by not allowing src and href attributes or CSS links if your HTML doesn't allow it. You can also check links for external URLs and disallow those - lots of options.  The code is simple enough to make it easy to extend to fit your use cases more specifically. It's also quite easy to make this code work using a WhiteList approach if you want to go that route. The code above is semi-generic for allowing full featured HTML fragments that only disallow script related content._

The Sanitize method walks through each node of the document and then recursively drills into all of its children until the entire document has been traversed. Note that the code here uses an XmlTextWriter to write output - this is done to preserve XHTML style self-closing tags which are otherwise left as non-self-closing tags.

The sanitizer code scans for blacklist elements and removes those elements not allowed. Note that the blacklist is configurable either in the instance class as a property or in the static method via the string parameter list. Additionally the code goes through each element's attributes and looks for a host of rules gleaned from some of the XSS cheat sheets listed at the end of the post. Clearly there are a lot more XSS vulnerabilities, but a lot of them apply to ancient browsers (IE6 and versions of Netscape) - many of these glaring holes (like CSS expressions - WTF IE?) have been removed in modern browsers.

### What a Pain

To be honest this is NOT a piece of code that I wanted to write. I think building anything related to XSS is better left to people who have far more knowledge of the topic than I do. Unfortunately, I was unable to find a tool that worked even closely for me, or even provided a working base. For the project I was working on I had no choice and I'm sharing the code here merely as a base line to start with and potentially expand on for specific needs. It's sad that Microsoft Web Protection Library is currently such a train wreck - this is really something that should come from Microsoft as the systems vendor or possibly a third party that provides security tools.

Luckily for my application we are dealing with authenticated and validated users so the user base is fairly well known, and relatively small - this is not a wide open Internet application that's directly public facing. As I mentioned earlier in the post, if I had my way I would simply not allow this type of raw HTML input in the first place, and instead rely on a more controlled HTML input mechanism like [MarkDown](http://daringfireball.net/projects/markdown/) or even a good HTML Edit control that can provide some limits on what types of input are allowed. Alas in this case I was overridden and we had to go forward and allow *any* raw HTML posted.

Sometimes I really feel sad that it's come this far - how many good applications and tools have been thwarted by fear of XSS (or worse) attacks? So many things that could be done *if* we had a more secure browser experience and didn't have to deal with every little script twerp trying to hack into Web pages and obscure browser bugs. So much time wasted building secure apps, so much time wasted by others trying to hack apps… We're a funny species - no other species manages to waste as much time, effort and resources as we humans do :-)

### Resources

*   [Code on GitHub](https://github.com/RickStrahl/HtmlSanitizer)
*   [**Html Agility Pack**](http://htmlagilitypack.codeplex.com/)
*   [**XSS Cheat Sheet**](http://ha.ckers.org/xss.html)
*   **[XSS Prevention Cheat Sheet](https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet)**
*   [**Microsoft Web Protection Library (AntiXss)**](http://wpl.codeplex.com/)
*   **StackOverflow Links:**
    *   [http://stackoverflow.com/questions/341872/html-sanitizer-for-net](http://stackoverflow.com/questions/341872/html-sanitizer-for-net "http://stackoverflow.com/questions/341872/html-sanitizer-for-net")
    *   [http://blog.stackoverflow.com/2008/06/safe-html-and-xss/](http://blog.stackoverflow.com/2008/06/safe-html-and-xss/)
    *   [http://code.google.com/p/subsonicforums/source/browse/trunk/SubSonic.Forums.Data/HtmlScrubber.cs?r=61](http://code.google.com/p/subsonicforums/source/browse/trunk/SubSonic.Forums.Data/HtmlScrubber.cs?r=61)
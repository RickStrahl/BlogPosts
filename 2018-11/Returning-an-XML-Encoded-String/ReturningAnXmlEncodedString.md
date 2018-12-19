---
title: Returning an XML Encoded String in .NET
abstract: XML is not as popular as it once was, but there's still a lot of XML based configuration and data floating around today. Today I ran into a recurring issue where I needed to convert a string to a properly encoded XML string. Seems simple enough but it's not as straightforward as you might think to generate an XML Encoded string properly. This post shows a few different ways to retrieve a string and discusses advantages of each.
keywords: .NET,C#,XML,String,Convert,Conversion
categories: .NET, C#, XML
weblogName: West Wind Web Log
postId: 1043394
postDate: 2018-11-30T13:11:52.6274494-10:00
---
# Returning an XML Encoded String

![](XmlImage.png)

XML is not as popular as it once was, but there's still a lot of XML based configuration and data floating around today. Just today I was working with a conversion routine that needs to generate XML formatted templates, and one thing that I needed is an easy way to generate a properly encoded XML string.

> #### @icon-warning Stupid Pet Tricks
> I'll preface this by saying that your need for generating XML as standalone strings should be a rare occurrance. The recommendation for generating any sort of XML is to create a proper XML document, XmlWriter or Linq to XML structure and create your XML that way which provides built-in type to XML conversion.

In most cases you'll want to use a proper XML processor whether it's an XML Document, XmlWriter or LINQ to XML to generate your XML. When you use those features the data conversion from string (and most other types) is built in and mostly automatic.

However, in this case I have a huge block of mostly static XML **text** and creating the entire document using structured XML documents seems like overkill when really i just need to inject a few simple values.

So in this case I'm looking for a way to format values as XML for which the `XmlConvert` static class works well.

Should be easy right? Well...

The `XMLConvert` class works well - **except for string conversions which it doesn't support**. `XmlConvert.ToString()` works with just about any of the common base types **except for `string`** to convert properly XML formatted content.

Now what?

##AD##

## Reading an encoded XML Value
There are a number of different ways that you can generate XML output and all of them basically involve creating some sort of XML structure and reading the value out of the 'rendered' document.

The most concise way I've found ([on StackOverflow from John Skeet](https://stackoverflow.com/a/1132516/11197) with modifications to return just the content) is the following:

```cs
public static string XmlString(string text)
{
    return new XElement("t", text).LastNode.ToString();
}
```

The `XElement` returns the entire XML fragment, while `LastNode` is the text node which contains the actual node's content.

You can call `XmlString()` with:


```csharp
void Main()
{
    XmlString("Brackets & stuff <doc> and \"quotes\" and more 'quotes'.").Dump();
}
```

which produces:

```text
Brackets &amp; stuff &lt;doc&gt; and "quotes" and more 'quotes'.
```

But hold on - this doesn't take into account attributes which require some additional encoding for quotes and control characters. So a little more work is required for the wrapper:

```cs
public static string XmlString(string text, bool isAttribute = false)
{
	if (string.IsNullOrEmpty(text))
		return text;
		
	if (!isAttribute)
		return new XElement("t", text).LastNode.ToString();

	return new XAttribute("__n",text)
				  		 .ToString().Substring(5).TrimEnd('\"');	
}
```



If you don't want to use LINQ to XML you can use an XML Document instead. 

```cs
private static XmlDoc _xmlDoc;

public string XmlString(string text)
{
	_xmlDoc = _xmlDoc ?? new XmlDocument();
	var el = _xmlDoc.CreateElement("t");
	el.InnerText = text;
	return el.InnerXml;
}
```

Note that using `XmlDocument` is considerably slower than `XElement` even with the document caching used above.

## System.Security.SecurityElement.Escape()?
The `SecurityElement.Escape()` is a built-in CLR function that performs XML encoding. It's a single function so it's easy to call, but **it lways encodes all quotes** without options. This is OK, but can result in extra characters if you're encoding for XML elements. Only attributes need quotes encoded. 

The function is also considerably slower than the other mechanisms mentioned here.

## Just Code
If you don't want to deal with adding a reference to LINQ to XML or even `System.Xml` you can also create a simple code routine. XML strings really just escape 5 characters (3 if you're encoding for elements), plus it throws for illegal characters < CHR(32) with the exception of tabs, returns and line feeds.

##AD##

The simple code to do this looks like this:

```cs
///  <summary>
///  Turns a string into a properly XML Encoded string.
///  Uses simple string replacement.
/// 
///  Also see XmlUtils.XmlString() which uses XElement
///  to handle additional extended characters.
///  </summary>
///  <param name="text">Plain text to convert to XML Encoded string</param>
/// <param name="isAttribute">
/// If true encodes single and double quotes, CRLF and tabs.
/// When embedding element values quotes don't need to be encoded.
/// When embedding attributes quotes need to be encoded.
/// </param>
/// <returns>XML encoded string</returns>
///  <exception cref="InvalidOperationException">Invalid character in XML string</exception>
public static string XmlString(string text, bool isAttribute = false)
{
    var sb = new StringBuilder(text.Length);

    foreach (var chr in text)
    {
        if (chr == '<')
            sb.Append("&lt;");
        else if (chr == '>')
            sb.Append("&gt;");
        else if (chr == '&')
            sb.Append("&amp;");

        // special handling for quotes
        else if (isAttribute && chr == '\"')
            sb.Append("&quot;");
        else if (isAttribute && chr == '\'')
            sb.Append("&apos;");

        // Legal sub-chr32 characters
        else if (chr == '\n')
            sb.Append(isAttribute ? "&#xA;" : "\n");
        else if (chr == '\r')
            sb.Append(isAttribute ? "&#xD;" : "\r");
        else if (chr == '\t')
            sb.Append(isAttribute ? "&#x9;" : "\t");

        else
        {
            if (chr < 32)
                throw new InvalidOperationException("Invalid character in Xml String. Chr " +
                                                    Convert.ToInt16(chr) + " is illegal.");
            sb.Append(chr);
        }
    }

    return sb.ToString();
}
```        

## Attributes vs. Elements
Notice that the functions above optionally supports attribute encoding. Attributes need to be encoded differently than elements.

That's because XML Elements are not required to have quotes encoded because there are no string delimiters to worry about in an XML element. This is legal XML:

```xml
<doc>This a "quoted" string. So is 'this'!</doc>
```

However, if you are generating an content for an XML Attribute, you do need to encode quotes because the quotes are the delimiter for the attribute. Makes sense right?

```xml
<doc note="This a &quot;quoted&quot; string. So is &apos;this&apos;!"
```

Actually, the `&apos;` is not required in this example because the attribute delimiter is `"`. So this is actually more correct:

```xml
<doc note="This a &quot;quoted&quot; string. So is 'this'!"
```

However, both are valid XML. The string function above will encode single and double quotes when the `encodeQuotes` parameter is set to `true` to handle setting attribute values.

In addition attributes can't represent carriage return and linefeeds (and also tabs) because attributes are single line, so those need to be encoded to with:

```
CR: &xD; LF: &xA; Tab: &x9;
```

The following LINQPad code demonstrates what XML is generated for values by Elements and Attributes:

```cs
void Main()
{
	var doc = new XmlDocument();
	doc.LoadXml("<d><t>This is &amp; a \"test\" and a 'tested' test</t></d>");
	doc.OuterXml.Dump();
	
	var s = "This is &amp; a \"test\" and a 'tested' test</t></d> with breaks \r\n and \t tabs</root>";
	
	var node = doc.CreateElement("d2");
	node.InnerText = s;
	doc.DocumentElement.AppendChild(node);
	var attr = doc.CreateAttribute("note", s);
	node.Attributes.Append(attr);

	doc.OuterXml.Dump();
}
```

The document looks like this:

```xml
<d>
    <t>This is &amp; a "test" and a 'tested' test</t>
    <d2 d2p1:note="" 
        xmlns:d2p1="This is &amp;amp; a &quot;test&quot; and a 'tested' test&lt;/t&gt;&lt;/d&gt;
        with breaks &#xD;&#xA; and    tabs&lt;/root&gt;">This is &amp;amp; a "test" and a 'tested'
        test&lt;/t&gt;&lt;/d&gt; with breaks 
        and    tabs&lt;/root&gt;</d2>
</d>
```
<small>(attribute is a single line - linebreaks added for readability)</small>


> @icon-info-circle Bottom line: Elements don't require quotes, line breaks and tabs to be encoded, but attributes do.

##AD##

## Performance
This falls into the **pre-mature optimization** bucket, but I was curious how well each of these mechanisms would perform relative to each other. It would seem that `XElement` and especially `XmlDocument` would be very slow as they process the element as an XML document/fragment that has to be loaded and parsed.

I was **very surprised** to find that the fastest and most consistent solution in various sizes of text was `XElement` which was faster than my bare bones string implementation especially for larger strings. For small amounts of text (under a few hundred characters) the string and XElement implementations were roughly the same, but as strings get larger `XElement` started to become considerably faster. 

As an aside, the custom string version also runs considerably faster in **Release Mode** (in LINQPad run with *Optimizations On*) with optimizations enabled rather than debug mode. In debug mode performance was about 3-4x slower. Yikes.

Not surprisingly `XmlDocument` - even the cached version - was the slower solution. With small strings roughly 50% slower, with larger strings many times slower and incrementally getting slower as the string size gets larger.

Surprisingly slowest of them all was `SecurityElement.Escape()` which was nearly twice as slow as the XmlDocument approach.

Whatever `XElement` is doing to parse the element, it's very efficient and it's built into the framework and maintained by Microsoft, so I would recommend that solution, unless you want to avoid the XML assembly references in which case the custom solution string works as well with smaller strings and reasonably close with large strings.

Take all of these numbers with a grain of salt - all of them are pretty fast for one off parsing and unless you're using manual XML encoding strings in loops or large batches, the perf difference is not of concern here. 

If you want to play around with the different approaches, here's a Gist that you can load into [LINQPad](https://www.linqpad.net/) that you can just run:


* [XmlString.cs Samples LinqPad Script](https://gist.github.com/RickStrahl/793ea2c912d49f1f026ecbd15791098e)


## Summary
XML string encoding is something you hopefully won't have to do much of, but it's one thing I've tripped over enough times to take the time to write up here. Again, in most cases my recommendation is to write strings using some sort of official XML parser (XmlDocument or XDocument/XElement), but in the few cases where you just need to jam a couple of values into a large document, nothing beats simple string replacement in the document for simplicity and easy maintenance and that's the one edge, use-case where a function like `XmlString()` makes sense.


## Resources

* [`XmlUtils.XmlString()` in Westwind.Utilities](https://github.com/RickStrahl/Westwind.Utilities/blob/master/Westwind.Utilities/Utilities/XmlUtils.cs#L66)
* [XmlString.cs Samples LinqPad Script](https://gist.github.com/RickStrahl/793ea2c912d49f1f026ecbd15791098e)
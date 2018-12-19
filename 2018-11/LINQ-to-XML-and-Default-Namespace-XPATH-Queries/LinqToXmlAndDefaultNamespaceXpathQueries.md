---
title: LINQ to XML and Default Namespace XPATH Queries
abstract: Using LINQ to XML and XPath queries can be a pain if you have to deal with XML Namespaces. In particular default namespaces can cause unexpected behavior because the XPath processor doesn't properly work with empty namespaces. In this post I describe how this is a problem and the ways you can work around this in a few hacky ways.
keywords: XML,LINQ,Namespace,Default Namespace,XPATH
categories: .NET,XML
weblogName: West Wind Web Log
postDate: 2018-11-07T11:15:14.9946496-10:00
---
# LINQ to XML and Default Namespace XPATH Queries

Have I mentioned how much I loathe working with XML recently? If there's one thing I specifically hate about XML it's anything related to **Namespaces**. XML namespaces make querying a pain in the ass and the way Namespaces work in .NET in particular is painful.

I've been working on a small tool that converts Visual Studio code snippets to other formats. I have a ton of snippets and it sure would be nice to get them ported and available in Visual Studio Code and Rider. So I've been wanting to build a small converter that can parse them to other formats.

### Code Snippets are XML
Code snippets in Visual Studio are XML documents. The format is pretty simple. Here's an example of an old Bootstrap snippet I use for form controls frequently:

```cs
string xmlSnippet = 
@"<CodeSnippets xmlns=""http://schemas.microsoft.com/VisualStudio/2005/CodeSnippet"">
  <CodeSnippet Format=""1.0.0"">
    <Header>
      <Title>ww-fv</Title>
      <Author></Author>
      <Description></Description>
      <HelpUrl></HelpUrl>
      <SnippetTypes />
      <Keywords />
      <Shortcut>ww-fv</Shortcut>
    </Header>
    <Snippet>
      <References />
      <Imports />
      <Declarations>
        <Literal Editable=""true"">
          <ID>initialValue</ID>
          <Type></Type>
          <ToolTip></ToolTip>
          <Default>initialValue</Default>
          <Function></Function>
        </Literal>
        <Literal Editable=""true"">
          <ID>id</ID>
          <Type></Type>
          <ToolTip></ToolTip>
          <Default>id</Default>
          <Function></Function>
        </Literal>
        <Literal Editable=""true"">
          <ID>value</ID>
          <Type></Type>
          <ToolTip></ToolTip>
          <Default>valueExpression</Default>
          <Function></Function>
        </Literal>
        <Literal Editable=""true"">
          <ID>label</ID>
          <Type></Type>
          <ToolTip></ToolTip>
          <Default>label</Default>
          <Function></Function>
        </Literal>
      </Declarations>
      <Code Language=""html"" Kind="""" Delimiter=""$""><![CDATA[
<div class=""form-group"">
    <label for=""$id$"">$label$</label>
    <input type=""text"" id=""$id$"" name=""$id$""
            class=""form-control"" placeholder=""""
            value=""<%= Request.FormOrValue('$id$',$value$) %>"" />
</div>
]]></Code>
    </Snippet>
  </CodeSnippet>
</CodeSnippets>";
```

Given that snippet above, you would think I should be able to run this code to retrieve the declarations and code:

```cs
XElement root = XElement.Parse(xmlSnippet);
	
IEnumerable<XElement> list = root.XPathSelectElements("./CodeSnippet/Snippet/Declarations",res);
list.Dump();

var node = root.XPathSelectElement("./CodeSnippet/Snippet/Code", res);
node.Dump();
node.Value.Dump()
```

But no banana on that one. That code - as is does not work returns an empty enumeration and `null` for the XPath selections. 

Why? Because the document has a freakin' namespace associated with it:

```xml
<CodeSnippets 
     xmlns="http://schemas.microsoft.com/VisualStudio/2005/CodeSnippet">
</CodeSnippets>
```

To add injury to insult, in this case this is even an unnamed namespace - the default namespace - and **even then** an XPath query does not work.

### Using a NamespaceManager
You have to explicitly add namespaces and reference them in the XPath query. 

To do this in .NET you can use a NameSpaceManager and create a new name table of all the necessary namespaces. This works fine as long as you have named name spaces.

In my case there's only an unnamed default namespace, and although the following seems logical **it does not work**:

```cs
var res = new XmlNamespaceManager(new NameTable());
res.AddNamespace(string.Empty,root.GetDefaultNamespace().NamespaceName);
```

Using this unfortunately fails, because the empty namespace prefix is not resolving.

Either way there you have it: Default Namespace queries with XPath suck in .NET. But at least it's doable.

Next time I'm going to use LINQ to XML or XPath in general remind me to just parse the DOM with XmlDocument because it sure would have been faster even if it is more code.

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
So, the only way I can get the NamespaceManager to work is to inject a new namespace prefix **explicitly** to my default namespace and then use that in my queries.

Here's what that looks like:

```cs
var res = new XmlNamespaceManager(new NameTable());

*** Add a z: prefix to my default namespace
res.AddNamespace("z",root.GetDefaultNamespace().NamespaceName);

*** reference each default ns node with z:
var node1 = root.XPathSelectElement("./z:CodeSnippet/z:Header",res);
node1.Dump();

var node2 = root.XPathSelectElement("./z:CodeSnippet/z:Snippet/z:Code",res);
node2.Dump();
node2.Value.Dump();
```

And that works. Bah - that's some fucked up shit...

### Ditch the Namespace
The other option and maybe cleaner option is to strip the namespace from the document. I never really understood why you would add a namespace to an XML document if the thing is a self-contained and free standing document that will never mix with anything else. After all namespaces are meant to prevent... drum roll... naming collisions. If you have a document that will never interact with anything else why would you add a bloody namespace?

So, a simple solution is to load the document and immediately remove the namespace. You might think one of these would work **but you'd be wrong**:

```cs
XElement root = XElement.Parse(xmlSnippet);
var at = root.Attribute("xmlns");
at.Remove();
root.RemoveAttributes();
```

Nope, nope and nope! You can't remove a namespace attribute. That logic will remove other attributes but not a `xmlns` attribute. 

Instead renaming the bloody namespace before it gets loaded seems to be the only way:

```cs
xmlSnippet = xmlSnippet.Replace("xmlns=","xmlns:goaway=");
```

And now you can get at the names without a prefix. The following works:

```cs
xmlSnippet = xmlSnippet.Replace("xmlns=","xmlns:goaway=");

XElement root = XElement.Parse(xmlSnippet);
	
IEnumerable<XElement> list = root.XPathSelectElements("./CodeSnippet/Snippet/Declarations",res);
list.Dump();

var node = root.XPathSelectElement("./CodeSnippet/Snippet/Code", res);
node.Dump();
node.Value.Dump()
```

Yup that's got hack written all over it, but it sure beats adding an imaginary namespace to all tags.
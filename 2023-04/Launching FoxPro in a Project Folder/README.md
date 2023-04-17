Since the new message board uses Markdown, here's a simple overview of some of the features of Markdown you can use when composing messages here.

<style>
.code-output {
    background: #f0f0f0;
    padding: 0.5em;
    margin: 1em 0.5em;
    border-radius: 0.5em;
}
code { background: #ddd };
</style>

## What is Markdown
Markdown is very easy to learn and work with because it's basically text with a relatively small set of markup 'operators'. It uses already familiar syntax to represent common formatting conventions like `*italic*` and `**bold**` or `* line` for bulleted text. You can also embed code blocks with syntax highlighting easily.

Markdown understands basic **line breaks** so you can generally just type text as you normally do. However, **Markdown treats single line breaks as spaces** - only a double line break is considered a paragraph break.

Markdown also allows for raw HTML inside of a markdown document, so if you want to embed something more fancy than what Markdowns syntax can do you can always fall back to HTML. However to keep documents readable that's generally not recommended.

## Basic Markdown Syntax
The following are a few examples of the most common things you are likely to do with Markdown while building typical documentation.

### Bold and Italic

```Markdown
This text **is bold**. 
This text *is italic*.
```

<div class="code-output">

This text **is bold**.  
This text *is italic*.

</div>

### Header Text

```Markdown
# Header 1
## Header 2
### Header 3
#### Header 4
##### Header 5
###### Header 6
```

<div class="code-output">

# Header 1
## Header 2
### Header 3
#### Header 4
##### Header 5
###### Header 6

</div>

### Line Continuation
A single line break in markdown is not considered a line break but treated like a space. In order to break text you need to either:

* Use a double line break (paragraph)
* Add two spaces or a `\` at the end of the line (soft line break)

By default Markdown **adds paragraphs at double line breaks**. Single line breaks by themselves are simply wrapped together into a single line. If you want to have **soft returns** that break a single line, add **two spaces at the end of the line**.

```markdown
This line has a paragraph break at the end (empty line after).

Theses two lines should display as a single
line because there's no double space at the end.

The following line has a soft break at the end (two spaces at end)  
This line should be following on the very next line.
```
<div class="code-output">

This line has a paragraph break at the end (empty line after).

Theses two lines should display as a single
line because there's no double space at the end.

The following line has a soft break at the end (two spaces at end)  
This line should be following on the very next line.

</div>

### Links
```markdown
[Help Builder Web Site](http://helpbuilder.west-wind.com/)
```

<div class="code-output">

[Help Builder Web Site](http://helpbuilder.west-wind.com/)

</div>

If you need additional image tags like targets or title attributes you can also embed HTML directly:

```markdown
Go the Help Builder site: <a href="http://west-wind.com/" target="_blank">Help Builder Site</a>.
```

<div class="code-output">

Go the Help Builder site: <a href="http://west-wind.com/" target="_blank">Help Builder Site</a>.

</div>

### Images
```markdown
![Help Builder Web Site](https://helpbuilder.west-wind.com/images/HelpBuilder_600.png)
```

<div class="code-output">

![Help Builder Web Site](https://helpbuilder.west-wind.com/Images/wwhelp_128.png)

</div>

### Block Quotes
Block quotes are callouts that are great for adding notes or warnings into documentation.

```markdown
> ### @icon-info-circle Headers break on their own
> Note that headers don't need line continuation characters 
as they are block elements and automatically break. Only text
lines require the double spaces for single line breaks.
```

> ### @icon-info-circle Headers break on their own
> Note that headers don't need line continuation characters as they are block elements and automatically break. Only text lines require the double spaces for single line breaks.

### Fontawesome Icons
Help Builder includes a custom syntax for <a href='http://fortawesome.github.io/Font-Awesome/icons/' target='wwthreadsexternal'>FontAwesome</a> icons in its templates. You can embed a `@ icon-` followed by a font-awesome icon name to automatically embed that icon without full HTML syntax.


```markdown
Gear: @ icon-cog Configuration 
```
<small>*note there's no space between the @ and the `icon-cog` - done here for display purpose*</small>

<div class="code-output">

@icon-cog Configuration

</div>

### Emoji
Emoji can be embedded into Markdown with [Emoji shortcut text strings](https://gist.github.com/rxaviers/7360908) or common symbols like `:-)`

```markdown
:smile: :sweat: :rage:
:-) :-( :-/
```

<div class="code-output">

:smile: :sweat: :rage:

:-) :-( :-/

</div>



### HTML Markup
You can also embed plain HTML markup into the page if you like. For example, if you want full control over fontawesome icons you can use this:

```markdown
This text can be **embedded** into Markdown:  
<i class="fas fa-sync fa-spin fa-lg"></i> Refresh Page
```
<div class="code-output">

This text can be **embedded** into Markdown:  
<i class="fas fa-sync fa-spin fa-lg"></i> Refresh Page

</div>

### Unordered Lists

```Markdown
* Item 1
* Item 2
* Item 3
This text is part of the third item. Use two spaces at end of the the list item to break the line.

A double line break, breaks out of the list.
```

<div class="code-output">

* Item 1
* Item 2
* Item 3  
This text is part of the third item. Use two spaces at end of the the list item to break the line.

A double line break, breaks out of the list.
</div>

### Ordered Lists

```Markdown
1. **Item 1**  
Item 1 is really something (no line break here)
2. **Item 2**  
Item two is really something else (two spaces after 'header' breaks)

If you want lines to break using soft returns use two spaces at the end of a line. 
```

<div class="code-output">

1. **Item 1**
Item 1 is really something (no line break here)
2. **Item 2**  
Item two is really something else (two spaces after 'header' breaks)

If you want to lines to break using soft returns use to spaces at the end of a line. 
</div>

### Inline Code
If you want to embed code in the middle of a paragraph of text to highlight a coding syntax or class/member name you can use inline code syntax:

```markdown
Structured statements like `for x =1 to 10` loop structures 
can be codified using single back ticks.
```

<div class="code-output">

Structured statements like `for x =1 to 10` loop structures 
can be codified using single back ticks.

</div>


### Code Blocks with Syntax Highlighting
Markdown supports code blocks syntax in a variety of ways:

```Markdown
The following code demonstrates:

    // This is code by way of four leading spaces
    // or a leading tab

More text here
```
<div class="code-output">

The following code demonstrates:

    // This is code by way of four leading spaces
    // or a leading tab

More text here

</div>

### Code Blocks
You can also use triple back ticks plus an optional coding language to support for syntax highlighting (space injected before last ` to avoid markdown parsing):

~~~markdown
```csharp
// this code will be syntax highlighted
for(var i=0; i++; i < 10)
{
    Console.WriteLine(i);
}
```    
~~~

<div class="code-output">

```csharp
// this code will be syntax highlighted
for(var i=0; i++; i < 10)
{
    Console.WriteLine(i);
}
```    

</div>

Many languages are supported: html, xml, javascript, css, csharp, foxpro, vbnet, sql, python, ruby, php and many more. Use the Code drop down list to get a list of available languages.

You can also leave out the language to get no syntax coloring but the code box:

~~~markdown
```cmd
robocopy c:\temp\test d:\temp\test
```
~~~

<div class="code-output">


```cmd
robocopy c:\temp\test d:\temp\test
```

</div>


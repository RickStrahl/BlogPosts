---
title: Markdown Escape Sequences
weblogName: West Wind Web Log
postDate: 2019-02-23T14:33:38.6462946-10:00
---
# Markdown Escape Sequences

Markdown is getting ever more popular and is being put to work in a variety of scenarios. The more you use it the more you might run into a few of those funky cases where you need to escape some of markdown's formatting directives and display them as text. 

In this post I compile a list of a few escape sequences as a references. 

> Note: this post can be edited on Github and submitted via PR - if you want to add a sequence you can add a pull request and if valid I'll merge it in here.


### Standard Escape
As a general rule you can escape Markdown characters using the `\\` character. If there's something you don't want to process as a Markdown character because you need to display it as part of your text use the `\\` to escape that character.

```text
This is an html tag that renders \<small\> text.

\* Addendum: leave me be!

This is not \*italic\*
```

> This is an html tag that renders \<small\> text.
>
> \* Addendum: leave me be!
>
> This is not \*italic\*

Without the tags the HTML tags would be interpreted as HTML. The `*` would normally expand into a list item, but by prefixing with `\\` it is printed as is.

You can escape the following characters (from Daring Fireballs [original Markdown document](https://daringfireball.net/projects/markdown/syntax#backslash)): 

* \\   backslash
* \`   backtick
* \*   asterisk
* \_   underscore
* \{\}  curly braces
* \[\]  square brackets
* \(\)  parentheses
* \#   hash mark
* \+   plus sign
* \-   minus sign (hyphen)
* \.   dot
* \!   exclamation mark





### Escape Fenced Code Blocks
My own #1 issue where I run into trouble is if I want to display Markdown as text for documentation purposes and within that text I want to displayed

### Escape Inline Code
Inline code is very useful in developer documentation and used to show unescaped code. But it gets weird if you need to actually use a `` ` `` inside of an inline block.

You can use double `` ` ``

```text
This is of type ``Dictionary`1``.
```

> This is of type ``Dictionary`1``.

This works fine if the backtick is not the first or last character in the text. 

If it is you need to add a space before or after the embedded `` ` ``:

```text
`` ` ``
```

> `` ` ``

<small>reference [from StackOverFlow](https://meta.stackexchange.com/a/82722)</small>


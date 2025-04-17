---
title: Restricting Input in HTML Textboxes to Numeric Values
abstract: There are lots of examples limiting HTML textbox input to numeric values only but most examples fail to capture valid keys like navigation and edit keys properly so as to not interfere with normal textbox behaviors. Here's a simple plug-in that takes special keys into account.
categories: JavaScript,jQuery,HTML
keywords: Html TextBox, Numeric Input,JavaScript,TextBox,Masked Input,forceNumeric,Plug-in
weblogName: West Wind Web Log
postId: 1006040
postDate: 2018-04-28T23:25:34.7716455-07:00
---
# Restricting Input in HTML Textboxes to Numeric Values

Ok, here’s a fairly basic one – how to force a textbox to accept only numeric input. Somebody asked me this today on a support call so I did a few quick lookups online and found the solutions listed rather unsatisfying. The main problem with most of the examples I could dig up was that they only include numeric values, but that provides a rather lame user experience. You need to still allow basic operational keys for a textbox – navigation keys, backspace and delete, tab/shift tab and the Enter key - to work or else the textbox will feel very different than a standard text box.

Yes, there are plug-ins that allow masked input easily enough but most are fixed width which is difficult to do with plain number input. So I took a few minutes to write a small reusable plug-in that handles this scenario. Imagine you have a couple of textboxes on a form like this:

```html
<div class="containercontent">

     <div class="label">Enter a number:</div>
    <input type="text" name="txtNumber1" id="txtNumber1" 
           value="" class="numberinput" />

     <div class="label">Enter a number:</div>
    <input type="text" name="txtNumber2" id="txtNumber2" 
           value="" class="numberinput" />
</div>      
```  
  
and you want to restrict input to numbers. Here’s a small .forceNumeric() jQuery plug-in that does what I like to see in this case:

<small style="color: firebrick;font-style: italic">Updated thanks to [Elijah Manor](https://twitter.com/elijahmanor) for a couple of small tweaks for additional keys to check for</small>

```html
<script type="text/javascript">
 $(document).ready(function () {
     $(".numberinput").forceNumeric();
 });

 // forceNumeric() plug-in implementation
 jQuery.fn.forceNumeric = function () {
     return this.each(function () {
         $(this).keydown(function (e) {
             var key = e.which || e.keyCode;

             if (!e.shiftKey && !e.altKey && !e.ctrlKey &&
             // numbers   
                 key >= 48 && key <= 57 ||
             // Numeric keypad
                 key >= 96 && key <= 105 ||
             // comma, period and minus, . on keypad
                key == 190 || key == 188 || key == 109 || key == 110 ||
             // Backspace and Tab and Enter
                key == 8 || key == 9 || key == 13 ||
             // Home and End
                key == 35 || key == 36 ||
             // left and right arrows
                key == 37 || key == 39 ||
             // Del and Ins
                key == 46 || key == 45)
                 return true;

             return false;
         });
     });
 }
</script>
```     

With the plug-in in place in your page or an external .js file you can now simply use a selector to apply it:

```js
$(".numberinput").forceNumeric();
```

The plug-in basically goes through each selected element and hooks up a keydown() event handler. When a key is pressed the handler is fired and the keyCode of the event object is sent. Recall that jQuery normalizes the JavaScript Event object between browsers. The code basically white-lists a few key codes and rejects all others. It returns true to indicate the keypress is to go through or false to eat the keystroke and not process it which effectively removes it.

Simple and low tech, and it works without too much change of typical text box behavior.

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
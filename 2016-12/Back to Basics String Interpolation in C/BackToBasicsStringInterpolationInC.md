# Back to Basics: String Interpolation in C#

![](LineKnot.jpg)

One of my favorite features of C# 6.0 - which has been out for a while now - is **String Interpolation**. String Interpolation is a fancy name for compiler based string templates that allow you to embed expression values into literal strings with the compiler expanding the embedded values into the string using the `$` operator:

```csharp
var msg = $".NET Version: {Environment.Version}" 
// .NET Version: 4.0.30319.42000
```

You can think of String Interpolation of compiler sugar around the `string.Format()` function for string literals, although there are some differences between how you use String Interpolation and `string.Format()` that I describe later in this post.

### String Interpolation - Inline Template Literals
String Interpolation is like an inlined, much more readable version of `string.Format()`. Rather than using `string.Format()` with `{0}`, `{1}` etc. for value embedding, you can use `{varNameOrExpression}` directly inside of the string content.

To demonstrate let's look at creating an embedded string using string.Format() first. I'm using [LinqPad](https://www.linqpad.net/) here and you can find these examples in a [Gist on GitHub](https://gist.github.com/RickStrahl/ef851ce1597b97ee0c2dba06a858db07):

**string.Format()**  
```csharp
string name = "Rick";
int accesses = 10;
string output = string.Format("{0}, you've been here {1:n0} times.",
                              name, accesses);
output.Dump();
```

The same code written using C# 6.0 string interpolation looks like this:

**String Interpolation**  
```csharp
string name = "Rick";
int accesses = 10;
string output = $"{name}, you've been here {accesses:n0} times.";
output.Dump();
```	

Both produce:

**Rick, you've been here 10 times.**

Notice that like `String.Format()` the expressions you use can provide a format expression, which is the same value you would use in a `.ToString("n0")` function.

The second example is much more readable, especially if you have a few expressions that you're pushing into a string. You don't have to worry about order as you can simply embed any valid and in-scope C# expression into the string template.

> {Expressions} can be any valid C# expression. 

The following is a simple math expression:

```c#
int x = 20;
int y = 15
string = $"Adding {x} + {y} equals {x + y}"
```

You can also use object properties and call methods on objects. The following uses the DateTime and Exception objects:

```csharp
catch(Exception ex) 
{
    mmApp.Log($"{DateTime.UtcNow.ToString("dd-MM-yyyy HH:mm:ss")} - DOM Doccument update failed: {ex.Message}",ex);
}
```

Note I'm using `.ToString()` explicitly in the code above to demonstrate that you can use a method, but really you can use the formatting expression syntax:

```csharp
$"Time: {DateTime.UtcNow:dd-MM-yyyy HH:mm:ss}"
```

You can use object properties and methods just as easily as local variables declared inside of the current method. Any valid C# expression that's in scope is usable for an expression.

##AD##

### Multiline
String templates also work across multiple lines so you can expand text into a verbatim string literal prefixed with the `@`:

```csharp
// parameterized values
DateTime releaseDate = DateTime.Now.Date;
decimal version = 1.01M;
string newStuff = @"
* Fixed blah
* Updated foo
* Refactored stuff
";

// actual string literal
string message = $@"Version {version} of Markdown Monster is now available.

Released on: {releaseDate:MMM dd, yyyy}	
{newStuff}
";

message.Dump();
```	

Which produces:

```ini
Version 1.01 of Markdown Monster is now available.
  
  Released on: Dec 26, 2016  
  
  * Fixed blah
  * Updated foo
  * Refactored stuff
```

The combination of multi line literals and embedded string expressions make for a much more readable experience when dealing with long strings. This is useful for message dialogs, log entries and any other situations where you need to write out larger blocks of text with embedded values.

### Interpolated Strings are not a Template Solution
At first blush interpolated strings look like an easy way to create string templates that evaluate expressions. But it's important to understand that String Interpolation in C# is merely compiler generated syntactic sugar that dynamically **generates `string.Format()` code with compile time expressions that are parameterized**. The format string has to be a static string literal. 

The String literals part is important: You can't load an Interpolated Format String string like `"Hello {name}"` from a file and 'evaluate' that. Would be nice if that worked, but no cigar...

This means that unlike `string.Format()` which does let you explicitly specify a format string **at runtime**, string interpolation **requires** that the format string is a **static string literal** in your source code.

> ### Interpolated Strings must be Static String Literals
> Interpolated strings **have to** exist in their entirety at compile time as string literals, and all the expressions embedded in the string must be properly in scope in order for the compiler to embed them into the generated code. Otherwise a compiler error is generated.

What this means is that you **can't parameterize** the format string with String Interpolation. This concept **does not work**:

```csharp
var format = "Time is {DateTime.Now}";
Console.WriteLine($format);
```

But you **can parameterize** the format string when using `string.Format()`. This **does work**:

```csharp
var format = "Time is {0}";
Console.WriteLine(String.Format(format, DateTime.Now));
```

### Looking at the IL Code
To understand how this works you can look at the generated IL code on an Interpolated string.

Let's look at the first example again:

```csharp
string name = "Rick";
int accesses = 10;
string output = $"{name}, you've been here {accesses:n0} times.";
output.Dump();
```	

which turns into this IL code (as decompiled by [LinqPad](https://www.linqpad.net/)):

```ini
IL_0000:  nop         
IL_0001:  ldstr       "Rick"
IL_0006:  stloc.0     // name
IL_0007:  ldc.i4.s    0A 
IL_0009:  stloc.1     // accesses
IL_000A:  ldstr       "{0}, you've been here {1:n0} times."
IL_000F:  ldloc.0     // name
IL_0010:  ldloc.1     // accesses
IL_0011:  box         System.Int32
IL_0016:  call        System.String.Format
IL_001B:  stloc.2     // output
IL_001C:  ldloc.2     // output
IL_001D:  call        LINQPad.Extensions.Dump<String>
IL_0022:  pop         
IL_0023:  ret
```

You can see how the compiler is turning our Interpolated String literal into a `string.Format()` method call. The compiler creates creates local variables and embeds those into the `string.Format()` call as parameters.

The following code uses an exception object:

```csharp
public void Log(Exception ex)
{	
 	string val = $"{DateTime.UtcNow.ToString("dd-MM-yyyy HH:mm:ss")} - DOM Doccument update failed: {ex.Message}";
	val.Dump();
}
```

which turns into:

```ini
IL_0000:  nop         
IL_0001:  ldstr       "{0} - DOM Doccument update failed: {1}"
IL_0006:  call        System.DateTime.get_UtcNow
IL_000B:  stloc.1     
IL_000C:  ldloca.s    01 
IL_000E:  ldstr       "dd-MM-yyyy HH:mm:ss"
IL_0013:  call        System.DateTime.ToString
IL_0018:  ldarg.1     
IL_0019:  callvirt    System.Exception.get_Message
IL_001E:  call        System.String.Format
IL_0023:  stloc.0     // val
IL_0024:  ldloc.0     // val
IL_0025:  call        LINQPad.Extensions.Dump<String>
IL_002A:  pop         
IL_002B:  ret   
```

It's a neat trick, but it clearly demonstrates that you can't dynamically load a string with expressions and expect to evaluate the string. The code is generated at compile time and hard codes the expressions in the string into the compiled code which means the expressions are fixed at runtime. 

Effectively this means you can use this feature only for inlining expressions into literal strings.

### Performance
As you can see by the IL generated, the compiler generates `string.Format()` code. There's a tiny bit of overhead for the explicit variable embedding but the overhead is very, very small. Running a comparison of `string.Format()` versus produced almost identical perf results with less than 1% of overhead and we're talking about a million repetitions in less than a half a second.

But this is micro optimization at best. If performance is that important to you then you shouldn't be using `string.Format()` at all and just stick with `String.Concat()`, the `+` operator, or `StringBuilder` which all are slightly faster.

### Where can you use it?
You can use String Interpolation with C# 6.0, and any post 4.5 version of .NET assuming you are using the C# 6 or later Roslyn compiler. Although Roslyn can compile down to .NET 4, String Interpolation relies on newer features of the framework to work properly - specifically **FormattableString**. You can still use this feature in older versions by [poly filling the missing methods](https://www.thomaslevesque.com/2015/02/24/customizing-string-interpolation-in-c-6/). Thanks to [Thomas Levesque](https://twitter.com/thomaslevesque) for pointing this out in the comments. 

### Summary
String Interpolation is a great way to make **code** more readable, but keep in mind that it's not a runtime templating solution as you can't read a format string into memory and then evaluate it - that's not possible using the String Interpolation syntax. This is purely a compiler feature that makes inlined string literals in your code more readable and maintainable. 

Out of the feature set in C# 6 this feature (and the null propagation operator) is the one I probably use the most. I find I constantly use it for notification messages (status, message boxes, task notifications) and logging messages. It sure beats writing out verbose `string.Format()` commands.

What do you use String Interpolation for? Chime in in the comments.

### Resources
* [String Interpolation Sample Gist](https://gist.github.com/RickStrahl/ef851ce1597b97ee0c2dba06a858db07) (LinqPad)
* [LinqPad](https://www.linqpad.net/)
* [Customizing String Interpolation in C# 6](https://www.thomaslevesque.com/2015/02/24/customizing-string-interpolation-in-c-6/)

<small>post created with [Markdown Monster](https://markdownmonster.west-wind.com/)</small>


<!-- Post Configuration -->
<!--
```xml
<blogpost>
<title>Back to Basics: String Interpolation in C#</title>
<abstract>
String Interpolation provides string templating for string literals in C#. Rather than using string.Format you can use string interpolation to produce much more readable code that embeds expression values directly into string literals rather than escaping numeric arguments as you do with string.Format(). In this post I look at how string interpolation works, what the compiler does under the covers and some common use cases where it makes life easier.
</abstract>
<categories>
C#,.NET
</categories>
<keywords>
C#,String,String Interpolation,string.Format,Template,Literals
</keywords>
<isDraft>False</isDraft>
<featuredImage>https://weblog.west-wind.com/images/2016/Back%20to%20Basics%20String%20Interpolation%20in%20C/LineKnot.jpg</featuredImage>
<weblogs>
<postid>100480</postid>
<weblog>
West Wind Web Log
</weblog>
</weblogs>
</blogpost>
```
-->
<!-- End Post Configuration -->

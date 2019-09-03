---
title: Variable Scoping in Anonymous Delegates in C#
abstract: On a few occasions anonymous methods still throw me for a conceptual loop. I'm comfortable with them in JavaScript, but in C# the behavior is a bit foreign and makes for some interesting compiler gymnastics. Anonymous methods work like closures and so variable scoping can be extended into these anonymous methods from the calling method scope which is pretty damn useful and the basis for what makes Lambda expressions work in the first place.
categories: .NET,CSharp
keywords: C#,Closure,Anonymous Method,Lamda,Scope,Scoping
weblogName: West Wind Web Log
postId: 330694
postStatus: 
permalink: https://weblog.west-wind.com/posts/2008/Apr/26/Variable-Scoping-in-Anonymous-Delegates-in-C
postDate: 2008-04-26T18:24:37.0000000
---
# Variable Scoping in Anonymous Delegates in C#
Every once in a while when I write code that deals with Anonymous Delegates, I still kinda freak out when it comes to the behavior of closures and the variable scoping that goes along with it. For example, the following code uses a `List<T>.Find()` Predicate to search for items in the list and requires that a dynamic value is compared to:
 
```csharp
public void AddScript(ScriptItem script)
{
    ScriptItem match = null;
 
    // *** Grab just the path
    if (!string.IsNullOrEmpty(script.Src))
    {
        script.FileId = Path.GetFileName(script.Src).ToLower();
 
        match = this.InternalScripts.Find(
            delegate(ScriptItem item)
            {
               ScriptRenderModes mode = this.RenderMode;  // demonstrate this pointer
               return (item.FileId == script.FileId);
            });
    }
 
    if (match == null)                
        this.InternalScripts.Add(script);
    else
        match = script;
}
```


The `Predicate<T>` signature requires a boolean return value and an input parameter of any type (the `<T>`). The input parameter will be the item iterated over and is of the same time as the list. But the question then becomes: How do you compare that object against a dynamic value?

The freaky thing is the *script* variable in the AddScript function. It's passed in as a parameter to the outer function so it's effectively a local variable, but yet it is fully visible in the anonymous delegate's own private body. The delegate is in effect just another function, but what's different here is that the anonymous delegate inherits the variable scope of the containing method that is calling it.

To contrast if I were to call an explicit method to handle the Find filter:

```csharp
match = this.InternalScripts.Find(Exists(script2));
```

and then create a method that matches this signature I can't access the script variable so this fails to compile:

```csharp
bool Exists(ScriptItem script2)
{
    return (script2.FileId == script.FileId);   // FAILS obviously due to scoping
}
```

because script isn't available.

Behind the scenes the C# compiler creates a dynamic delegate class that includes fields for each of the local variables that need to be in scope, so when *script*  is referenced in the delegate's body it's really referencing the equivalent of this.script. The compiler fixes up the code so that the script property is set when before the method call is made so the delegate code 'appears' to be referencing a variable. If the *this* pointer is referenced in the delegate code, the compiler also creates a field that holds a reference to the calling class and then fixes up any calls to *this* to this member instead.

Here's what the compiler generated class looks like:

```
[CompilerGenerated]
private sealed class <>c__DisplayClass2
{
    // Fields
    public wwScriptContainer <>4__this;
    public ScriptItem script;

    // Methods
    public <>c__DisplayClass2();
    public bool <AddScript>b__0(ScriptItem item);
}
```

and the actual delegate method on the class:

```
public bool <AddScript>b__0(ScriptItem item)
{
    ScriptRenderModes mode = this.<>4__this.RenderMode;  
    return (this.script.Src == item.Src);
}
```
Notice that the this pointer is actually referencing a property that has the parent class assigned to it. It's all compiler sugar as well as Visual Studio's Intellisense that gives you the impression that you are in fact inside of closure method. Incidentally one thing that DOESN'T work is checking the this. pointer in the debugger while you are in the delegate code. This cannot be accessed in the debugger inside of the delegate code which would presumably cause some confusion of whether this should point at the delegate (and reveal the compiler magic) or the calling container's class.

Regardless of sleight of hand, the concept of closures is very cool and highly useful. I use it all the time in JavaScript, but damn, it still feels unnatural to me in C#. There's some debate over whether C# anonymous delegates are true lexical closures (take a look at [this post](http://blogs.msdn.com/abhinaba/archive/2005/10/18/482180.aspx) and especially the comments), but for most situations that require variable scoping to be passed down to delegates for all intents and purpose the behavior is like that of a typical closure that inherits the calling context's variable scope.

This concept of anonymous delegates and closure scoping is EXACTLY what makes Lambda Expressions work in C# 3.0. Lambdas are just glorified Anonymous Delegates. In fact, the Find() predicate above can also be expressed as a Lambda expression:

```
match = this.InternalScripts.Find( item => item.FileId == script.FileId );
```

It's funny sometimes how you end up using some functionality without really understanding what goes on underneath the covers and one day you're using something completely unrelated (in this case JavaScript closures) that make everything click and fall into place. A little spelunking with Reflector later and you feel a heck of a lot more comfortable with several language features...
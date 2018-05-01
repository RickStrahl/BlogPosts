---
title: Breaking FoxPro's 16 Meg Limit
weblogName: West Wind Web Log
postDate: 2018-04-05T10:47:47.7694773-10:00
---
# Breaking FoxPro's 16 Meg Limit - revisited


If you take a look at the Visual FoxPro documentation and the System Limits you find that FoxPro's string length limit is somewhere around ~16mb. The following is from the [FoxPro Documentation](http://msdn.microsoft.com/en-us/library/3kfd3hw9(v=vs.80).aspx):

> ##### FoxPro String Length Limit
> Maximum # of characters per character string or memory variable: 16,777,184 bytes

16mb seems like a lot of data, but in certain environments like Web applications it's not uncommon to send or receive data larger than 16 megs. 

In fact, last week I got a message from a user of our [Client Tools](http://www.west-wind.com/WestwindClientTools.aspx) lamenting the fact that the HTTP Upload functionality does not allow for uploads larger than 16 megs. One of his applications is trying to occasionally upload rather huge files to a server using our [wwHttp class](http://www.west-wind.com/webconnection/docs?page=_0rs0twgr6.htm). At the time I did not have a good solution for him due to the 16meg limit.

## The real deal on 16meg+ Strings
The FoxPro documentation actually is not quite accurate! You can actually get strings **much** larger than 16megs into FoxPro. There are limitations, but there are a number of ways you can get strings that are larger than 16 megs.

For example you can load up a huge file like the Office 2010 download from MSDN like this:

```foxpro
lcFile = FILETOSTR("e:\downloads\en_office_professional_plus_2010_x86_515486.exe")
? LEN(lcFile)
```

This file is **681megs** and it loads into the lcFile variable just fine! But when a FoxPro string is larger than 16megs the behavior of strings changes and you can't do all the things you normally do with strings.

This operation works because it's essentially an **immutable** operation - the string is loaded in one chunk and then not modified. This works **as long as the string is not modified or assigned to another string in a concatenation**.

Other operations that **mutate** strings once they are over the limit do not work. For example the following which creates an 18meg string **fails**:

```foxpro
lcString = REPLICATE("1234567890",1800000)
```
Behind the scenes FoxPro's `REPLICATE()` function mutates the original string by concatenating and so it doesn't work.

It fails with **String is too long to fit**.

However the following which uses multiple large string fragments creates a 25 meg string **does work**:

```foxpro
lcString = REPLICATE("1234567890",1500000) && < 16 megs
lcString = lcString + REPLICATE("1234567890",1000000)
? LEN(lcString)  && 25,000,000
```
The following is almost identical except it copies the longer string to another string which **does not work**:

```foxpro
lcString = REPLICATE("1234567890",1500000) 
lcNewString = lcString + REPLICATE("1234567890",1000000)
```

To make this work you can copy the string however:

```foxpro
lcString = REPLICATE("1234567890",1500000) 
lcString = lcString + REPLICATE("1234567890",1000000)
lcNewString = lcString
```

As long as you keep the variable the same you can modify the string.

You can also concatenate **the same variable** by adding **to the end** of the string and go over the 16 meg limit.

For example this **doesn't work** with a >16mb string:

```foxpro
lcNewString = STRTRAN(lcString,"5","11")
```

but this **does work**:

```foxpro
lcString = STRTRAN(lcString,"5","11")
```

Along the same lines the following **works fine** to generate a 20meg string

```foxpro
lcString = ""
FOR x = 1 TO 200000
   lcString = lcString + "0123456789"
ENDFOR
? LEN(lcString) && 20 meg
```

This is a **specially optimized case** in FoxPro - it **only works with variables** not class properties and it only works if you do `lcstring = lcString +` - ie. the same variable assigning the same variable plus something else fails (in most cases).

Concatenation **with the same variable** works if you concatenate at the end, but **not in the front**.

This **doesn't work** (notice the "!"):

```foxpro
lcString = REPLICATE("1234567890",1500000) 
lcString = "!" + lcString + REPLICATE("1234567890",1000000) 
lcNewString = lcString
```

But this **does work**:

```foxpro
lcString = REPLICATE("1234567890",1500000) 
lcString =  lcString + REPLICATE("1234567890",1000000)  + "!"
lcNewString = lcString
```

Huh? What's actually going on here? 

FoxPro **can hold** a greater than 16 meg string, but **it can't consistently manipulate it** and in the process assign it to a new variable. You can take a > 16meg string and assign it to the same variable and that works and in many cases you can also add additional string values **at the end of the string**, but **not at the front for the string**.

So what can we learn from all this:

### What Works

*   Assigning a massive string from a file **using FILETOSTR()** works
*   Building a 16mb+ string with `lcString = lcString + <other>` works
*   Assigning a large string with operations to the same string works
*   Assigning a large string to another string directly without operations works

### What doesn't work
*   Mutating functions that generate >16mb don't work
*   String Concatenation that doesn't use `lcString = lcString + <other>` don't work
*   FoxPro commands that mutate strings like `REPLICATE()`, `STRTRAN()` can't create output larger than 16 megs
*   Assigning a large string with operations to another string doesn't work

### What does all that mean?
And that my friends is the real sticking point with large strings. You can create them in one shot and even do **some limited** manipulation of them, but once they get bigger than 16megs you can no longer assign them to a new variable with mutating operations. 

If **you know** you're going to be dealing with a potentially large string, then it's quite possible to work around those limitations. But if you don't - well it's very likely you end up performing an operation on that string that won't work with the larger than 16 meg string.

## When it matters - it matters!
16 megs is not a trivial amount of string space by any means. For the vast majority of applications 16 megs is all that you ever need. Even for string centric applications that generate large string based output like West Wind Web Connection, 16 megs for output is very rare. The limits usually kick in for 'alternate' use cases.

### Large File Uploads in Web Connection and wwHttp Clients
In Web Connection and the Client Tools in particular, **large file uploads** have been a sticking point. 

A place where I've run into issues with this is in Web Connection and West Wind Client Tools where it relates to HTTP Uploads both on the client end when you might want to send a large file to a server, or on the server end when you want to receive a large file upload. Web Connection and the client tools internally use String buffers to hold POST data as it is sent and as it is received on the server. If a file is larger than 16 megs both uploads and receiving typically break.

The upload bit of the scenario was recently fixed based on a clever tip from Keith Hackett which basically dumped the large string to file. This hack is based around this idea:

> #### @icon-info-circle FoxPro has Limited Support for Strings Larger than 16 megs
> FoxPro does in fact support strings larger than 16megs. You can **load a 16 meg string** into a variable without any problems. You just **can't modify the > 16meg string once in a variable**. This means you **can't transform** it (`STRTRANS()`, `TRIM()`, `SUBSTR()` etc.) but you can **look** at it (`AT()`) and you can **copy it whole** (assignment or `STRTOFILE()` for example).
>
> String larger than 16 megs are essentially **immutable** - they can not be changed or combined. They can only accessed, copied or written whole.

Based on this concept the file upload in Web Connection can handle large file uploads by capturing the raw POST buffer of a file upload and storing it directly to a file:

```foxpro

```



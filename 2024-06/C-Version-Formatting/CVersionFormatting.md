---
title: C# Version String Formatting
featuredImageUrl: https://weblog.west-wind.com/images/2024/C-Version-Formatting/Banner.jpg
abstract: I'm tired of trying to format versions for user facing interfaces after fumbling with it again and again. In this short post I show a small helper extension method that lets you configure how to form user friendly version strings to display to end users.
keywords: Version,Formatting
categories: .NET,C#
weblogName: West Wind Web Log
postId: 4445887
permalink: https://weblog.west-wind.com/posts/2024/Jun/13/C-Version-Formatting
postDate: 2024-06-13T20:12:37.9215776-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# C# Version String Formatting

![Banner](Banner.jpg)

How many times have I sat down trying to get versions formatted correctly for display? Inside of an application to end user? Too many!

For display purposes I don't want to display versions like `8.0.0.0` or even `8.0.0` but rather `8.0`. But if have versions higher like `8.0.1.0` I **do** want to display `8.0.1` - in other words it's not a fixed number of version components. 

At first it all seems easy enough - you can use `version.ToString()` or specific format stringlike  `$"{v.Major}.{v.Minor}.{Build}`. That works, but if you don't want the `.0` at the end. Trimming `.` and `0` also can bite you on a `2.0` release. So there are a few little gotchas, and I've been here one too many times...

## Native Version Display
For the simple things there are many ways to display version information natively:

### ToString()

```cs
var ver = new Version("8.1.2.3");
version.ToString();   // 8.1.2.3

var ver = new Version("8.0.0.0");
version.ToString();   // 8.0.0.0
```

Not much control there - you always get back the entire string.

##AD##

There's also an **overload with an integer parameter** that returns only n number of the components. n is 1 through 4 which refers to major, minor, build, revision respectively:

```cs
var ver = new Version("8.1.2.3");
version.ToString(2);   // 8.1

var ver = new Version("8.0.0.0");
version.ToString(3);   // 8.0.0
```

### String Interpolation/Concatenation etc.
You can of course also build a string yourself which seems easy enough:

```cs
var ver = new Version("8.1.2.3");
string vs = $"{Major}.{Minor}.{Build}"   // 8.1.3
```

### The Problem with Fixed Formats
The problem with the above is that in some cases you might not want to display all the information if for example the Build number is 0. Or maybe you want to display build and revision but only if those values aren't 0. For example, for a version zero version release0 you probably don't want to display `8.0.0.0` but rather use `8.0`.

You might think that's simple enough too:

```cs
var ver = new Version("8.1.2.0");
string vs = $"{Major}.{Minor}.{Build}.{Revision}".TrimEnd('.','0');   // 8.1.2
```

... until you run into a problem when you have:

```cs
var ver = new Version("8.0.0.0");
string vs = $"{Major}.{Minor}.{Build}.{Revision}".TrimEnd('.','0');   // 8
```

Ooops!

## Consistent Version Function
This isn't a critical requirement, but I have so many applications where I display version information to users that I finally decided to create a function that does this generically for me instead of spending a 20 minutes of screwing each time I run into this. It took me quite a bit longer than 20 minutes as i had a false start with pure string parsing before settling on the array token approach used below.

Here's what I ended up with (after some refactoring via *Richard Deeming's* comment):

```csharp
public static class VersionExtensions
{
    /// <summary>
    /// Formats a version by stripping all zero values
    /// up to the trimTokens count provided. By default
    /// displays Major.Minor and then displays any
    /// Build and/or revision if non-zero	
    /// 
    /// More info: https://weblog.west-wind.com/posts/2024/Jun/13/C-Version-Formatting
    /// </summary>
    /// <param name="version">Version to format</param>
    /// <param name="minTokens">Minimum number of component tokens of the version to display</param>
    /// <param name="maxTokens">Maximum number of component tokens of the version to display</param>
    public static string FormatVersion(this Version version, int minTokens = 2, int maxTokens = 2)
    {
        if (minTokens < 1)
            minTokens = 1;
        if (minTokens > 4)
            minTokens = 4;
        if (maxTokens < minTokens)
            maxTokens = minTokens;
        if (maxTokens > 4)
            maxTokens = 4;

        var items = new int[] { version.Major, version.Minor, version.Build, version.Revision };

        int tokens = maxTokens;
        while (tokens > minTokens && items[tokens - 1] == 0)
        {
            tokens--;
        }
        return version.ToString(tokens);
    }
}
```

The code is pretty simple - the function is more about *not having to think about how this is supposed to work*, which is a big part of the reason for its existence. 😄

The idea that the first value is preferred display mode. If you specify 2 minimum token the idea is that you use versions like `8.1` or `1.0`. The second value specify how many tokens you can use above that. If any of these 'extra' values are `.0` they are stripped. So if you have:

```cs
var version = new Version("8.0.1.2");
string verString = version.FormatVersion(2,3);
```

you get `8.0.1`.

```cs
var version = new Version("8.0.0.0");
string verString = version.FormatVersion(2,3);

version = new Version("8.0.0.1");
verString = version.FormatVersion(2,3);
```

both of which get you `8.0`.

Here are some more examples. With the default default 2 min and max component tokens:

```csharp
var version = new Version("8.0.0.2");
string verString = version.FormatVersion();
Assert.AreEqual(verString, "8.0");


version = new Version("8.0.1.2");
verString = version.FormatVersion();
Assert.AreEqual(verString, "8.0");

version = new Version("8.3.1.2");
verString = version.FormatVersion();
Assert.AreEqual(verString, "8.3");
```

If you provide explicit min and max values to override here's what that looks like:

```csharp
// using defaults  2 min, 2 max
var version = new Version("8.0.0.2");
string verString = version.FormatVersion(3,4);
Assert.AreEqual(verString, "8.0.0.2");

// trim .0
version = new Version("8.0.1.0");
verString = version.FormatVersion(3,4);
Assert.AreEqual(verString, "8.0.1");

// all 4
version = new Version("8.3.1.2");
verString = version.FormatVersion(3,4);
Assert.AreEqual(verString, "8.3.1.2");

version = new Version("8.3.1.2");
verString = version.FormatVersion(2, 3);
Assert.AreEqual(verString, "8.3.1");

// trim of 3rd 0  8.3.0 -> 8.3
version = new Version("8.3.0.2");
verString = version.FormatVersion(2, 3);
Console.WriteLine( verString);
Assert.AreEqual(verString, "8.3");

// no trim because we look at all 4
version = new Version("8.3.0.2");
verString = version.FormatVersion(2, 4);
Assert.AreEqual(verString, "8.3.0.2");
```

Note that example #3 in the last might seem like it go several ways. The way this code works, `maxTokens` determines the how many tokens are read and worked on. So if a non-zero value exists beyond the `maxTokens` value it's ignored completely. So if the last value is zero it can be stripped regardless of the non-zero value past the `maxTokens` value.

##AD##

## Summary
Obviously not anything earth shattering, and perhaps a very limited use case, but in every end user application I build I display versions to the user and having them display nicely formatted is definitely a bonus.

And not having to figure this out all over again and not think about it again is even better!

This might save you a few minutes trying to get a version string formatted correctly and with some options for multiple scenarios. I'll probably be back here and maybe I'll even remember I added this as a utility helper to [Westwind.Utilities](https://learn.microsoft.com/en-us/dotnet/api/system.version.tostring?view=net-8.0#system-version-tostring(system-int32)) 😄

## Resources

* [VersionUtils in Westwind.Utilities on GitHub](https://github.com/RickStrahl/Westwind.Utilities/blob/master/Westwind.Utilities/Utilities/VersionUtils.cs)
* [Version.ToString() Documentation](https://learn.microsoft.com/en-us/dotnet/api/system.version.tostring?view=net-8.0#system-version-tostring(system-int32)
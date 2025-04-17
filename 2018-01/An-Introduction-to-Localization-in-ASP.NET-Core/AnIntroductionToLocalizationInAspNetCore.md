---
title: An Introduction to Localization in ASP.NET Core
weblogName: West Wind Web Log
---
# An Introduction to Localization in ASP.NET Core - Part 1
##### Part 1 - Localization in .NET in General

Localization and Globalization is one of those mundane topics in software development. Nobody wants to really do it, but most applications need it and the process of adding localization is usually tedious and distracting to the regular course of application development. No matter how good the tooling is, localization of an application requires some forethought and an understanding what you can and can't do within the context of an application.

### Globalization and Localization
The focus of this article and the follow ups will be on **Localization** which is the process of localizing static text content of a Web site. Localization is part of the greater overall banner of **Globalization** which includes all aspects of making an application ready for a global market place. Globalization is a much broader concept that includes such things as taking culture norms and conventions into account, in addition to the mundane tasks of text localization.

However, when most of us think of **Localization** in Web applications we are usually talking about making the static content of a site available in each of the supported languages. This is also what is typically provided by development frameworks like .NET internally that provide for some mechanism of storing and retrieving resources based on the active Locale (language + region).

Before we jump into the ASP.NET Core specific features for Localization however, lets look at how Localization in .NET works in general.

### Localization Features in .NET
Even with the release of .NET Core the underlying semantics of how localization is implemented in .NET hasn't changed at all since the early days of .NET 1.0. 

There are a few key concepts that make up the localization framework in .NET:

* Culture and Local Mapping
* Unicode Support
* Resource Localization via Resx


#### Cultures and Culture Mapping
The base construct for Localization/Globalization in .NET is the `CultureInfo` class. A CultureInfo instance holds all sorts of information about the active locale such as the descriptive name in English and the native language, the language code, Number and Date Formatting rules, text for things like calendar data, number separators for decimals and 1000s values and much more.

A CultureInfo instance describes a particular **language plus region**. Language alone often can't describe all aspects of a Locale - different regions might have completely different formatting for things like numbers or dates.

For example, I typically use the `en-US`, which the English Language in the US Region. There's also `en-GB` for English in the UK, or `en-CA` for English in Canada. Likewise there's `de-DE` for German in Germany, and `de-AT` for German in Austria or `de-CH` for German in Switzerland.

`en-US` and `en-GB` may both be using the English language, but there are subtle difference in the language. You say **colour**, I say **color** and so on. 

But more importantly formatting for numbers and dates might be different sometimes even for the same region depending on language or region:

```csharp
string locale = "en-CA";
123222.ToString("n",new CultureInfo(locale)).Dump();
// 123,222.00

locale = "fr-CA";
123222.ToString("n", new CultureInfo(locale)).Dump();
// 123 222.00

locale = "de-DE";
123222.ToString("n", new CultureInfo(locale)).Dump();
// 123.222.00
```

At any given point when a .NET Application executes there is an Active culture in use which is described by the static `CultureInfo.Culture` or `CultureInfo.UiCulture` properties. You can effectively change the current culture by creating a new `CultureInfo` instance:

```cs
CultureInfo.Culture = new CultureInfo("de-DE");
CultureInfo.UiCulture = new CultureInfo("de-DE");
```

Note that the two don't have to line up which is why they are configurable separately. So it's possible to set your UI culture to US English but have your formatting set to German.

#### Complete Unicode Support
I know this is 2018, and Unicode has become ubiquitous to the point that we rarely have to think about character sets and Language codes anymore. But it's a critical point that .NET is entirely based on Unicode strings and so all the supported localization languages can use Unicode without having to worry about character set discrepancies, as Unicode can express all the supported languages. With the exception of custom cultures potentially mapped to custom character sets, we never have to worry about characters of a specific language alphabet not displaying properly.

It's easy to forget that it wasn't always this way and Unicode removed a whole slew of problems related to character set mismatches and display issues. I mean who doesn't fondly remember documents with lovely `???` blocks that demarcated missing characters?

#### Resource Based Localization

---
title: Auto Selecting Cultures for Localization in ASP.NET
abstract: When creating multi-language Web sites, one of the key issues you need to deal with is how to assign a culture to display the appropriate resources. Whether you need to auto-switch locales based on browser language, or explicitly assign a locale based on user preferences there is generally some code logic involved in making these decisions. In this post I show what options are available and a small helper that simplifies setting the culture in ASP.NET applications.
categories: ' ASP.NET,Localization'
keywords: Localization,Locale,Culture,UICulture
weblogName: West Wind Web Log
postId: 426590
postDate: 2019-02-07T14:27:59.3191078-10:00
---
# Auto Selecting Cultures for Localization in ASP.NET

![](http://west-wind.com/westwind.globalization/images/westwind.localization.png)

Localization in ASP.NET hasn’t changed much since the days of WebForms and ASP.NET 1.0 with some minor updates (for WebForms) in ASP.NET 2.0\. Since then things have been rather quiet in regards to new localization features.

One of the things that just about any localized ASP.NET app needs to do is set the user’s locale, often based on the active browser language setting. There’s some limited support for auto-local switching built into .NET but this often doesn’t hit all the needs of a typical application scenario where more is required.

This post describes what’s ‘in the box’, and how you can create a simple custom solution that provides a bit more flexibility along with some discussion on how to best set the culture depending on your application requirements, whether its automatic culture detection and setting, or explicitly assigning cultures based on user preferences.

### ASP.NET Native Support for Auto Locale Switching

ASP.NET has some native support for automatic locale switching via the <globalization> web.config section. The following setting can be made in web.config:

```xml
<configuration>
  <system.web>
    <globalization culture="auto:en-US" uiCulture="fr" />
  </system.web>
</configuration>
```

This setting automatically switches the ASP.NET request to the browser client’s language if a match can be found. If the browser doesn’t provide a language or the language can’t be matched to one of the .NET installed cultures, the fallback value is used – in this case en-US.

This setting applies the ASP.NET request thread’s CurrentCulture and UICulture. The culture is switched very early in the ASP.NET HttpApplication lifecycle, so you see the selected culture applied and available even in Application_BeginRequest and then throughout the rest of the request cycle.

**Culture and UICulture**

As a refresher, recall that a .NET Culture drives things like number and date formats, currency symbols, sort order, casing etc. – ie. it’s primarily geared towards formatting and converting things. UICulture on the other hand is what .NET uses for resource localization – if you’re using Resx resources or a custom ResourceManager or ResourceProvider (in ASP.NET) the UICulture is what affects which resources are selected for display.

**WebForms**

In addition to the global web.config settings that apply globally to all ASP.NET requests, WebForms Page objects can also apply Culture and UI culture on a per page basis, and use the same auto-culture detections. For example:


```html
<%@Page Language="C#" Culture="auto:en-us" UICulture="auto:en-us" %>
```

WebForms Pages also include an [InitializeCulture()](http://msdn.microsoft.com/en-us/library/system.web.ui.page.initializeculture(v=vs.110).aspx) handler that can be overridden. It fires very early in the page cycle as a pre-init event that allows you to hook into the process of assigning a new culture before other code in the page runs and before the initial page tree and the controls within it are constructed.. InitializeCulture() can be used to override culture values set with the above attributes, or completely create a custom culture switching routine based on application logic.

**Don’t use Page level Settings**

Generally I’d advise against using Page level localization settings, to avoid missing non-Page resources in your application that might also need to be localized. For example, you might have a module that also produces localized output or error messages and if you use only page level localization only pages that have the attributes set localize properly. It’s better to use localization globally and ensure your entire application uses the same settings.

### Auto-detecting and setting the Culture with Code

Today a lot of new ASP.NET applications don’t use WebForms so the above solution clearly doesn’t work for everything. Even if it did, the solution is very generic with very little control over the process if you need to customize how localization is applied in any way. In real-world applications the requirements for locale switching tend to be a bit more complex, involving switching only to certain supported languages and locales as well as overriding some of the common culture settings. I’ll come back to this in a minute, but first lets look at a routine that I use to switch my .NET Culture and UICulture in Web applications.

To make this work you need to:

*   Sniff the Browser’s language via Accept-Header using Request.UserLanguages in ASP.NET
*   Determine the locale to select
*   Set the Thread’s CurrentCulture and CurrentUICulture to the chosen locale

#### The HTTP Accept-Language Header

The Accept-Language header is sent by most browsers and looks something like this:

```text
Accept-Language:de-DE,de;q=0.8,en-US;q=0.6,en;q=0.4
```

The header includes a list of languages that are defined in the browser’s language settings. Typically you’re only interested in the first one for setting the language as that’s the primary language. Although browsers send this automatically, keep in mind that non-browser HTTP clients typically don’t so if you’re checking for Accept-Language always assume it’s not present first, before using it.

In ASP.NET you can use the Request.UserLanguages[] property to retrieve the list of languages supported. You can check the UserLanguages[], ensure that it’s available and then read the first item:


```csharp
culture = CultureInfo.InstalledUICulture.IetfLanguageTag;

if (HttpContext.Current != null && HttpContext.Current.Request.UserLanguages != null)
{
    culture = Request.UserLanguages[0];     
}
```

#### Thread Culture
You can use different values for Culture and UI culture. But typically you use the same values for both or specify a specific culture for the Culture and a generic non-specific culture for the UICulture – ie. en-US for culture, and en for UICulture – as generally the differences between regional versions of a given language are relatively minor and not worth customizing for (color vs. colour type of issues).

Cultures are applied on the thread level in .NET and ASP.NET assigns these culture settings on the active request thread which remains active for the lifetime of a typical ASP.NET request. The culture is accessible and can also be assigned manually like this:

```csharp
Thread.CurrentThread.CurrentCulture = new System.Globalization.CultureInfo(culture); // de-DE
Thread.CurrentThread.CurrentUICulture = new System.Globalization.CultureInfo(culture); 
```

### Creating a generic routine to detect and set the Culture

With this information at hand it’s now fairly straight forward to build a generic routine that can detect and set the Culture and UICulture based on browser settings. To do this I use a generic routine in my [WebUtils class](https://github.com/RickStrahl/WestwindToolkit/blob/master/Westwind.Web/Utilities/WebUtils.cs) that handles this for me:

```csharp
/// <summary>
/// Sets the culture and UI culture to a specific culture. Allows overriding of currency
/// and optionally disallows setting the UI culture.
/// 
/// You can also limit the locales that are allowed in order to minimize
/// resource access for locales that aren't implemented at all.
/// </summary>
/// <param name="culture">
/// 2 or 5 letter ietf string code for the Culture to set. 
/// Examples: en-US or en</param>
/// <param name="uiCulture">ietf string code for UiCulture to set</param>
/// <param name="currencySymbol">Override the currency symbol on the culture</param>
/// <param name="setUiCulture">
/// if uiCulture is not set but setUiCulture is true 
/// it's set to the same as main culture
/// </param>
/// <param name="allowedLocales">
/// Names of 2 or 5 letter ietf locale codes you want to allow
/// separated by commas. If two letter codes are used any
/// specific version (ie. en-US, en-GB for en) are accepted.
/// Any other locales revert to the machine's default locale.
/// Useful reducing overhead in looking up resource sets that
/// don't exist and using unsupported culture settings .
/// Example: de,fr,it,en-US
/// </param>
public static void SetUserLocale(string culture = null, 
    string uiCulture = null, 
    string currencySymbol = null, 
    bool setUiCulture = true,
    string allowedLocales = null)
{
    // Use browser detection in ASP.NET
    if (string.IsNullOrEmpty(culture) && HttpContext.Current != null)
    {
        HttpRequest Request = HttpContext.Current.Request;

        // if no user lang leave existing but make writable
        if (Request.UserLanguages == null)
        {
            Thread.CurrentThread.CurrentCulture = Thread.CurrentThread.CurrentCulture.Clone() as CultureInfo;
            if (setUiCulture)
                Thread.CurrentThread.CurrentUICulture = Thread.CurrentThread.CurrentUICulture.Clone() as CultureInfo ;
                    
            return;
        }

        culture = Request.UserLanguages[0];
    }
    else
        culture = culture.ToLower();

    if (!string.IsNullOrEmpty(uiCulture))
        setUiCulture = true;

    if (!string.IsNullOrEmpty(culture) && !string.IsNullOrEmpty(allowedLocales))
    {
        allowedLocales = "," + allowedLocales.ToLower() + ",";
        if (!allowedLocales.Contains("," + culture + ","))
        {
            int i = culture.IndexOf('-');
            if (i > 0)
            {
                culture = culture.Substring(0, i);
                if (!allowedLocales.Contains("," + culture + ","))
                {                            
                    // Always create writable CultureInfo
                    Thread.CurrentThread.CurrentCulture = Thread.CurrentThread.CurrentCulture.Clone() as CultureInfo;
                    if (setUiCulture)
                        Thread.CurrentThread.CurrentUICulture = Thread.CurrentThread.CurrentUICulture.Clone() as CultureInfo;
                                        
                    return;
                }
            }
        }
    }

    if (string.IsNullOrEmpty(culture))
        culture = CultureInfo.InstalledUICulture.IetfLanguageTag;

    if (string.IsNullOrEmpty(uiCulture))
        uiCulture = culture;

    try
    {
        CultureInfo Culture = new CultureInfo(culture);
                
        if (currencySymbol != null && currencySymbol != "")
            Culture.NumberFormat.CurrencySymbol = currencySymbol;

        Thread.CurrentThread.CurrentCulture = Culture;

        if (setUiCulture)
        {                    
            var UICulture = new CultureInfo(uiCulture);
            Thread.CurrentThread.CurrentUICulture = UICulture;
        }
    }
    catch { }            
}
```


There are quite a few parameters to this method, but all are optional. You can pass in culture and ui culture values – if they’re not passed the browser’s language is used if available, otherwise the machine default is used.

**Currency Symbols**

You can override the currency symbol on the culture selected, which has always been a common scenario in my apps. While I often switch the culture to display number and date formatting in the user’s format, payment values are still represented in US dollars. So in a store when a user comes in with a Swiss German culture, I don’t want to show my prices in Swiss Francs, but rather in US dollars while still displaying numbers and dates in a format familiar to the user. This may not be true for all applications, but it is a common requirement where prices are displayed – prices are typically not mapped to the user’s currency automatically but either fixed up explicitly under application control or tied to a specific value. This parameter addresses this common scenario.

Currency of course is only one setting available on the Culture – what if you need to change other culture specific values? You can also set other Culture settings by directly accessing the Thread.CurrentThread.CurrentCulture instance after the call to SetUserLocale().

For example:

```csharp
WebUtils.SetUserLocale(currencySymbol: "$", allowedLocales: "en,de");
Thread.CurrentThread.CurrentCulture.NumberFormat.NaNSymbol = "XXX";
```


this works even if the culture wasn’t changed from the default because SetUserLocale() always creates a writable Culture/UICulture that can be modified after the locale has been set.

**Limiting Cultures**

Finally you can optionally accept only certain cultures that you actually support in your application. It doesn’t make a lot of sense to have a Turkish user mapped to the Turkish UICulture when you don’t have Turkish resources. Granted .NET Resource fallback will display translations in the invariant culture anyway but there’s overhead involved in looking up the Turkish language ResourceSet and then caching an empty ResourceSet for that locale. Likewise, you may not actually want to use Turkish language Cultures either, since there are [some peculiar sorting and matching criteria in the Turkish locale](http://blog.codinghorror.com/whats-wrong-with-turkey/) there that can easily bite you. If you don’t support the language explicitly it might be safer to just fall back completely to your default language.

### **Using the SetUserLocale()**

To use this SetUserLocale()  in ASP.NET the easiest place to use it is in the Application_BeginRequest() handler so that it’s set as early as possible on every ASP.NET request:

```csharp
protected void Application_BeginRequest()
{
    WebUtils.SetUserLocale();            
}
```


This gives you basically the same behavior as the ASP.NET auto culture setting. The browser is sniffed and both Culture and UICulture are set to the browser language.

Typically though I use both the currencySymbol and allowedLocales parameters:

```csharp
WebUtils.SetUserLocale(currencySymbol: "$", allowedLocales: "en,de");
```

This forces my app to always display currency values with a dollar sign while the rest of the allowed locales display their proper number formats. I tend to set allowedLocales to the languages that my app actually supports – english and german in this case. This will allow any german and english based browser clients to get custom resources, while everyone else gets the default machine culture (en-US in my case).

Note that although the most common place to do this is inside of Application_BeginRequest() to set these values globally, it’s not required and sometimes it’s very useful to be able to call this function from elsewhere in your location.

### User Specific Locales

Some applications allow users to pick a language they want to use as a user setting. In this scenario using Application_BeginRequest() doesn’t work because the user hasn’t been authenticated and the user locale information is not available yet. So, the call to SetUserLocale() has to be delayed until the user profile has been loaded and the locale to can be determined.

Where you do this can vary widely. If you are using ASP.NET Membership/Identity a good place to hook this up might be in the ResolveRequestCache handler of the HttpApplication which immediately follows the Authentication/Authorization handlers:

```csharp
protected void Application_ResolveRequestCache()
{
    // retrieve my custom user instance
    var user = User as MyUser;   // custom principle
    var culture = user.Culture;  // de-DE

    WebUtils.SetUserLocale(culture,culture, currencySymbol: "$");                        
}
```


Here I use a custom principle in my user logic and that user is contains a Culture as a string that I then EXPLICITLY assign to SetUserLocale().

### MVC Controller Initialization

The above ties in with the ASP.NET Authentication system, but that doesn’t always work because often that system doesn’t contain extended user properites such as language preferences – sometimes these decisions are pushed into the application layer.

In a recent MVC application I worked on we used a custom base controller that provided among other things the ability to set the user’s locale based on user profile settings stored in an application specific user file (ie. not membership/identity).

Here’s the relevant code from the controller:

```csharp
[RequireSslBasedOnConfigSetting()]
public class AppBaseController : Controller
{
    public BusUser LogonUser    { get; set; }

    public bool IsLoggedIn()
    {
        return LogonUser != null;
    }
    
    protected override void Initialize(RequestContext requestContext)
    {
        base.Initialize(requestContext);

        if (IsLoggedIn())
        {                
            string culture = LogonUser.Entity.Culture;
            WebUtils.SetUserLocale(culture, culture, "$");
        }
    }

}
```

The SetUserLocale() calls lives in Controller::Initialize() which fires early in the MVC pipeline, so pretty much before any user code runs in the MVC request, so all output is affected by the Culture change.

To use this functionality all the controllers in the application then inherit from this controller and so get the culture settings associated with the base:

```text
public class CellPageController : AppBaseController
```

and voila – user customizable localization.

This approach can be used with any ASP.NET framework really. If you’re using WebForms you can do the same sort of logic in a base Page class and use InitializeCulture() to call SetUserLocale() from there.

### Get Loco

Localization seems like it’s a second rate technology in ASP.NET, but even though there’s not been much love given to Localization in a long time, the tools that ASP.NET provides are sufficient, even if they tend to be low level and mired in ancient Windows localization structures and concepts. But with a little bit of tweaking it’s possible to do all sorts of neat stuff with ASP.NET localization. Setting user locale either automatically or explicitly is one simple task that any localized application needs in my opinion and I hope the discussion here gives you some ideas on how you can simplify your localization setup for ASP.NET apps.

### Related Resources

*   [**Westwind.Globalization Library**](http://west-wind.com/westwind.globalization/)(Database Resource Localization for .NET)
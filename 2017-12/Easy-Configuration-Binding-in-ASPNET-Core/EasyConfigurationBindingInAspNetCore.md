---
title: Easy Configuration Binding in ASP.NET Core - revisited
abstract: In this post I'm taking another look at using strongly typed configuration settings in ASP.NET Core, using a slightly simpler approach that foregoes using IOptions<T> in favor of directly using a configuration object instance. In the process I review the various approaches as a summary for getting configuration settings into .NET types.
keywords: Configuration,IOptions,Strongly Typed,Binding
categories: ASP.NET Core, .NET Core
weblogName: West Wind Web Log
postId: 537354
postDate: 2018-03-13T02:27:32.5110959-10:00
---
# Easy Configuration Binding in ASP.NET Core - revisited

![](Bindings.jpg)

A long while back I wrote a detailed and still relevant post that discusses [ASP.NET Core's new configuration model and binding of configuration values to .NET types](https://weblog.west-wind.com/posts/2016/may/23/strongly-typed-configuration-settings-in-aspnet-core). In it I discussed the configuration system and specifically in how to set up configuration injection using `IOptions<T>`. 

I really like the new model, which is much more flexible than the old, static `ConfigurationManager` in full framework because it provides strong typing on configuration settings out of the box. In the past I'd been using my own [Westwind.Utilities.Configuration](https://west-wind.com/westwindtoolkit/docs/_2le027umn.htm) setup from [Westwind.Utilities](https://github.com/RickStrahl/Westwind.Utilities) that provided much of the same functionality (interchangeable providers) - with .NET Core there's no need for a third (or for me first) party solution as the in-the-box implementation provides most of those same features. Nice.

In the process of setting up a new application over the weekend I stumbled across an even simpler and - to me at least, cleaner - approach to configuring and injecting configuration into an application without using `IOptions<T>`. 

Let's take a look.

### Create your Configuration Object
ASP.NET Core's configuration system allows binding object properties to a series of providers. By default there's a JSON provider that looks at `appsettings.json` file, environment variables and the **UserSecrets** store. The config system can bind values from all these providers (and any others you might add) into a typed configuration object which can even include nested sub-objects.

##AD##

I'm working on updating my blog to .NET Core - it's time: The blog is 12+ years old and still running Webforms. For that app the beginnings of my configuration object looks like this:

```cs
public class WeblogConfiguration
{
    public string ApplicationName { get; set; }
    public string ApplicationBasePath { get; set; } = "/";
    public int PostPageSize { get; set; } = 10000;
    public int HomePagePostCount { get; set; } = 30;
    public string PayPalEmail { get; set; }
    public EmailConfiguration Email { get; set; } = new EmailConfiguration();
}

public class EmailConfiguration
{
    public string MailServer { get; set; }
    public string MailServerUsername { get; set; }
    public string MailServerPassword { get; set; }
    public string SenderName { get; set; }
    public string SenderEmail { get; set; }
    public string AdminSenderEmail { get; set; }
}
```    

Note that you can easily nest the configuration objects which helps organizing complex configuration settings into easily segregated blocks. Here I separate out the email settings into a separate nested class.

I tend to use `appsettings.json` for most settings, and then use either user secrets for dev (so the values don't get shared to source control) or environment variables in production to feed in the sensitive values like passwords. Here's the relevant `appsettings.json` that has all the fields from my configuration mapped to a `Weblog` property key:

```json
{
  "Logging": { ... }
  },
  "Weblog":
  {
    "ApplicationName": "Rick Strahl's WebLog (local)"
    "ApplicationBasePath": "/",
    "ConnectionString": "server=.;database=WeblogCore;integrated security=true;MultipleActiveResultSets=True",
    "PostPageSize": 7600,
    "HomePagePostCount": 25,
    "Email": {
      "MailServer": "mail.site.com",
      "MailServerUsername": "name@site.com",
      "MailServerPassword": "nicetry",
      "SenderEmail": "admin@site.com",
      "SenderName": "West Wind Weblog",
      "AdminSenderEmail": "admin Administration"
    }
  }
}
```

### Setting up Injection in Startup.cs
To start, we need an `IConfiguration` instance which is the configuration root object. As of .NET Core 2.0 `IConfiguration` is a default service that can get injected automatically - it's one of the pre-configured services registered with the DI system as part of the .NET Core bootstrapping process. 

The default .NET Core template now also provides `IConfiguration` in the `Startup` constructor:

```cs
public Startup(IConfiguration configuration)
{
    Configuration = configuration;
}
public IConfiguration Configuration { get; }
```

So far, the same.

Here's the part that is not really written much about, which is that you can easily bind a configuration instance (or interface) explicitly **without** having to go through the `IOptions<T>` interface. 

Instead you can simply do the following in `ConfigureServices()`:

```cs
services.AddConfiguration()  // enable Configuration Services

var config = new WeblogConfiguration();
Configuration.Bind("Weblog", config);      //  <--- This
services.AddSingleton(config);
```

This provides you a filled `config` object instance that has values set from the various configuration stores. I can take the configured object and add it to the DI provider as a singleton. From then on I can inject the raw Configuration instance into other components or views.

To inject this configuration singleton added above is now simply a matter of requesting the `WeblogConfiguration` in the constructor of any class that needs it:

```cs
public class PostsController : Controller
{
    PostRepository PostRepo { get; }
    WeblogConfiguration Config  { get; }
    
    public PostsController(PostRepository postRepo, 
                           WeblogConfiguration config)
    {
        PostRepo = postRepo;
        Config = config;
    }
    ...
}
```

Likewise the repository constructor also receives an instance of the configuration object:

```cs
public PostRepository(WeblogContext context, 
                      WeblogConfiguration config) : base(context)
```

I much prefer this over injecting `IOptions<T>` because it's more direct and specifies the actual dependency that's needed by the components, plus it's easier to set up tests that now don't have to get an instance of `IOptions<T>` from somewhere.

#PAGEBREAK

### Compare to using `IOptions<T>`
Just so you know what I'm talking about when I say `IOptions<T>` implementation: Here's an example of how to set up the same behavior using `IOptions<T>` instead of the configuration singleton.


```cs
services.AddOptions();

var section = Configuration.GetSection("Weblog");
services.Configure<WeblogConfiguration>(section);
```

You can then inject into a controller's constructor like this:

```cs
public PostsController(PostRepository postRepo, 
                       IOptions<WeblogConfiguration> options)
{
    PostRepo = postRepo;
    Config = options.Value;  // note the indirect reference :-(
}
```

Obviously this isn't any more complicated, but it does require an extra layer of abstraction. `IOptions<T>` is just that - an abstraction wrapper ~~without any real feature benefits~~. That may change in the future, but for now `IOptions` is just a wrapper around the configuration instance via the `Value` property.

> ### IOptionsSnapshot can reload changed Config Settings
> One advantage to using `IOptions<T>` or more specifically [IOptionsSnapshot<T>](https://docs.microsoft.com/en-us/dotnet/api/microsoft.extensions.options.ioptionssnapshot-1) is that it can detect changes to the configuration source and reload configuration as the application is running.  

For application level code this is perfectly fine, but if I do this for my repository which lives in a separate business project independent of the main application:

```cs
public PostRepository(WeblogContext context, 
                      IOptions<WeblogConfiguration> config) : base(context)
```

having to pass in `IOptions` makes the configuration a little less accessible for testing as you now need to provide IOptions rather than a plain POCO object.

### IOptions provides additional features
After I posted this entry both Damien Edwards and David Fowler chimed in on Twitter that `IOptions<T>` provides a host of additional features that allow for composition through the lifetime of `IOptions<T>`. 

![](FowlerTweet.png)

In short there are potential benefits to using `IOptions<T>` over a raw configuration instance as the instance is essentially managed and additional services can be applied. 

I'm having a hard time visualizing the use case David is talking about that I can't directly apply against a POCO instance that is passed through an application level configuration pipeline - if you can think of a good example or use case please chime in with a comment I would love to elaborate this point here.

Personally I've been using a more direct approach and haven't run into any issues with raw configuration instances, mainly because in the applications I tend to build the configuration is not all that dynamic. In fact I can't think of configuration that needs to be any more dynamic than the core features of the configuration system (via multiple providers) already handles.


### Raw Configuration Value Binding
For completeness sake note that you can also bind string values by *configuration path* using the `Configuration` object indexer, which you can inject using the `IConfiguration` interface which in turn references a `ConfigurationRoot` instance. Using this object you get raw Configuration API access using string formatting where access a particular path key is `path:key` with 'paths' separated by `:` characters. You can think of this lower level API in the same way `Configuration.AppSettings[]` was used  in full framework to provide string based configuration access, plus the benefits of multiple providers and nested configuration paths.

To use it you can do this:

```cs
var connectionString = Configuration["Weblog:ConnectionString"]
var mailServer = Configuration["Weblog:Email:MailServer"];
```

which can be sufficient if you have only a few configuration values in your app. Given how easy it is to create typed object mapped configuration though I find it hard to recommend this approach except for dynamic key access or startup code where the configuration objects may not have been set yet.

### Static Instance? 
As many of you know I'm not the biggest fan of DI **for all things**. I think there are a few things - and especially Configuration - that need to be easily and **universally** accessible in **all** situations. Especially in older versions of .NET Core it was painful to get at the configuration objects say inside of business or a system level component since configuration wasn't automatically injected by default. That's been fixed, but it can still be difficult to get access to the DI service context in some cases.

If you're building a generic component that needs to be reused in many different environments that you may not control, there's no guarantee that DI is available and configured. Configuration is a critical component that often is needed deep in the bowels of other components or necessarily static logic where it's not easy to get access to DI injected components. It never made sense to me to force DI on simple few-line helpers when a static function that have no other dependencies.

Long story short: It is **sometimes** useful to be able to get at a static instance of configuration and while I try to avoid introducing singleton statics like this in most cases, I think configuration is one of those cases where it makes sense (at least to me).

So, I decided to also add a static property that holds the `Current` instance:

```cs
 public class WeblogConfiguration
 {
    public static WeblogConfiguration Current;

    public WeblogConfiguration()
    {
        Current = this;
    }
}
```

Since the configuration object is a singleton anyway, the `Current` property is implicitly set only once when the code in `ConfigureServices()` initially binds the config instance and it points at the same object instance that also gets injected. After that you can then use either DI whenever possible - ie. most cases -  and the static property in those few special cases when it's difficult to get access to the DI context.

In my Weblog for example, I'm copying over a lot of old helper code from the old Weblog application and there are static function helpers that generate a bunch of small HTML bits like this:

```cs
public static HtmlString ShareOnFacebook(string url)
{
    var baseUrl = WeblogConfiguration.Current.ApplicationBasePath;
    string link =
$@"<a href=""https://www.facebook.com/sharer/sharer.php?u={url}&display=popup"" target=""_blank"">
      <img src=""{baseUrl}images/shareonfacebook.png"" style=""height: 20px;padding: 0;"" />
</a>";

    return new HtmlString(link);
}
```

The static property makes this code work easily without having to refactor all of the ported functions in this class to a (pointless) class wrapper.

This gives me the best of both worlds: I get the ability to inject configuration where I can get at the DI context (just about all new code), and use the static in the few cases when DI is not easily available (legacy code).

### Many Options - Choice is good
In ASP.NET Core there are many ways to handle configuration and that's a good thing. As I mentioned I ditched my own custom solution in favor of the new configuration system in .NET Core which is *good enough* out of the box. The only thing I'm really missing is an easy way to update configuration stores and force initial values to be written, but overall that's a minor concern and doesn't make sense for all the supported providers (how do you update Environment variables loaded from a startup script for example?)

The good news is that the configuration engine is very flexible and provides a number of different ways to get at configuration objects.

* Raw `Configuration[path:key]`
* `IOptions<T>` binding to a Config Section
* `Configuration.Bind()` to bind to a Config Section
* Static Props if you want it

Choice is good - for now I'm choosing the instance based approach because to me at least it seems it's the most intuitive for working with configuration. Your mileage may vary... 

### Resources
* [Strongly Typed Configuration Settings in ASP.NET Core](https://weblog.west-wind.com/posts/2016/may/23/strongly-typed-configuration-settings-in-aspnet-core)
* [Options Configuration in ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration/options)
* [Westwind.Utilities.Configuration for Full Framework](https://west-wind.com/westwindtoolkit/docs/?page=_2le027umn.htm&page=_2le027umn.htm) from the [Westwind.Utilities library](https://github.com/RickStrahl/Westwind.Utilities)


<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
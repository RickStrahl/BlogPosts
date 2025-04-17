# Strongly Typed Configuration Settings in ASP.NET Core

<img src="GearsAndConfiguration.jpg" style="width: 100%" />

One of the first things I do whenever I start on a new project is to set up project level configuration. So it's no surprise as I'm starting to finally dig back into ASP.NET Core after the big re-org, the first thing I started with was configuration. Things have changed a bit since the last time I wrote about this subject (post forwarded to this one now) and things have thankfully gotten a little easier.

### Pluggable Configuration
ASP.NET Core has a pluggable configuration system which supports a variety of different mechanisms for reading configuration data. It looks like it still doesn't support a way to **write** configuration data, but that's a topic for another day. In this post I'll talk specifically about adding strongly typed configuration values to your configuration using the built-in configuration providers - `IOptions<T>` in particular.

### Add references
The first thing in adding strongly typed configuration is to add an additional configuration package that provides the support for strongly typed configuration classes. 

The relevant package is `Microsoft.Extensions.Options.ConfigurationExtensions` added on the bottom in `project.json`:

```json
{
  "dependencies": {
    "Microsoft.NETCore.App": {
      "version": "1.0.0-rc2-3002702",
      "type": "platform"
    },
    "Microsoft.AspNetCore.Mvc": "1.0.0-rc2-final",
    "Microsoft.AspNetCore.Server.IISIntegration": "1.0.0-rc2-final",
    "Microsoft.AspNetCore.Server.Kestrel": "1.0.0-rc2-final",
    "Microsoft.Extensions.Configuration.EnvironmentVariables": "1.0.0-rc2-final",
    "Microsoft.Extensions.Configuration.FileExtensions": "1.0.0-rc2-final",
    "Microsoft.Extensions.Configuration.Json": "1.0.0-rc2-final",
    "Microsoft.Extensions.Logging": "1.0.0-rc2-final",
    "Microsoft.Extensions.Logging.Console": "1.0.0-rc2-final",
    "Microsoft.Extensions.Logging.Debug": "1.0.0-rc2-final",
    "Microsoft.AspNetCore.StaticFiles": "1.0.0-rc2-final",
    "Microsoft.AspNetCore.Diagnostics": "1.0.0-rc2-final",
    
    
    "Microsoft.Extensions.Options.ConfigurationExtensions": "1.0.0-rc2-final",
  },
  ...
}
```
The configuration extensions give you access to the required Configuration overload to map a strongly typed class to a configuration section in the configuration store.

##AD##

### Create a new Configuration Class
Next create a new class that will hold your configuration settings. The class can be a simple POCO class:

```c#
public class MySettings
{
    public string ApplicationName { get; set; } = "My Great Application";
    public int MaxItemsPerList { get; set; } = 15;
}
```

This is very simple example, but the class you create can be more complex, with nested properties and even lists and collection.

### Hooking up the Configuration
Next we need to configure the Dependency Inject and register the new configuration class so it can map the configuration data to the actual POCO object.

Here's what you need for the strongly typed class to become available as a configuration object.

```c#
public void ConfigureServices(IServiceCollection services)
{
    services.AddMvc();

    // Add functionality to inject IOptions<T>
    services.AddOptions();
    
    // Add our Config object so it can be injected
    services.Configure<MySettings>(Configuration.GetSection("MySettings"));
    
    // *If* you need access to generic IConfiguration this is **required**
    services.AddSingleton<IConfiguration>(Configuration);
}
```

`AddOptions()` adds the basic support for injecting `IOptions<T>` based objects into your code filled with the configuration data from the store. You then register your actual configuration class and map it to the configuration section it should use to read the data from. 

In this context a *section* of a JSON configuration file is a top level property as you'll see in the next step. In Environment variables a *section* would be separator level based on the separator character (`:` or `__`).

> #### @icon-warning Injecting IConfiguration
> This is unrelated to using the strongly typed class and IOptions<T>, but when you need inject a more generic IConfiguration for using string based configuration, make sure to explicitly register IConfiguration with the DI system. If you don't you get this error:  
>
> *InvalidOperationException: Unable to resolve service for type 'Microsoft.Extensions.Configuration.IConfiguration' while attempting to activate 'WebApplication8.Controllers.ConfigurationController'.*  
>
> Adding `services.AddSingleton<IConfiguration>(Configuration)` fixes this issue.


### Adding configuration values to Appsettings.json
Let's assume you use the default configuration that gets set up in a new project like this:

```csharp
public Startup(IHostingEnvironment env)
{
    var builder = new ConfigurationBuilder()
        .SetBasePath(env.ContentRootPath)
        .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
        .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
        .AddEnvironmentVariables();
        
    Configuration = builder.Build();
}
```

This results in configuration settings being stored in `appsettings.json` with potential override files for a the given environment (ie. `appsettings.production.json`).

You can now add your custom options below the root as a nested object in `appsettings.json`:

```csharp
{
  "MySettings": {
    "ApplicationName": "My Very First MVC Application",
    "MaxItemsPerList": 10
  },  
  "Logging": {
    "IncludeScopes": false,
    "LogLevel": {
      "Default": "Debug",
      "System": "Information",
      "Microsoft": "Information"
    }
  }
}
```

As mentioned in the previous setting, the name you specify in `GetSection("MySettings")` maps to a top level property in the JSON file. Anything below is pulled into your configuration object when the configuration is read.

##AD##

### Accessing the Strongly Typed Configuration in an MVC Controller
In order to use the newly created configuration section we now have to inject the configuration data into the controller. There are a couple of ways to get at the configuration data:

* Using the IOptions<MySettings> strongly typed object
* IConfiguration.GetValue()

Let's look at the strongly typed resources first. 

```csharp
[Route("api")]
public class ConfigurationController : Controller
{
    private MySettings MySettings { get; set; }

    public ConfigurationController(IOptions<MySettings> settings)
    {            
        MySettings = settings.Value;
    }
           

    [HttpGet("appname")]
    public string AppName()
    {
        return MySettings.ApplicationName;
    }

    [HttpGet("maxlistcount")]
    public int MaxListCount()
    {
        return MySettings.MaxItemsPerList;
    }
}    
```

Start by creating a constructor that injects `IOptions<MySettings>` which gives you the the configured MySettings object via the `.Value` property and store it in a private property.

In the actual controller methods you can now access the configuration object using simple strongly typed property values as you'd expect. 

Nice!

### Using String Configuration Values
You can also access your the configuration data directly using string identification without the strongly typed object, by using the `IConfiguration` provider. 

Plain IConfiguration access can be useful if you just want to add values to your configuration file without explicitly creating a mapping object and if you need to reload your configuration without restarting. 

To do this add a `Configuration` property and pass an `IConfiguration` instance into the Controller's constructor:

```csharp
[Route("api")]
public class ConfigurationController : Controller
{

    private IConfiguration Configuration { get; set; }
    private MySettings MySettings { get; set; }

    public ConfigurationController(IOptions<MySettings> settings, IConfiguration configuration)
    {            
        MySettings = settings.Value;
        Configuration = configuration;
    }
           

    [HttpGet("appname")]
    public string AppName()
    {
        return MySettings.ApplicationName;
    }

    [HttpGet("maxlistcount")]
    public int MaxListCount()
    {
        return MySettings.MaxItemsPerList;
    }


    [HttpGet("appname_key")]
    public string AppNameKey()
    {
        return Configuration.GetValue<string>("MySettings:ApplicationName");            
    }

    [HttpGet("maxlistcount_key")]
    public int MaxListCountKey()
    {
        return Configuration.GetValue<int>("MySettings:MaxItemsPerList");
    }
}
```

### Refreshing Configuration Values
Unlike standard ASP.NET applications, ASP.NET Core applications don't automatically refresh the configuration data when the data is changed in the configuration store. 

This means if you make a change while the application is running, you either need to restart the application, or explicitly refresh the configuration values.

However, the Configuration API does includes a `IConfigurationRoot::Refresh()` method that can be called and this works to refresh values if the source can refresh these values.

You can add this method somewhere in your Admin API if and invoke it when you make changes through a Web interface for example.

To use the Reload() functionality:

##AD##

##### Add Configuration
In the `ConfigureServices()` method add:

```csharp
services.AddSingleton<IConfigurationRoot>(Configuration);   // IConfigurationRoot
services.AddSingleton<IConfiguration>(Configuration);   // IConfiguration explicitly
```

to add allow `IConfigurationRoot` to be injectable. Next you need to add it to the control to be actually injected:

```csharp
private IConfiguration Configuration { get; set; }
private MySettings MySettings { get; set; }
private IConfigurationRoot ConfigRoot { get; set; }

public ConfigurationController(IOptions<MySettings> settings, IConfiguration configuration,IConfigurationRoot configRoot)
{            
    MySettings = settings.Value;
    Configuration = configuration;
    
    ConfigRoot = configRoot;
}
```

And finally you can access the config root somewhere in your controller:

```csharp   
[HttpGet("reloadconfig")]
public ActionResult ReloadConfig()
{
    ConfigRoot.Reload();

    // this should give the latest value from config
    var lastVal = Configuration.GetValue<string>("MySettings:ApplicationName");
    
    return Ok(lastVal); 
}
```

This works to refresh the string based configuration value access via `IConfiguration`.

Unfortunately it **does not work** for the strongly typed value because that value is read on startup, stored and then not updated again. So the following **will not refresh**:

```csharp
var lastVal = Mysettings.ApplicationName;
return Ok(lastVal); 
```

I haven't found a good way to do a refresh the strongly typed value short of a stop/start cycle for the application.

### Summary
ASP.NET Core finally bakes in support for strongly typed configuration objects, which is nice as it removes the need to rely on a separate solution for this functionality as I had been doing (using my [Westwind.Configuration library](https://github.com/RickStrahl/Westwind.ApplicationConfiguration)). The native support doesn't provide all of those features - specifically no support for writing and reliably reloading the config store - but it does provide the strong typing and relatively easy way to use different, pluggable providers which is good enough for more most applications.

I use strongly typed configuration extensively in every application, and I'm glad to see this functionality baked in natively. The easier it is to access configuration values, the more likely it is you end up building a configurable application. Go (con)figure...

<!-- Post Configuration -->
<!--
```xml
<abstract>
ASP.NET Core provides built-in support for using strongly typed classes to represent configuration information. The configuration system provides a flexible mechanism for using different configuration storage providers and mapping those providers to your strongly typed objects. In this post I show how to set up strongly typed resources and use them in your ASP.NET Web applications.
</abstract>
<categories>
ASP.NET Core,C#,ASP.NET
</categories>
<postid>1595398</postid>
<keywords>
Configuration,Strongly Typed,ASP.NET,IOption,IConfiguration
</keywords>
<weblog>
Rick Strahl's Weblog
</weblog>
```
-->
<!-- End Post Configuration -->















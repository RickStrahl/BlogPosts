---
title: Serving ASP.NET Core Web Content from External Folders
weblogName: Web Connection Weblog
postDate: 2019-09-21T11:15:12.8759172-07:00
---
# Serving ASP.NET Core Web Content from External Folders

ASP.NET Core makes it easy to create a Web application regardles of whether you want to create code in raw middleware, using traditional MVC Controllers and Views, or by using RazorPages as well as static content.

I love the fact that you can easily create a self-contained **local** web server with ASP.NET Core. I have a lot of scenarios of desktop applications that need access to local Web content for rendering or preview functionality and having a quick way to display content is useful.

One scenario I've been thinking about recently is to build a generic Web server that makes it super easy to serve content from an arbitrary folder - generically. You'd run an executable  either from a give folder or via a simple command line to specify a target folder and the application would serve a static (or Razor) Web site out of that folder. For me this is purely for local purposes, but I suppose it could also work as a generic multihost on a public Internet facing site.

## ASP.NET Core 3.0 is Static
By default ASP.NET Core's services are fairly statically bound to a `HostingEnvironment` and the `ContentRoot` which is the binary folder where the application lives and a `WebRoot` which is the `wwwroot` folder where you expect to store your static site resources. This is pretty accepted common ground and almost every ASP.NET Core application uses that same pattern.

If you want to serve content from other locations you have to dig in and do a little more work, but the good news is it's possible to serve data from other folders.


## Static Files from external Folders
So my specific use case is to build a generic Live Reload static file Web server that I can run from either a folder to launch a static Web site in that folder or provide a `--webrootpath` parameter to point at a folder.


To route static files to a specific folder you can do the following in `Startup.Confiugure()`:

```cs
this.WebRootPath = Configuration["WebRootPath"];  // from config or CommandLine
...
app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(WebRoot),
        RequestPath = new PathString("")
    });
```

ASP.NET Core uses `FileProviders` for any file configuration which allows it to abstract where 'locations' and files are retrieved from. For example, you can load static files from an assembly's resources or from an AzureBlob etc.

The simples provider is the PhysicalFileProvider which uses the file system. Here I assign it a new root path. I also set the `RequestPath` to `""` which is the **Root Path** - normally this defaults to `/wwwroot` but in this case I want my server to serve out of the folder I specify via config or the command line - the `WebRoot` folder in this case.


## Razor Pages 
My primary use case was for static files, but as it turns out you can also redirect Razor pages to a different folder. The idea here would be that you can simply drop a `.cshtml` page into a folder and it runs.

In ASP.NET Core 3.0 Razor by default only works with compile time compiled Razor files. Dynamic runtime compilation must be turned on explicitly. Since I want to be able to change Razor files on the fly, I have to add this functionality with .NET Core 3.0.

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddLiveReload();

    WebRoot = Configuration["WebRoot"];
    if (string.IsNullOrEmpty(WebRoot))
        WebRoot = Environment.CurrentDirectory;

    services.AddRazorPages(opt =>
        {
            opt.RootDirectory="/";
        })
        .AddRazorRuntimeCompilation(
             opt =>
             {
                 // This would be useful but it's READ-ONLY
                 // opt.AdditionalReferencePaths = Path.Combine(WebRoot,"bin");
        
                opt.FileProviders.Add(new PhysicalFileProvider(WebRoot));
         });
}
```

The key here is the `AddRazorCompilation()` which is what adds the dynamic runtime compilation functionality. This is required if you want to Razor Pages to be compiled **after the application has started** so that a file change can immediately be refreshed without recompiling the application.

I also add a new `FileProvider` and point it at my custom `WebRoot` folder I specify via Config file, or the command line, or default to the current launching folder.

And this works. In fact you can even move over your `_ViewStart.cshtml` and `_ViewImports.cshtml` and `Shared` folders into the newly created folder and it all works as you would expect in the external location. 

That's pretty cool because now you essentially have a local free standing Web Server that can serve Razor pages in any folder!

But - there are some caveats:

* You're limited to the compiled .NET Runtime References (can't add depedencies)



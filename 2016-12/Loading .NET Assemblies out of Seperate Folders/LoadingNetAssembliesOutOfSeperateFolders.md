# Loading .NET Assemblies out of Seperate Folders

![](Tree_featured.jpg)

.NET's loading of binaries is great in most standard .NET applications. Assemblies are loaded out of the application folder or a special private bin folder (like ASP.NET applications) and it all works as you would expect.

But, once you need to **dynamically load assemblies** and load them out of different folders things start getting pretty ugly fast. I've been to this rodeo quite a few times, and I've used different approaches and pretty much all of them are ugly. Recently when working on Markdown Monster I ran into this again and had some really odd issues and - another solution that I hadn't used before that I want to share.

### Wait... Why?
Loading assemblies out of separate folders is not something you do very frequently in typical business applications. Most applications add references to their projects and the compiler and tooling handles spitting out the final required DLLs in the right folders. You take those folders and you're done.

The most common case for dynamic assembly loading involves some sort of addin mechanism where users can extend the application by creating custom components and plugging them into the current application, thereby extending the functionality. 

##AD##

### The slippery Slope of Addins
I came to addins via my [Markdown Monster Markdown Editor](https://markdownmonster.west-wind.com), which has support for addins where you can create custom extensions that extend the editor and UI. Basically it's quite easy to create a custom form that performs some task with the full Markdown document or manipulates specific text in the document - or publishes the markdown to some custom location. It seems like a natural fit for an editor - you write you want to push your document out to somewhere. 

Adding addins was a very early decision when I decided to create this tool, because first of all I wanted to be able to publish my Markdown directly to my blog. And I wanted to capture images from screen shots and embed them. These two features happen to be implemented as separate addins that plug into the core Markdown Monster editor. Since then I've created a couple more (an Image to [Azure Blob Storage uploader](https://github.com/RickStrahl/SaveToAzureBlob-MarkdownMonster-Addin), a Gist Code embedding Addin). A few other people have also created addins.

### Addin 0.1
Although I was very clear on wanting to create addins I didn't deal with all the issues of how to store the addins and get them downloaded and installed initially. My first take (Take 0.1) was to just dump all addins into an `.\Addins` folder and call it a day.

The application now has some startup code that checks the .DLLs in the Addins folder, checks for the addin interface and if so loads the addin. 

If you're dealing with a single external folder things are easy because you can easily set the PrivateBin path which can be set in the application's `app.config` file:

```xml
<?xml version="1.0" encoding="utf-8" ?>
<configuration>
  <runtime>
    <assemblyBinding xmlns="urn:schemas-microsoft-com:asm.v1">
      <probing privatePath="Addins" />
    </assemblyBinding>
  </runtime>
</configuration>
```

Behind the scenes this sets the AppDomain's **PrivateBin** path. This also happens to be the only way to properly add the PrivateBin path for the main executable. While there is [AppDomain.AppendPrivatePath()](https://blogs.msdn.microsoft.com/dotnet/2009/05/14/why-is-appdomain-appendprivatepath-obsolete/) this method is obsolete and can cause some potential load order problems. It also has to be called very early on in the application likely as the first line of code before additional assemblies beyond **mscorlib** are loaded.

### Loading Addins
In my application I actually didn't need this. Rather than dealing with Private Bin paths I've always used **Appdomain.AssemblyResolve** which is fired whenever an assembly cannot be resolved. If you have a single folder it's very easy to find assemblies because **you know where to look** for any missing references that the application can't resolve on its own.

To put this in perspective here is how addins are loaded. The original addin loader runs through all assemblies in the Addins folder and checks for the Addin interface and if found loads the assembly with `Assembly.LoadFrom()`. 

The assembly typically loads without a problem, but the problem usually comes from any dependent assemblies that get loaded when scanning the assembly for types that return or pass dependent assembly types.

```cs
private void LoadAddinClasses(string assemblyFile)
{
    Assembly asm = null;
    Type[] types = null;

    try
    {
        asm = Assembly.LoadFrom(assemblyFile);
        types = asm.GetTypes();
    }
    catch(Exception ex)
    {
        var msg = $"Unable to load add-in assembly: {Path.GetFileNameWithoutExtension(assemblyFile)}";                
        mmApp.Log(msg, ex);
        return;
    }

    foreach (var type in types)
    {
        var typeList = type.FindInterfaces(AddinInterfaceFilter, typeof(IMarkdownMonsterAddin));
        if (typeList.Length > 0)
        {
            var ai = Activator.CreateInstance(type) as MarkdownMonsterAddin;
            AddIns.Add(ai);
        }
    }
}
```
The `asm = Assembly.LoadFrom(assemblyFile);` never fails by itself - loading an assembly typically works. When an assembly is loaded only that assembly is loaded and not any of its dependencies. 

But, when running `asm.GetTypes();` additional types and dependencies are accessed and that triggers an assembly load attempt from .NET natively. If there's no additional probing or assembly resolve **the code bombs**.

If you are very vigilant about not bleeding external dependencies in your public interfaces you may not see dependency exceptions here, but **you will then hit them later at runtime** when you actually invoke code that uses them. 

>.NET's assembly loading is smart and delay loads assemblies only when a method is called that uses a dependency (except ASP.NET applications which explicitly pre-load all BIN folder assemblies).

However, .NET only looks for dependencies in the startup folder or any additionally declared Private Bin paths. I don't have those, so the `asm.GetTypes()` in many cases causes assembly load failures.

##AD##

### AssemblyResolve
Luckily you can capture assembly load failures and tell .NET where to look for assemblies. A simple implementation of **AssemblyResolve** looks like this:

```cs
private Assembly CurrentDomain_AssemblyResolve(object sender, ResolveEventArgs args)
{
    // Ignore missing resources
    if (args.Name.Contains(".resources"))
        return null;

    // check for assemblies already loaded
    Assembly assembly = AppDomain.CurrentDomain.GetAssemblies().FirstOrDefault(a => a.FullName == args.Name);
    if (assembly != null)
        return assembly;

    // Try to load by filename - split out the filename of the full assembly name
    // and append the base path of the original assembly (ie. look in the same dir)
    string filename = args.Name.Split(',')[0] + ".dll".ToLower();

    string asmFile = Path.Combine(@".\","Addins",filename);
    
    try
    {
        return System.Reflection.Assembly.LoadFrom(asmFile);
    }
    catch (Exception ex)
    {
        return null;
    }
}
```

And to intialize you hook it up in the startup code of your application:

```cs
AppDomain.CurrentDomain.AssemblyResolve += 
               CurrentDomain_AssemblyResolve;
```

This is pretty straight forward and it works easily because I can look for assemblies in a known folder.

#### Checking already loaded Assemblies?
Notice that before going to check for assemblies out on disk, there's a check **against already loaded assemblies**. Huh? This sounds counter intuitive. Why would this code actually trigger and **find an already loaded assembly**? I dunno, but I've had this happen consistently with **CookComputing.XmlRpcV2.dll** which is already loaded, yet somehow ends up in the `AssemblyResolve` handler. Simply returning the already loaded assembly instance oddly works, which is just strange. 

If the assembly is not already loaded, I can then try and load it from the `.\Addins` folder. With the single folder this all worked just fine.

### Folder Loading
Fast forward a couple of months and now I'm looking at creating an addin manager with downloadable addins. Of course, I quickly realized that a single folder isn't going to work as each addin needs to provide some metadata and folders make it easy to see what's installed and easy to uninstall without having to track all the files.

In theory moving the code to use folders should work the same, but there's a catch - I no longer know where the assemblies are loading from specifically because there are no many addin folders.

##### MIA - args.RequestingAssembly
Note that the AssemblyResolve handler has a `args.RequestingAssembly` property which maddeningly is always blank. If this value actually gave me the requesting or calling assembly things would be easy since I could just try loading from the same folder. But alas the value is always empty, so no go.

I tried a number of different approaches in order to figure out how to get at the assembly. Different ways of loading the assembly, moving the files, `AppendPrivateBin()` (which as mentioned earlier has no effect after assemblies have started to load).

##### Using Brute Force: Scan folder hierarchy for DLLs
In the end I ended up using an extension of what worked initially which is simply to load the assembly from disk. This time around I don't know the exact folder, but I know what the base folder is so I can simply scan the directory hierarchy for the DLLs. Yes, this definitely has some overhead, but after all the false starts this just seems to be the most reliable way to ensure assemblies are found and matched.

So now instead of hardcoding the assembly path I use this routine and reference it in **AssemblyResolve** to find my assembly:

```cs
private string FindFileInPath(string filename, string path)
{
    filename = filename.ToLower();

    foreach (var fullFile in Directory.GetFiles(path))
    {
        var file = Path.GetFileName(fullFile).ToLower();
        if (file == filename)
            return fullFile;

    }
    foreach (var dir in Directory.GetDirectories(path))
    {
        var file = FindFileInPath(filename, dir);
        if (!string.IsNullOrEmpty(file))
            return file;
    }

    return null;
}
```

Which is then called in AssemblyResolve like this:

```cs
string asmFile = FindFileInPath(filename, ".\\Addins");
if (!string.IsNullOrEmpty(asmFile))
{
    try
    {
        return Assembly.LoadFrom(asmFile);
    }
    catch
    {
        return null;
    }
}

// FAIL - not found
return null;
```

This works with everything I've thrown at it thus far so this seems like a good solution. There's definitely some overhead in this - both searching for the assemblies and then also from all the assembly preloading that occurs because of the type scanning in order to find the addin interface - which effectively preloads all used dependencies.

### Asynchronous Addin Loading
In order to minimize the overhead of this addin loading, I also load addins asynchronously, so they happen in the background while the rest of the application loads. 

```cs
protected override void OnStartup(StartupEventArgs e)
{
    // force startup directory in case we started from command line
    var dir = Assembly.GetExecutingAssembly().Location;            
    Directory.SetCurrentDirectory(Path.GetDirectoryName(dir));            

    mmApp.SetTheme(mmApp.Configuration.ApplicationTheme,
                   App.Current.MainWindow as MetroWindow);

    new TaskFactory().StartNew(() =>
    {
        ComputerInfo.EnsureBrowserEmulationEnabled("MarkdownMonster.exe");

        try
        {
            AddinManager.Current.LoadAddins();
            AddinManager.Current.RaiseOnApplicationStart();
        }
        catch (Exception ex)
        {
            mmApp.Log("Addin loading failed", ex);
        }
    });
}
```

and this seems to help to mitigate the startup lag quite a bit.


### AppDomains
No discussion of Add ins and assembly loading would be complete without mentioning AppDomains and loading Addins separately. A lot of the issues I've described here could be mitigated by using a custom AppDomain and explicitly setting up the private bin path before load time by pre-scanning the folders.

There are a some clear advantages to using AppDomains:

* Ability to load and unload addins dynamically
* Better control of Assembly resolving
* Better Isolation from the main application

But after having struggled with AppDomain based addins in a couple of other applications and realizing that add-ins need to have access to the WPF UI, there's no easy way to deal with the cross domain serialization in such a tighly integrated addin. Although possible, the complexities that this raises are not worth the effort.  
Along the same lines app Isolation is not a concern since addins have to have tight integration with the main application anyway in order to do what they need to. So addins run in-process.

It all depends on the solution used of course. More business service centric addins can be a good fit for AppDomain.

### Summary
This may sound like a fairly esoteric problem, but while searching for solutions around not getting Assembly resolve errors and loading of assemblies from multiple folders, there are a lot of people running into these same problems. There are a lot of hacky workarounds and this one is just one more in a long line of hacks. But for me at least this one has been reliably working - in fact so much so I've retrofitted it to two other applications that were previously guessing at paths.

Hopefully this will prove useful to some of you, but as always it helps me to write this down so I can find this for the inevitable next I build some add in based interface and will have forgotten what worked - it's one of those things you do so seldom that it's easy to forget...

If you want to see all the pieces together in a working application you can check out the links below in the [Markdown Monster source code on Github](https://github.com/RickStrahl/MarkdownMonster).


### Resources
* [Load Addin Classes with AddinManager](https://github.com/RickStrahl/MarkdownMonster)
* [Assembly.Resolve](https://github.com/RickStrahl/MarkdownMonster/blob/master/MarkdownMonster/App.xaml.cs#L201)

<small>*this post created with [Markdown Monster](https://markdownmonster.west-wind.com)*</small>

<!-- Post Configuration -->
<!--
```xml
<blogpost>
<title>Loading .NET Assemblies out of Seperate Folders</title>
<abstract>
In the process of updating the Addin manager in Markdown Monster I ran into a few snags with loading .NET assemblies out of separate folders. Assembly loading out of non base folders in .NET can be problematic and sure enough I ran into a few issues that took a while to find a work around for. In this post I describe some of the issues of folder based assembly loading and a brute force solution to deal with assembly resolution.
</abstract>
<categories>
.NET
</categories>
<keywords>
Assembly Loading,Addin,.NET,C#,AssemblyResolve
</keywords>
<isDraft>False</isDraft>
<featuredImage>https://weblog.west-wind.com/images/2016/Loading%20.NET%20Assemblies%20out%20of%20Seperate%20Folders/Tree_featured.jpg</featuredImage>
<weblogs>
<postid>87794</postid>
<weblog>
West Wind Web Log
</weblog>
</weblogs>
</blogpost>
```
-->
<!-- End Post Configuration -->

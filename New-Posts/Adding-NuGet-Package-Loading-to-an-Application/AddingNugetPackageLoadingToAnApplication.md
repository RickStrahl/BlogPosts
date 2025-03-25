---
title: Adding NuGet Package Loading to an Application
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2025-03-17T11:58:54.5235639-10:00
postStatus: publish
dontInferFeaturedImage: false
stripH1Header: true
---
# Adding NuGet Package Loading to an Application

![Package Loading](PackageLoading.jpg)

One of the applications I've built and use a lot is my [LiveReloadWebServer local Web server](https://github.com/RickStrahl/LiveReloadServer). It's a local Web server that you can point at a folder to serve as a Web site. It supports static content with Live Reload and also loose Razor (.cshtml) Pages and built-in themed Markdown file rendering among other things. It's a useful tool to have to quickly fire up a local client Html app or to create static sites locally and work on them interactively. There are other tools as part of Node that do this, but this is a simple utility you can run and it works anywhere in Windows including an optional shell extension to *Open Folder as LiveReload Website*.

## Executing Code
Long story short - it also has .NET code execution via loose Razor Pages support, which means you can create pages that use .NET logic using Razor Page syntax as long as pages are self contained within the `.cshtml` file. 

### External Code: Assembly Loading is so Passé
There's support for external code but up to this point it's been via loose assemblies dropped into a `PrivateBin` folder, but these days using loose assemblies is a bit quaint as everything ships as NuGet packages. 

While it's possible to dig out assemblies from packages and place them in a support folder, it's difficult to do with some components that have lots of dependencies and the dependency loading isn't maintained in the same as NuGet package loading is handled.

### NuGet Packaging is much Nicer and Immediately More Familiar
Most .NET developers these days probably barely remember how assembly loading works, and development tools don't even offer an obvious option to add assemblies directly. While a custom tool like my LiveReloadServer can mitigate that through a simple convention based set up (ie. anything in this folder gets loaded) it's not ideal.

NuGet packages are familiar to most developers and more importantly packages can automatically manage complex dependencies by downloading all dependencies needed in addition to the primary package.

## Integrating NuGet
I've thought about NuGet integration on a number of occasions for any dynamic code based solution that involves scripting. In the past I've almost always dismissed NuGet as a solution because it seemed quite complex.

Luckily it looks like as of .NET 8.0 there is some tooling built into .NET that makes NuGet integration much easier.


For the example below I'm going to be using the `Nuget.Protocol` NuGet package:

```ps
dotnet add package Nuget.Protocol
```

which provides the functionality needed to:

* Download a primary NuGet package
* Download all its dependencies

Additional code is then used to load all the required assemblies into the current process/assembly context so they become available.

Let's get right to it because the code is surprisingly straight forward.

The following is an initial self-contained implementation of a NuGetPackageLoader that:

* Download a primary NuGet package
* Downloads all its dependencies
* Loads all dependencies into 


```csharp
public class NuGetPackageLoader
{
	private readonly string _packagesFolder;
	public NuGetPackageLoader(string packagesFolder)
	{
		_packagesFolder = packagesFolder;
	}

	public async Task LoadPackageAsync(string packageId, string version)
	{
		var logger = NullLogger.Instance;
		var cache = new SourceCacheContext();
		var repositories = Repository.Provider.GetCoreV3();

		var packageSource = new PackageSource("https://api.nuget.org/v3/index.json");
		var sourceRepository = new SourceRepository(packageSource, repositories);

		var resource = await sourceRepository.GetResourceAsync<FindPackageByIdResource>();
		var packageVersion = new NuGetVersion(version);

		var packagePath = Path.Combine(_packagesFolder, packageId, version);

		Directory.CreateDirectory(packagePath);
		using var packageStream = new MemoryStream();

		await resource.CopyNupkgToStreamAsync(packageId, packageVersion, packageStream, cache, logger, default);
		packageStream.Seek(0, SeekOrigin.Begin);

		var packageReader = new PackageArchiveReader(packageStream);

		// find the highest compatible framework
		string framework = GetTargetFramework(packageReader);
		var files = packageReader.GetFiles().Where(f => f.Contains("/" + framework + "/"));
		foreach (var file in files)
		{
			var filePath = Path.Combine(packagePath, file.Replace("/", "\\"));
			if (File.Exists(filePath))
			   continue;  // already downloaded and installed
			
			Directory.CreateDirectory(Path.GetDirectoryName(filePath));
			//FileStream fileStream = null;
			try
			{
				using var fileStream = File.Create(filePath);				
				await packageReader.GetStream(file).CopyToAsync(fileStream);				
			}
			catch { /* ignore - most likely the file exists already  */ }

			if (filePath.EndsWith(".dll") && File.Exists(filePath))
			{
				var assembly = AssemblyLoadContext.Default.LoadFromAssemblyPath(filePath);
				Console.WriteLine($"Loaded assembly: {assembly.FullName}");
			}
		}
	}
	
	private string GetTargetFramework(PackageArchiveReader packageReader)
	{
		string framework = packageReader.GetReferenceItems().
								Where(g =>
								{
									string framework = g.TargetFramework.ToString();
									if (framework == "net9.0" || framework == "net8.0" || framework == "net6.0" | framework == "net7.0" ||
										framework.StartsWith("netstandard"))
										return true;
									return false;
								})
								.OrderByDescending( g=> g.TargetFramework.ToString() )								
								.Select( g=> g.TargetFramework.ToString())
								.FirstOrDefault();								
		return framework;
	}
}
```


### Loading from multiple Package Sources
Sometimes you need to load from multiple package sources - you can add local folders which is useful for dynamic and scripting applications, which is my usage scenario realistically.

For this I need to be able to load resources from the official online feed and also from a local package store that is discoverable from the application (ie. an adjacent folder where custom packages can be stored).

Here's the relevant code that does this:

```csharp
using var packageStream = new MemoryStream();

FindPackageByIdResource resource = null;
List<string> sources = new() {
  "d:\\projects\\Nugest",
  "https://api.nuget.osrg/v3/index.json"
};
foreach (var source in sources)
{
  if (!source.StartsWith("http"))
  {
     // local packages
     var sourceRepository = Repository.Factory.GetCoreV3("d:\\projects\\Nuget");
     try
     {
        resource = await sourceRepository.GetResourceAsync<FindPackageByIdResource>();
     }
     catch { continue; }
  }
  else
  {
     // only packages
     var packageSource = new PackageSource("https://api.nuget.sorg/v3/index.json");
     var sourceRepository = new SourceRepository(packageSource, repositories);
     try
     {
        resource = await sourceRepository.GetResourceAsync<FindPackageByIdResource>();
     }
     catch { continue; }               
  }
  if (await resource.CopyNupkgToStreamAsync(packageId, packageVersion,
                                 packageStream, cache, logger, default))
  {
     packageStream.Seek(0, SeekOrigin.Begin);
     break;
  }
  resource = null;
}

if (resource == null)
  return;
```

This code is pretty awkward because you don't know whether the package source works or not and whether the item lives 
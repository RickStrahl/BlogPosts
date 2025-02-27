---
title: 'XAML WPF Startup Errors: An Unsolved Mystery'
abstract: ''
keywords: ''
categories: ''
weblogName: West Wind Web Log
postId: 
postDate: 2025-01-22T09:44:19.9357170-10:00
postStatus: publish
dontInferFeaturedImage: false
stripH1Header: true
---
# XAML Startup Errors: An Unsolved Mystery

Over the years of running several commercial WPF applications, there have been a few issues that never had a good resolution.  To this day these issues continue to throw the occasional errors for users:

* [DUCE.Channel Failures](https://weblog.west-wind.com/posts/2016/Dec/15/WPF-Rendering-DUCEChannel-Crashes-due-to-Image-Loading)
* XAML Loader Crashes on Startup

Both of these issues are a real pain because they are not reproducible. They seem to be machine or perhaps even hardware (in the case of the DUCE.Channel failure) specific. Both happen seemingly randomly and even to users who are using one version of the application, upgrade to the next fail, and upgrade to the next and will be fine where none of the code changes should affect anything that makes a difference here. 'Should' being the operative word - there likely is **something very subtle** there that causes these problems.

I've covered the DUCE.Channel[ issue here before](https://weblog.west-wind.com/posts/2016/Dec/15/WPF-Rendering-DUCEChannel-Crashes-due-to-Image-Loading), but to this day I still see it pop up from time to time in my error logs. Thankfully this error is extremely rare as I see about 1 a month out of 10's thousands of user which is not bad, but still annoying!

## XAML Loader Startup Crashes
This post is about the second issue, which occurs right at application startup. It's hard to ascertain what actually happens because it fails right upon loading the application. 

which is basically the following stack trace that occurs during a WPF application's startup:

**Exception info**

```
Object reference not set to an instance of an object.
Exception has been thrown by the target of an invocation.
System.Private.CoreLib
System.Reflection.TargetInvocationException
```

**Stack Trace**

```
at System.RuntimeType.CreateInstanceDefaultCtor(Boolean publicOnly, Boolean wrapExceptions)
at System.RuntimeType.CreateInstanceImpl(BindingFlags bindingAttr, Binder binder, Object[] args, CultureInfo culture)
at System.Activator.CreateInstance(Type type, Object[] args)
at MS.Internal.Xaml.Runtime.ClrObjectRuntime.CreateInstance(XamlType xamlType, Object[] args)
at MS.Internal.Xaml.Runtime.PartialTrustTolerantRuntime.CreateInstance(XamlType xamlType, Object[] args)
at System.Xaml.XamlObjectWriter.Logic_CreateAndAssignToParentStart(ObjectWriterContext ctx)
at System.Xaml.XamlObjectWriter.WriteStartMember(XamlMember property)
at System.Windows.Markup.WpfXamlLoader.TransformNodes(XamlReader xamlReader, XamlObjectWriter xamlWriter, Boolean onlyLoadOneNode, Boolean skipJournaledProperties, Boolean shouldPassLineNumberInfo, IXamlLineInfo xamlLineInfo, IXamlLineInfoConsumer xamlLineInfoConsumer, XamlContextStack`1 stack, IStyleConnector styleConnector)
at System.Windows.Markup.WpfXamlLoader.Load(XamlReader xamlReader, IXamlObjectWriterFactory writerFactory, Boolean skipJournaledProperties, Object rootObject, XamlObjectWriterSettings settings, Uri baseUri)
at System.Windows.Markup.WpfXamlLoader.LoadBaml(XamlReader xamlReader, Boolean skipJournaledProperties, Object rootObject, XamlAccessLevel accessLevel, Uri baseUri)
at System.Windows.Markup.XamlReader.LoadBaml(Stream stream, ParserContext parserContext, Object parent, Boolean closeStream)
at System.Windows.Application.LoadBamlStreamWithSyncInfo(Stream stream, ParserContext pc)
at System.Windows.Application.DoStartup()
at System.Windows.Application.<.ctor>b__1_0(Object unused)
at System.Windows.Threading.ExceptionWrapper.InternalRealCall(Delegate callback, Object args, Int32 numArgs)
at System.Windows.Threading.ExceptionWrapper.TryCatchWhen(Object source, Delegate callback, Object args, Int32 numArgs, Delegate catchHandler)
```

### XAML 
The XAML Load Crash issue is similar, in that it appears to be totall
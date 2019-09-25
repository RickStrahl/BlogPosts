---
title: 'wwDotnetBridge: Getting and Setting COM Unsupported Values with ComValue'
abstract: ComValue is a useful helper class in wwDotnetBridge that provides a wrapper around .NET Values that otherwise would not be accessible to FoxPro due to COM value incompatibilities. ComValues can be passed into .NET methods and are returned as result values for wwDotnetBridge's intrinsic indirect access methods. In this post I describe how ComValue works and why we need it in the first place.
keywords: wwDotnetBridge,ComValue,Guid,Long,Decimal
categories: FoxPro, wwDotnetBridge
weblogName: Web Connection Weblog
postId: 956
postDate: 2019-09-24T22:32:40.9979849-07:00
---
# wwDotnetBridge: Getting and Setting COM Unsupported Values with ComValue

![](Masquerade.jpg)

wwDotnetBridge lets your FoxPro applications easily access .NET code from FoxPro, without having to register .NET Components as COM objects and with the ability to access any .NET type and type members including types that are not directly supported over COM.

wwDotnetBridge still uses COM, but unlike standard COM Interop with .NET you don't have to instantiate objects via COM, but rather you can use wwDotnetBridge to host the .NET Runtime and provide activation services for object instances. This means **any** object and any type becomes accessible, while COM interop is very limited on what can be accessed and what types are supported.

## ComValue and Types that don't work over COM
One of the reasons you want to use wwDotnetBridge rather than raw COM interop is that you get access to types that are not supported via COM. For example, COM has no support for a number of .NET Types and type formats.

Examples of unsupported types include:

* `Long`, `Single`, `Decimal` number types
* `Guid`, `Byte`, `DbNull`, `char`
* any Value type
* Enum Values
* Any Generic Value or Type

That's a pretty wide swath of types that are inaccessible via COM, but with the help of the `ComValue` class it's possible to access these types even though you can't access them natively in FoxPro.

`ComValue` is a facade that provides a **wrapper around a .NET Value**. It masquerades as a stand-in for the .NET Value and makes it accessible to FoxPro via helper methods that can set and retrieve the .NET value as something that FoxPro can deal with.

### How it works
`ComValue` works by creating a .NET wrapper object with a `Value` property that holds the actual .NET value and methods that allow setting and retrieving that value - or a translation thereof - in FoxPro. The `Value` is stored in .NET and is **never passed directly to FoxPro** because effectively it's not accessible there. Instead you pass or receive a `ComValue` instance that **contains the Value** and has conversion routines that allow access to the Value from FoxPro both for setting and getting value.

The idea is simple: The actual raw Value never leaves .NET and the value is always indirectly accessed via conversions that let you set and retrieve the `Value` as something that works in FoxPro. So `DbNull` is turned into a `null`, or a `Guid` into a string and vice versa for example.

### Automatic ComValues
One of the nice - but also often confusing - features of wwDotnetBridge is that it will automatically return `ComValue` instances for most types that otherwise are incompatible. So when you use wwDotnetBridge's intrinsic helper functions and you pass in or receive back say a .NET `Guid` it'll automatically convert that Guid into a `ComValue` that is returned instead.

ComValue results are automatically returned with:

* `GetProperty()`
* `InvokeMethod()` result values
 
For example:

```foxpro
loGuid = loBridge.InvokeMethod(loObj,"GetGuid") 
* Get Guid from ComValue
lcGuid = loGuid.GetGuid()
```

You can **pass ComValue objects** when using these methods:

* `SetProperty()`
* `InvokeMethod()` parameters
* `CreateInstance()` constructor parameters
* `ComArray.AddItem()`

For these methods you create a `ComValue` instance and set the `Value` and then pass that to one of the above methods.

```foxpro
lcGuid = GetAGuidStringFromSomewhere()
loGuid = loBridge.CreateValue()
loGuid.SetGuid(lcGuid)

llResult = loBridge.InvokeMethod(loObj,"SetGuid",loGuid)
```

It's important to understand that it's **wwDotnetBridge** that understands `ComValue` instances, **not .NET**, so you can only pass or receive a `ComValue` through the above *indirect access methods* never to a .NET method via direct COM access.

### Simple type conversion:
Here's an example of passing a byte/in16 value which natively is not supported back and forth between FoxPro and .NET:

```foxpro
*** Create .NET Object instance
loNet = loBridge.CreateInstance("MyApp.MyNetObject")

*** Convert the 'unsupported' parameter type
LOCAL loVal as Westwind.WebConnection.ComValue
loVal = loBridge.CreateComValue()
loVal.SetInt16(11)

*** Call method that takes Int16 parameter
loBridge.InvokeMethod(loNet,"PassInt16",loVal)
```

### ComValue caching for Method and Property Invocation 
`ComValue` also supports setting a ComValue from properties and method results. This is useful if you have a method or property that uses a type inaccessible via COM (like strongly typed or subclassed dataset objects for example). In this case you can call the SetValueXXX methods to fill the ComValue structure and then use this ComValue in InvokeMethod, SetProperty calls which automatically pick up this ComValue object's underlying .NET type.

```foxpro
*** Create an array of parameters (ComArray instance)
loParms = loBridge.CreateArray("System.Object")
loParms.AddItem("Username")
loParms.AddItem("Password")
loParms.AddItem("Error Message")

*** Create a ComValue structure to hold the result: a DataSet
LOCAL loValue as Westwind.WebConnection.ComValue
loValue = loBridge.CreateComValue()

*** Invoke the method and store the result on the ComValue structure
*** Result from this method is DataSet which can't be marshalled properly over COM
? loValue.SetValueFromInvokeMethod(loService,"Login",loParms)

*** This is your raw DataSet
*? loValue.Value   && direct access won't work  because it won't marshal

*** Now call a method that requires the DataSet parameter
loBridge.InvokeMethod(loService,"AcceptDataSet",loValue)
```

The jist of this is that the DataSet result is never passed through FoxPro code, but is stored in ComValue and then that ComValue is used as a parameter in the InvokeMethod call. All indirect execution methods (InvokeMethod,SetProperty etc.) understand ComValue and use the Value property for the parameter provided.

### Caveats with ComValue
The biggest caveat with  `ComValue` is that it's not obvious that some of wwDotnetBridge's methods automatically return `ComValue` instances or expect `ComValue` instances to be passed in. If you are calling a .NET Method that expects a `long` type value you likely end up passing an integer and wondering why that fails. It fails because it's an unsupported type, but that's not obvious, not easily discoverable and the error message that .NET throws unfortunately also is not conducive to resolving the problem.

Just realize if you call methods that use special types (see list above) and you get messages like `Invalid Method Signature` or `Method not Found` or `Property 'x' is not found on object Y` make sure your signature is correct and examine your .NET signature and make sure the value expected isn't one of the problem children.

So discoverability is not there, but beyond raising awareness with this blog post and the [topic in the documentation](https://webconnection.west-wind.com/docs/_3481232sd.htm) there's not much I can do unfortunately. I hope this post helps and adds another point of discoverability for this topic.

### Summary
`ComValue` is a powerful helper class that enables scenarios that otherwise would not be accessible to FoxPro. 

### Resources
* [ComValue Documentation](https://webconnection.west-wind.com/docs/_3481232sd.htm)

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
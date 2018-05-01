---
title: Persisting Static Objects in Web Connection Applications
abstract: One of the cool things about Web Connection is that Web Connection servers are persistant instances that can cache static data for subsequent requests. Besides the internal data caching FoxPro can do on an already running instance, you can also attach custom state to the server instance. In this post I'll show a number of approaches of how to access persistant object state on the server instance
categories: Web Connection, FoxPro
keywords: Web Connection, Persistance, Static Data,
weblogName: Web Connection Weblog
postId: 928
---
# Persisting Static Objects in Web Connection Applications

![Persisting Objects in Time in Web Connection](Peristence.jpg)

Web Connection Server applications are in essence FoxPro applications that are loaded once and stay in memory. This means they have **state** that sticks around for the lifetime of the application. Persistance in time...

### Global State: The wwServer object
In Web Connection the top level object that **always sticks around** and is in effect the global object, is the [wwServer](https://west-wind.com/webconnection/docs/_s7c0oeq2b.htm) instance. Any property/object that is attached to this instance, by extension then also becomes global and is effectively around for the lifetime of the application.

What this means is that you can attach properties or resources to your wwServer instance easily and create **cached instances** of objects and values that are accessible via the `Server` private variable anywhere in your Web Connection connection code.

This is useful for resource hungry components that take a while to spin up, or for cached resources like large look up tables or collections/arrays of values that you repeatedly need but maybe don't want to reload on each hit.

### Attaching Application State to wwServer
There are a number of ways to attach custom values to the global wwServer instance:

* Add a Property to your Server Instance
* Use `Server.oResource.Add(key,value)`
* Use `Server.oResource.AddProperty(propname,value)`


### Adding Properties to wwServer Explicitly 
You can explicitly add properties to your wwServer instance. Your custom wwServer instance is in `MyAppMain.prg` (Replace MyApp with whatever your appname is) and in it is a definition for a server instance:

```foxpro
DEFINE CLASS MyAppServer as wwServer OLEPUBLIC

oCustomProperty = null

PROTECTED FUNCTION OnInit

this.oCustomProperty = CREATEOBJECT("MyCachedObjectClass")
...
ENDFUNC

ENDDEFINE
```

The `oCustomProperty` value or object is loaded once on startup and then persists for the duration of the Web Connection server application.

You can then access this property from anywhere in a Process class as:

```foxpro
loCustom = Server.oCustomProperty
```

And voila you have a new property that exists on the server instance and is always persisted.

### COM Interfaces vs new Server Properties
One problem with this approach is that the new property causes a COM Interface change to the COM server that is gets registered when Web Connection runs as a COM server. Whenever the COM interface signature changes, the COM object needs to be explicitly re-registered or else the server might not instantiate under COM.

So, as a general rule it's not a good idea to frequently add new properties to your server instance.

One way to mitigate this is to create **one** property that acts as a container for any persisted objects and then use that object to hang off any other objects:

```foxpro
DEFINE CLASS ObjectContainer as Custom
   oCustomObject1 = null
   oCustomObject2 = null
   oCustomObject3 = null
ENDDEFINE
```

Then define this on your wwServer class:

```foxpro
DEFINE CLASS MyAppServer as wwServer OLEPUBLIC

oObjectContainer = null

PROTECTED FUNCTION OnInit

this.oObjectContainer = CREATEOBJECT("ObjectContainer")
...
ENDFUNC

ENDDEFINE
```

You can then hang any number of sub properties off this object and still access them with:

```foxpro
loCustom1 = Server.oObjectContainer.oCustomObject1
loCustom.DoSomething()
```

The advantage of this approach is that you get to create an explicit object contract by way of a class you implement that clearly describes the structure of the objects you are 'caching' in this way. 

For COM this introduces a single property that is exposed in the external COM Interface registered - adding additional objects to the container has no impact on the COM Interface exposed to Windows and so no COM re-registration is required.

### Using oResources
The Web Connection Server class includes an [oResources](https://west-wind.com/webconnection/docs/_3fu0me96s.htm) object property that provides a generic version of what I described in the previous section. Rather than a custom object you create, a pre-created object exists on the server object and you can hang off your persistable objects off that instance.

You can use:

* `AddProperty(propname,value)` to create a dynamic runtime property
* `Add(key,value)` to use a keyed collection value


`.AddProperty()` like the name suggests dynamically adds a property to the `.oResources` instance:

```foxpro
PROTECTED FUNCTION OnInit

this.oResources.AddProperty("oCustom1", CREATEOBJECT("CustomClass1"))
this.oResources.AddProperty("oCustom2", CREATEOBJECT("CustomClass2"))
...
ENDFUNC
```

You can then use these custom properties like this:

```foxpro
loCustom1 = Server.oResources.oCustom1
```

The behavior is the same as the explicit object described earlier, except that there is no explicit object that describes the custom property interface. Rather the properties are dynamically added at runtime.

Using `.Add()` works similar, but doesn't add properties - instead it simply uses collection values.

```foxpro
PROTECTED FUNCTION OnInit

this.oResources.Add("oCustom1", CREATEOBJECT("CustomClass1"))
this.oResources.Add("oCustom2", CREATEOBJECT("CustomClass2"))
...
ENDFUNC
```

This creates collection entries that you retrieve with:

```foxpro
loCustom1 = Server.oResources.Item("oCustom1")
loCustom2 = Server.oResources.Item("oCustom2")
```

This latter approach works best with truly dynamic resources that you want to add and remove conditionally. Internally `wwServer::oResources` method uses a [wwNameValueCollection](https://west-wind.com/webconnection/docs/_1o11fbxpb.htm) so you can add and remove and update resources stored in the collection quite easily.

### Persistance of Time
One of the advantages of Web Connection over typical ASP.NET multi-threaded COM servers applications in ASP.NET where COM servers are reloaded on every hit, is that Web Connection does have state and the application stays alive between hits. This state allows the FoxPro instance to cache data internally - so data buffers and memory as well as property state can be cached. 

You can also leave cursors open and re-use them in subsequent requests. And as I've shown in this post, you can also maintain object state by caching it on the wwServer instance. This sort of 'caching' is simply not possible if you have COM servers getting constantly created and re-created. 

All this adds to a lot of flexibility on how manage state in Web Connection applications. But you also need to be aware of your memory usage. You don't want to go overboard with cached data - FoxPro itself is very good at maintaining internal data buffers, especially if you give it lots of memory to run in. 

Be selective in your 'caching' of data and state and resort to caching/persisting read-only or read-rarely data only. No need to put memory strain on the application by saving too much cached data. IOW, be smart in what you cache.

Regardless, between Web Connection's explicit caching and FoxPro's smart buffering and memory usage (as long as you properly constrain it) you have a lot of options on how to optimize your data intensive operations and data access.

Now get too. Time's a wastin'...

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
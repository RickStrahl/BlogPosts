---
title: Basic Cookie Authentication in ASP.NET Core
weblogName: West Wind Web Log
---
# Basic Cookie Authentication in ASP.NET Core

A couple of years ago I wrote a long article on how to work with the minimal set of APIs required to use ASP.NET Identity without all the default scaffolding that Microsoft provides, where you can handle the entire process all on your own. The result was anything but 'simple' and still required a shitload of boilerplate code, but it was manageable. Still that's a lot of code if you just want some simple authentication in your application.

Before you jump into using the full blown identity implementation that ASP.NET Core (and classic ASP.NET) provide, especially if you need to customize, is that you can use the low level authentication components and still create simple authentication implementation that is as easy as it was back in WebForms with the simple FormsAuthenticationManager.

### Basic Cookie Authentication
If you need to build an application where your application wants to manage the users and groups etc. as part of the application, using Identity can often be extra overhead you can do without. There are good reasons to use ASP.NET Core's (ASP.NET's) identity system, especially if you need to integrate with oAuth/OpenId providers for single signon and external providers.

But if you just build a small application that needs to manage a handful of user accounts it's much, much easier to just build your own authentication handling directly into the application and still take advantage of the ASP.NET infrastructure to provide secure encryption and safe cookie management that ensures your authentication data is safely transported on the wire.

In this post I'll use a simple API Controller for an Angular front-end application as an example, but you can apply the same exact logic to an MVC style application.

### Setting up for Cookie Authentication




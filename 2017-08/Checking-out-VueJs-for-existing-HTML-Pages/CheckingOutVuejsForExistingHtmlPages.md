---
title: Checking out VueJs for existing HTML Pages
weblogName: Markdown Monster (Medium)
---
# Checking out VueJs for existing HTML Pages
When building full on client side applications, I've been relying heavily on [Angular](https://angular.io) as my tool of choice. Say what you will about Angular on how fat and overly structured it is, for large applications it is a great tool that incorporates most of the features you are going to need and excellent performance that is constantly improving. For me, the workflow of creating components, plus templates **and** a huge set of support libraries that are integrated into a consistent whole is a great fit for building self-contained client side applications. The size and required setup in the context of a full application is worth the ease of use you get once everything is up and running. 

For me, it fits the way I like to work in most ways.

### When Angular is NOT a good Fit
But Angular is not really a good fit for anything but a full application. If you need to just drop in some rich application functionality into an existing HTML page, then Angular becomes a non-starter. The setup and configuration required just to get an app bootstrapped is immense, and while tooling handles most of it these days, making that tooling work in any scenario outside of the designed structure is daunting to say the least.

It's kind of sad to see that we've come to this place where simplicity in full featured frameworks is really a thing of the past.

If you have older applications that were written with server rendered code, or even today as you build more document centric applications that are better handled with server generated HTML; if you want to extend those applications with rich JavaScript you'll find that it's a royal pain in the ass to try and integrate frameworks like Angular, Ember, React into these types of applications.

Why? Because these libraries/frameworks tend to be very large and have all sorts of build system requirements just to bootstrap and run. Getting this to work in existing HTML content or server generated is perhaps possible but pretty clearly not a primary use case and definitely not something a casual developer can attempt. And ironically that's exactly the use case I'm talking about here.

I have lots of older applications that would greatly benefit from a few client side drop in components that can handle perhaps editing some data interactively or otherwise interacting with existing page content. In the past these components were written with jQuery code and manually moving data around the DOM - it sure would be nice to use model based binding to decoratively update data and not have to screw around with individual DOM value updates. 

### Enter VueJs
This is where VueJs comes in.

VueJs is a new-ish framework that is very small and lean and provides a small but focused feature set that is easy to drop into any HTML page with a single script file. Yeah, the big framework providers tell you that extensive build pipelines are the way to go in modern JavaScript and while that's true for building big applications, it's not ideal if you just need to add some functionality to a page.

In the same way that jQuery changed the way we thought about JavaScript in the mid 2000's, VueJs fits a very similar use case in addressing those same scenarios that we used to handle with jQuery but using a declarative approach to pushing data into the HTML.

Like other SPA frameworks one of the core tenants of VueJs is - as the name suggests - is View Model binding which allows you to use data assigned to a model and bind that declaratively into HTML templates. Vue using the same familiar handlebars syntax for interpolated expression bindings (`{{ expression }}`) as well as explicit binding directives on HTML elements and attributes. The idea is to do databinding against a model, that is bound to HTML elements so that you rarely if ever have to resort to manipulating DOM values directly.

It combines some of the most commonly used features of Angular and some of the reactive principles of React and combines them in a very lean library that can easily be dropped into a page and provide a good chunk of SPA features from a single JavaScript include file. You can use plain old school ES5 code via a single script reference or you can  set up with a build system and use ES6 or (with a bit of effort it seems) Typescript. 

Although my use case is primarily as a drop in component framework, VueJs is also widely used for larger applications and also comes with a full build system set up and CLI to make it easy to create full scale applications, but this is not the focus of this post.

VueJs provides a lot of the most common things I use in a framework like Angular:

* Handlebars (`{{ expr }}`) style Template Interpolation
* Data and Model Binding (two-way, one-way, once)
* Looping constructs
* Conditional constructs
* Event binding
* Attribute binding
* Conditional Class bindings 
* Composition with Components

In short it provides the core features of a SPA framework that allows you for working with models to bind data, and handle events through methods on your model views.

Did I mention that it's small? A gzipped, compressed version of Vue.js is only about 28kb. 
It doesn't however provide some adjunct features that you might expect from a full featured framework:

* No built-in Http client (alt: [jquery](https://jquery.com),[fetch](https://github.com/github/fetch))
* No Routing (alt: [Vue-Router](https://router.vuejs.org/en/essentials/getting-started.html))
* No Validation (alt: [Vee-Validate](http://vee-validate.logaretm.com/))
* No Dependency Injection

This is not a knock on Vue - given the size of the library that's to be expected and there are quite a few add-ons available that fit those needs.


However, for me the sweet spot that VueJs provides is that it's a **drop-in** library that I can use with existing pages. I have many older applications that are full functional and adding some additional interactive features that sit ontop of these pages are relatively easy to implement with VueJs. 

I can get a good chunk of features that I'm used to with Angular but without the hassle and heft of trying to shoehorn Angular into a setup it's not really designed for.



---
title: Re-assembling the Web with Web Assembly and Blazor
weblogName: West Wind Web Log
postDate: 2018-07-18T14:27:16.1036517-07:00
---
# Re-assembling the Web with Web Assembly and Blazor

The Web has been powered by a single language on the client since the very beginnings of the Web as a platform. JavaScript started as an overly simplistic scripting language in the first Mozilla browsers and very slowly evolved over the years to become what is now the most widely used programming language anywhere. 

In recent years with the advent of ES2015 and later, and many infrastructure tools like Babel and WebPack using JavaScript has become a considerable more capable language and evolved into a complete platform able to handle even very large code bases. Unfortunately the complexity for the infrastructure too has increased with ever more crazy and byzantine build systems to build even simple applications. With JavaScript it seems the simpler the programming model gets, the more complex the build system and tooling becomes.

### Re-Assembly
There are a lot of developers that would much rather use something else - anything else - than JavaScript to build Web applications. I myself have made peace with JavaScript years ago, but while I use it daily and feel reasonably proficient with it, I would definitely welcome other options to build Web applications with.

I feel that to be a platform on par with desktop or mobile OS's the browser shouldn't be tightly coupled to the JavaScript mono-culture. There should be a way that the runtime and programming environment can be defined at a lower level, just like other platforms so that many different languages and frameworks can be used. Wouldn't it be nice if there was a browser based assembly language that  abstracts browser specific hardware and still is as close to the raw hardware as possible?

A new-ish technology called **Web Assembly** and `asm.js` before it speak to just that scenario and it has opened up the possibility to compile code that isn't necessarily JavaScript into low level  byte code Web Browsers can directly execute.

Web Assembly essentially outputs modules (WASM) that can be loaded from JavaScript in the browser using a set of WebAssembly APIs. One of the original use cases for Web Assembly was to have high performance C++ built modules that can be called from JavaScript and execute many times faster than the same code in JavaScript. Performance is a good reason for Web Assembly, but the thing that gets people really excited is the use of other languages than JavaScript for writing Web Browser client code. Microsoft's **Blazor** using .NET is just one example of non-JavaScript code in the browser, but there are many other compilers that compile C, C++, Rust, Python, Ruby and many others to Web Assembly.

### Blazor
The ASP.NET team recently created a new prototype tool called **Blazor** which uses Web Assembly **to run C# code and uses Razor Templates in the browser** executing completely on the client side.

As exciting as that sounds, **Blazor** is a prototype project in the very early alpha stages. Both Web Assembly and Blazor in particular are bleeding edge technology and while you can use even this early prototype for building some types of client side applications using .NET code, there are many missing pieces and a lot of awkward behaviors. This will change as both Web Assembly and Blazor evolve, but for now Blazor is more of a proof of concept project than production ready solution. Nevertheless, the ASP.NET team is investing a lot of resources into Blazor, and given the team's and the community's enthusiasm chances are very good that this technology will become an officially supported product in the future.

Even if it's not ready for production yet, Blazor and Web Assembly in general deserve a closer look for a glimpse of what the future might bring in the way of a Web development world that isn't completely dominated by JavaScript.

### Web Assembly
The key to executing non-JavaScript code in the browser is Web Assembly. Web Assembly is a relatively new browser technology, but it's supported by the latest versions of all major browsers with the only major exception of Internet Explorer:

![](WebAssemblyBrowserSupport.png)

**Figure 1** - Web Assembly Support in Web Browsers (source: [Mozilla MDN](https://developer.mozilla.org/en-US/docs/WebAssemblyhttps://developer.mozilla.org/en-US/docs/WebAssembly))

In simple terms Web Assembly provides a byte code level execution engine that other languages and compilers can target to generate byte code for. Web Assembly is similar to .NET IL that provides a low-level byte code directives which can then be compiled into native WASM modules that are then executed by the browsers as modules. Again this is similar to the way dotnet assemblies actually contain IL byte code that is compiled into native code at runtime and a very similar process occurs with Web Assembly. Web Assembly loads a WASM module (which is binary bytecode) and compiles it at load time into a native module that can execute in the target browser using the specific browser runtime's execution engine.

With the advent of WebAssembly the browser runtimes can now load and run two types of code — JavaScript and WebAssembly as side by side technologies.

The final output of Web Assembly is a binary WASM module of byte code that can be loaded into the browser dynamically using various loader commands in JavaScript.

### Blazing the Way with Blazor
Blazor is a framework that sits on top of Web Assembly. It uses a single WASM module which is a WASM targeted version of the Mono runtime. Mono is a flavor of the .NET runtime that underlies the various Xamarin platforms as well as many flavors of Linux, Mac and small devices. Mono is available for tons of platforms and WASM is yet another custom target that it can be compiled into.

So using Blazor, rather than compiling all code you write to WASM modules, only the Mono .NET runtime is compiled into a WASM module. Essentially, a single module provides .NET Runtime support, which then in turn can load .NET assemblies and execute .NET code. 

What this means is that once the Mono WASM module is loaded you can execute code in plain old .NET Standard 2.0 compatible assemblies directly inside of a browser. There's obviously a bit of setup required to bootstrap the runtime, and Blazor provides that bootstrapping mechanism in addition to the HTML framework using Razor Pages. 

Blazor works by:

* Using a compiled Mono (Interpreted) .NET Runtime as a WASM module
* Using Mono to load standard .NET Assemblies
* Executing .NET code through the Mono Runtime
* Updating the Browser DOM via JavaScript interop
* Capturing JavaScript events and re-rendering based on DOM events

User code then executes based on these concepts:

* The Blazor framework is implemented in C# code
* All .NET Code is executed by the Mono Runtime
* User .NET Code is executed via Mono
* Razor Templates convert to .NET classes that execute via Mono

If you look at the output of a 'compiled' Blazor application as shown in **Figure 2** you'll see the `mono.wasm` module along with the `mono.js` loader. Neither of these files is  small

![](BlazorProjectOutput.png)

<small>**Figure 2** - Output from a Blazor project actually runs .NET Standard 2.0 assemblies</small>

You can also see a `bin` folder with a bunch of core .NET Runtime assemblies are loaded alongside your user code (`BlazorDemo.dll` in Figure 2). 

![](NetworkSizesAndRequests.png)


<small>**Figure 3** - Network sizes for the Blazor runtime is not small but also not excessive</small>

Neither of these files are small so running a Blazor app will have at least a 1.9mb payload at the moment plus any of the runtime and user code assemblies that your Razor code.



Your code can import other .NET Standard 2.0 assemblies and those too can execute as part of your client side application.

Currently the Mono runtime is used in interpreted mode to execute .NET code. This runtime is smaller and easier to implement and more flexible to deal with dynamic code which is the reason that it's used for these early prototype versions. In the future it's quite likely that a statically compiled version of a .NET Runtime runtime will take its place if this project catches on for the long term.

### More Web Assembly
While this is quite possible and there are already tons of languages that can compile down to Web assembly, 



# EXPLANATION SECTION

### What's generated
If you want a look behind the scenes of how Blazor works at the .NET level you can peek into the client bin folder and check out your user assemblies. As mentioned earlier

![](RazorRenderTreeCSharp.png)

<small>**Figure XX** - Razor Components render HTML and code into C#</small>

### Web Assembly is not all about the DOM
It's important to understand that **Blazor is just one way to implement a framework on top of Web Assembly**. Blazor explicitly interacts with the HTML DOM to defer all of its rendering and event handling. However, this is not a requirement.

Because Web Assembly allows executing raw machine code inside of the Browser sandbox, it's possible to create entirely new applications that might not even use the HTML DOM at all. Final display output can be mapped directly to HTML Canvas or WebGL for example which is the most likely path that high performance and graphics intensive applications like games will take to produce high video frame-rate Web content. No DOM required.

This same approach also allows for completely separate layout engines that are not based on HTML. One could imagine for example a XAML based output engine that directly renders to screen which would be more akin to something like Silverlight. I can't imagine that Microsoft isn't thinking about something along these lines for making UWP or Xamarin Forms apps work in a platform independent way inside of the Browser.

In the future it's quite easy to imagine that this sort of low level interface might bring a new renaissance of new UI frameworks that aren't based around HTML based UI - for better or for worse. After all we've been stuck in the HTML centric mindset for well over 10 years now, and the slow progress on the HTML/CSS UI  front may drive innovation into different places given the opportunity of a new platform that gives many more options for generating output to the screen.

Another interesting alternative for .NET developers is [Ooui](https://github.com/praeclarum/Ooui). Ouii provides a WebSocket based communication framework that lets you programmatically define a UI and controls rendered and passing events back over a WebSocket connection. Ouii has UI models both for DOM based layout as well as a Xamarin forms based layout that renders into HTML.

### Where are we?
It's easy to get excited around this technology. Blazor's development model certainly feels very comfortable with a relatively small learning curve that allows you to jump right in. Even better it sidesteps all the JavaScript build framework craziness that goes along with HTML based frameworks like Angular, React, Vue and so on.

As for Blazor, using compiled .NET code that can take advantage of compile time validation of code, using rich tooling for project wide refactoring, and having nice integrated tooling and the ability to use standard .NET components opens up a world of possibilities that simply weren't an option before.

On the flip side this is a framework from Microsoft. Microsoft has been known to try stuff and then abandon things. A framework like Blazor is also very likely to fight an adoption battle because it is a Microsoft product even if it is 100% open source. In my view, Microsoft has a commitment problem when it comes to client frameworks and Blazor very much needs a strong driving force to succeed both in terms of features and achieving 'hearts and minds'.

It's also important to understand that for the most part this is **experimental software**. Vendors are still trying to figure out how to best integrate solutions like this into existing browser based UI. Web Assembly is still growing up and there are big holes in terms of JavaScript and DOM interactivity that Blazor relies on. Web Assembly is currently lacking the ability to directly access the DOM, so all rendering and event handling has to indirectly go through JavaScript. This means performance overhead, and maybe even more critically ugly and somewhat limited code in order for Web Assembly and JavaScript to talk to each other. Much of the interop is hidden internally in the Blazor framework, but at the edges if your code needs to interop - and it will - it's pretty ugly.

These issues are well known and they are already on the list of things to be addressed in Web Assembly, but we are not there yet. 


What all this means is that anything Web Assembly based in the near future is going to be a rapidly changing target. **Microsoft specifically says not to use Blazor for production projects**, but I'm sure some people will just ignore that and do it anyway. Just realize that features and APIs are bound to change drastically before it becomes a stable production ready tool if at all. There has been no definite confirmation on whether Blazor is headed to become a real supported product, although it seems likely given all the interest that has been expressed around the overall concept and the speed with which this initial framework and tooling has come together. But it's all still open to interpretation by Microsoft.

### Experiment!
So, if all of this sounds exciting to you, consider using current versions of Blazor to learn about Web Assembly and get a feel for what it's like to use .NET code to write your front end code. It has a very different feel from JavaScript based development which feels both familiar and unfamiliar at the same time. While you may not be able to build production ready code with this stuff yet, it helps to check out the technology and get a feel for what non-JavaScript based development might look like. Give it a try...



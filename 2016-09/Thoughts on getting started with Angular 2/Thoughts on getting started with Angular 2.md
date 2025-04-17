# Thoughts on getting started with Angular 2

I finally broke down last week and sat down to get started with Angular 2. I'm kind of glad I only did short stints with A2 previously, as a lot has changed in recent. The current state is RC5 which according to what I have heard from various people is getting fairly close to the final release. It looks like there will be an RC6 which might end up being the RTM release.

### Getting Started is... the hardest Part
Let me get it out of the way - getting started with Angular 2 is pretty rough still. While you can easily use the excellent [quick start sample from the Angular site](https://angular.io/docs/ts/latest/quickstart.html) to play around with Angular 2, the setup you start with is not really production ready. As soon as you go beyond the basics and want to set up your project a little differently you have to know quite a bit about how the build process and A2's module loading and bootstrapping system work.

Yes dealing with the build systems and the bootstrap process is a pain, but if you can use a good seed project and *ignore those parts when you get started* you can start exploring the fruits of Angular 2 which is really quite an improvement over Angular 1. 

I'll have more about that later, but let's get the whiny bit out of the way first...

### Build Systems, Loaders, BootStrapping == Pain
Angular 2 - like most other major V2 frameworks - is based on ES6 or Typescript and has a boat load of dependencies. There are loaders and bootstrappers and module loaders and several major support libraries like RxJs and Zones. All that adds up to quite a big payload. Because Angular 2 wants to use Typescript (or ES6) you will need a build system to compile all this stuff into something that can actually run. 

For most people coming into Angular 2 for the first time there's a wall you run into with a bunch of nomenclature that's unfamiliar. I've been following the **Build System Shuffle** and it's hard not to snicker at the silliness of the constantly changing *Tool of the Day Syndrome*. 

> JavaScript is the only language/platform that doesn't have a built in way to build and compile an application. Instead developers are tasked with figuring this out **before** they ever write a single line of code. Further, in order to use the various build systems and packagers you have to know the innards on how they work. This is utter bullshit, but such is the reality of doing development with ES6+ or Typescript. There are benefits to the build systems, but I sure hope this will get easier or at least more standardized **at some point** because right now it all feels like black magic held together by a rubber band.

The best way to deal with this mess is: **Ignore it when you first start out** and come back to it later. The loader and bootstrapping process is arguably the most complex part of Angular 2, so it's not a good idea to start there. Find yourself a Seed project (more on that below) you can reason about and start at the application level, and come back to the build system and bootstrapping later once you've gotten your feet wet with how Angular works. 

That would have been good advice when I started - I wasted entirely too much time trying to understand how it all fits together, and I feel I'm none the wise - things didn't click for me until I was into building part of my application, then looking back at those pieces later.

The actual pieces of Angular 2 you'll work with when building application logic are much easier to understand and work with, and once you understand those it's actually easier to make the correlations to understand how the bootstrapping, module loading and dependency injection engines work that are key for the configuration. Once you've built a few components, looking at the module loader and bootstrapper and route configurations actually looks a lot less scary.

### Check out the Tutorials: They are surprisingly good!
If you're new to Angular or new to Angular 2 after using Angular 1 I'd recommend checking out the tutorials on the Angular site. The Angular Docs surprisingly are really quite good (although a bit verbose at times). The tutorials include good narrative, and have all code samples available right there. 

1. **[The Angular 2 QuickStart](https://angular.io/docs/js/latest/quickstart.html)**  
This is an excellent tutorial and functional as a simple single page starter. While I recommend it if you're new to Angular to start with this guide, I wouldn't recommend using it as a starter template for your project as it doesn't provide anything beyond just getting your project to run. It currently (RC5) doesn't use WebPack yet, but is otherwise always kept up to date with the latest Angular release. Go through this and do it, don't just read it - it only takes a few minutes.

2. **[Tour of Heroes Sample](https://angular.io/docs/ts/latest/tutorial/)**   
I also recommend taking a look at the Tour of Heroes sample which is a more involved example of multi-page applicaiton. It touches on many common application scenarios, and is a great starting point for learning about Angular. This sample  has frequently been my goto location where I go to figure out how a specific feature work. The full samples at the end of each lesson are very useful to copy dependencies from and see all of the pieces fit together.

### Use a Seed Project
As I mentioned when you start out it's best to ignore the complexities of setting up a new project from scratch. It's best to use some pre-built template to get started with. There are a number of seed projects out there, and you can choose on what works for you.

I picked **[Angular2 Seed from the Angular.io site](https://github.com/angular/angular2-seed)**  which as of RC5 seems to have all the features I wanted in a starter template.

* RC5 support
* ngModule implementation
* WebPack build
* Multi-Page base setup
* Routing Config


There are other seed projects out there, but make sure that you pick one that includes **ngModule** and **WebPack** support to minimize upgrade pain for future releases.

### It gets much better from here
If getting started is a pain and looks scary, getting past that point and starting to create components and actually build your application is much easier. 

I've only just started in with Angular 2 and spending a bit of time building maybe a couple dozen components and services and exploring the features of Angular 2. My overall feeling is that the actual development process is much improved over Angular 1 in many ways. 

Here are some of the things to like:

### Typescript/ES6
ES6 and JavaScript introduce a much cleaner version of JavaScript that properly supports classes, module loading and more sane management of the `this` pointer inside of components and classes. Many people are skeptical of using classes, but it seems with ES5 we were often trying to emulate OO concepts with hacks, that are finally more 

### Classes




Some of this attributable to using Typescript rather than ES5... using classes to break out functionality and introducing typed 


Coming from Angular 1 there's much that is very familar. Certainly most of the core concepts of databinding, routing, form validation and to some degree using the HTTP features are all very familiar. 

But many things have changed, like most obviously much of the binding syntax.





> I know some of you won't be able to hold your tounges and point out I should look at Aurelia, Ember or something else. Yes I know - I've played with Aurelia and like it a lot, but I have direct requirements for using Angular rather than the other solutions. So please, don't comment on other solutions unless there's a productive point to it - I won't approve any 'just do x' comments.


<!-- Post Configuration -->
<!--
```xml
<blogpost>
<abstract>

</abstract>
<categories>

</categories>
<keywords>

</keywords>
<weblogs>
<postid></postid>
<weblog>
Rick Strahl's Weblog
</weblog>
</weblogs>
</blogpost>
```
-->
<!-- End Post Configuration -->

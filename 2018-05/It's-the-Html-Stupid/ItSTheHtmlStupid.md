---
title: It's the Html Stupid
weblogName: West Wind Web Log
postDate: 2018-05-01T18:00:33.6880178-07:00
---
# It's the Html Stupid
I continue to be amazed how the state of HTML and the Web has not really improved drastically in the last 8 years. Some areas like JavaScript and frameworks have seen dramatic improvements. 

But the UI portion and the hardware integration, mobile support and general browser interoperability has pretty much come to a standstill since 2010 and the original push of HTML5. HTML5, CSS and the Browser DOM still feel like the dark ages with no hope of emerging out of the dark any time soon. 

### The Constant Focus on JavaScript is misplaced
Today, we constantly hear about new JavaScript (or lately Web Assembly) frameworks coming. out Yet another way to do client side coding in the browser pops up every few months as if we didn't already have a myriad of choices. New frameworks don't usually offer anything drastically new, except a slightly different twist on the same thing. 

The new breed of WebAssembly frameworks is probably the most drastically different part of this but as cool as that might be in the future - even this new paradigm is going to run into the same roadblocks with HTML and the DOM - it doesn't change a thing about how the core platform behaves.

## Client Side Code is a solved Problem
I'm going to argue that how to run code effectively in the browser has been mostly solved. Today we have rich JavaScript frameworks that allow you to manage very complex code in manageable chunks of abstraction. Frameworks like Angular, React, VueJs, Aurelia, Ember etc. have brought object models that encapsulate the application level development process into relatively well defined modules that allows for building very complex applications without getting overwhelmed by the size of the overall application. No doubt things can be improved - especially when it comes to the build process and tooling - but overall the process is manageable today.

Most of the frameworks use the same overall principles of components, modules, databinding, event handling in similar ways. There are definitely differences in ideology which is fine.

We have tons of choices - too many perhaps - that make it relatively easy to build applications. Frameworks like Angular, React, VueJs, Aurelia, Ember to name but a few of the most popular ones all have comprehensive framework models that allow you to create applications out of smaller, manageable components. So instead of building a big monolith it's now relatively straight forward to piece together an application out of logically separated components while still running as a single SPA application.

It's not easy but it's manageable and it follows what I consider a fairly predictable path. Pick a framework and stick to the master plan laid out by the framework and you can expect fairly consistent results. After the initial learning curve one can be very productive with these frameworks. I consider that a **big success** especially when you compare where we were at in the 2010 time frame.

And yet all the hype around the Web seems to focus seems to be on these frameworks on more new frameworks solving an already solved problem over and over again, which to me seems like an effort in diminishing returns. 

## HTML and DOM: The ugly StepChild
In my mind the big problem in Web Development isn't the code - it's the HTML, CSS and DOM bits that seem to be stuck in the mud with antiquated technology that's not addressing the needs of modern application development. Compared to the rapid advances we've seen in the JavaScript world HTML, CSS and the DOM are stuck in the mud.

Today we have all this talk of Progressive Web Apps taking over native mobile and even desktop (in the Windows Store) applications, but whenever I hear HTML replacing desktop or even mobile apps I just feel like laughing out loud given the **ridiculously limited functionality provided by HTML and the DOM**.

Many years ago when HTML5 arrived it was supposed to be the panacea that was to deliver us the rich platform that would finally banish other platforms. **HTML über alles** they said. A new era of rapid improvements, new APIs etc was upon us. Soon we would be able to build mobile apps, talking to native APIs and find unicorns and rainbows that lead us to that pot of Gold...

Cue the record scratching off the turn-table...

![Scratch That](https://media.giphy.com/media/kDWOrEBckWgln827na/giphy.gif)

While HTML5 did bring a number of much needed improvements to the pitiful HTML4/XHTML standard, it didn't do nearly enough. Advocates were predicting *just give it another 2 years* until it's widely adopted.

Well, those 4 years, ratification and adoption came and went - and nothing changed.

> For HTML advocates it's always the same: Just wait another 2 years and everything will be awesome!

Now we're almost 10 years later and very little has changed. Look at the original HTML5 specfication from ~8 years ago and honestly think about what's changed since then. What can you think of?

* Flexbox
* CSS Grid
* Navigation and History Improvements

Those are nice, but hardly ground breaking. Nav in particular was very necessary because without it SPA applications wouldn't be able to work. So that happened fast. FlexBox was cool when it came out, but alas it's going to be made obsolete by CSS Grid. Yeah, that was greeeeaaat planning too! 

There are lot of other small enhancements in CSS but most of those are also still a ways away, because... browser support even in evergreen browsers is not there yet. Microsoft lags behind as usual waiting for official ratification which is going at a snail's pace. Chicken and egg.

> Just wait another 2 years and everything will be awesome!

I wrote a piece on [the state of mobile Web development in 2014](https://weblog.west-wind.com/posts/2014/Aug/18/The-broken-Promise-of-the-Mobile-Web) - I just re-read that blog post and looking at it I realize that none of the things I complained about have been fixed. In 4 years! It's also funny reading the comments on that posts as I took a significant amount of slack from the HTML apologists.

### Doing Awesome Things? Yes, but at what Cost?
Now I realize all of this is not keeping people from doing awesome stuff on the Web, despite the limitations, but the reality is that to really build professional looking applications is very hard for the **average developer** because there's no consistent path for building Web UIs.

Not only that there is a tremendous amount of waste as people are reinventing the wheel over and over and over again. Reusability for UI on the Web is deplorable.

To be clear, I've always been a big advocate of Web technology. Most of the paid work I do revolves around Web technology. What I write about in my blog almost exclusively deals with Web tech. If I have a choice I much rather build applications for the Web than a native desktop or mobile app. But I am getting tired waiting hearing the *just give it another 2 years and then things will be awesome* mantra. Because it never actually arrives.

I want to be a big fan. And I'm doing it because - c'est la vie. But I'm gnashing my teeth while doing it.

## Failure of Imagination: HTML
If you're a Web developer raise your hand if you have ever struggled with putting together a UI feature that seems relatively simple. Maybe you needed a custom formatted list box, or dynamic tree or something as simple as a 'combo box'. If you're anything like me, you probably use some sort of framework that provides you a base set of features and 'controls' (air quotes that!), but when that base set doesn't have what you need, which happens regularilym you have to roll up your sleeves and start building a custom control from very, very, very low level DOM infrastructure.

Because there's essentially no component platform in the DOM only a bunch of HTML controls that have been there since the mid-nineties since the first Web browser was created, 'controls' are built through simulation of other controls. To build a servicable combobox you draw boxes around an input control to simulate an input box. To display a drop down list you manually draw box and position the mouse at the mouse cursor and hope the algorithm is correct. And it handles the browser edge (ha ha) cases.

## Component History on the Desktop
I know I'm dating myself, but I come from a background of Windows desktop development - I got my start in FoxPro, worked some in VB6 and MFC/C++ and then worked in .NET WinForms and WPF which I still use on occasion to this day for things that simply work better on the desktop - mostly tools or applications that need to interface with hardware. When I think back on those days one thing that stands out to me is how easy and fast it was to develop functional applications. 

In these desktop environments you had an incredible amount of native controls that **were built in to the base framework** along with extensive tooling that allowed a rich design time experience. Controls like date pickers, comboboxes, grids, tree viewers, auto-selectors, even more custom things like masked input filters, validators and scroll viewers and so on were **just there** because they are part and parcel of the platform.

But even more importantly beyond that these UI frameworks came with something that HTML can only dream about: An actual **well-defined and extensible object model** that allowed you to easily extend or create new controls of your own relatively easily. Not only could you create your own because it was relatively easy to use base components and enhance them, but it was also relatively easy for many third parties to build third-party controls that were for sale (or in some cases free - remember this is long before OSS and free became the norm). Tons of third party controls were also available both for pay and for free.

## Compare that to HTML
Now compare that to the dearth of controls in HTML. To this day HTML has 7 input controls. 7!!! And they all pretty very limited in terms of what features or customizability they provide. Most are not easily customizable via CSS even (checkbox, radio, select) and have a very limited set of properties and events. There is not a single rich component built into HTML. Not one. Not a date picker, not a combobox, and not any sort of list control except the utterly unconfigurable and nearly unstylable `<select>` and `<datalist>` (which is not well supported) controls.

Here are the dirty seven:

1. input
1. textarea
1. checkbox
1. radiobutton
1. button
1. select
1. datalist

Now to be fair `<input>` has a number of separate types `date`, `range`, `number` that provide a few input alternatives, but few serious sites actually use these extensions, because they are rendered inconsistently or not all in various browsers. And even if they do render they usually don't fit into the UI of the hosting framework. In short, most of the custom input types are really quite worthless from a UI control feature perspective.

## Custom Drawn Controls
As a result of this minimal feature set, HTML relies on custom controls that aren't really controls at all but a bunch of HTML elements laid in composition around the limited controls above meant to **mimic** real controls that live in a native operating system. 

I can hear the HTML apologists just now:

> But, but... HTML - I can draw whatever I want with HTML, right? Right?

Sure given an unlimited amount of time I'm sure you can hand code any custom control you like, but the fact is most of us don't have that time. And we especially don't have it when we are switching to the UI and JavaScript framework du jour on the first full moon of every new year.

How many times have you hunted around for a DatePicker control that works with jQuery UI, then jQUery Mobile, then Bootstrap, and then with your custom framework? The horror of it all is that even if you find something that works it usually only works **in the context of the framework it was designed for**. Throw it into a different UI context and the whole shebang no longer looks right, or worse no longer works.

So maybe you're one of those 'no frameworks' guys that does build everything by hand. If you are - that's awesome and I **really admire** that if you're sticking with it. I say that because I have done that in the past but at some point realized that maintaining my own Web Framework is just to damn difficult for a single developer or even a small team. And in the end it's a tough sell to clients.

Building UI components that display content is perhaps a reasonable endeavor that is fairly doable. But building user friendly controls that have common behavior, support accessibility standards, support OS shortcuts and behaviors are hard to build. There are tons of little details you probably didn't even think about when decided to build that custom list control. Handling keyboard and mouse input. Handle input searching. Handle multi-select. Handle... the list goes on. 

> Building usable controls is hard and it's not something that application developers should have to do. 

Yet with HTML application developers are often forced to do just that because there are no decent built-in alternatives, or often there are no ready made components available for your platform du jour.

To come back to the desktop metaphor here, what's missing in HTML is the underlying support platform - that common object model that provides the core semantics upon which you can then reasonably build new components.

HTML is infinitely flexible with layout when it comes to visual layout but it absolutely sucks when it comes to behavior because there are no behavior standards at all.

When you account for **behavior** you realize quickly how complex it is to build even a reasonably simple control and make it behave like a control is expected to behave. For example, think of implementing selection behavior on a hand drawn list control, or handling expansion in a hand drawn tree control are not trivial implementation details. You need to account for mouse and keyboard behavior, for hover behavior and a million other little details. Control developers know all of these details, but the average application usually never gives these things a second though - until you have to implement them yourself.

### The unfulfilled lure of Third Parties

> "Aha", I hear you say. "Why don't use a third party control, or control framework?"

Yes there are powerful third party frameworks available from the big framework vendors and also from smaller vendors and even some free ones. Frameworks like Kendo UI, Wijmo, DevExtreme provide a huge set of controls, provide huge set of controls. But - these frameworks tend to be rather expensive and if you do go that route you are really buying into a specific framework's look and feel. If the framework can serve all of your needs - that's great. But... as is often the case when you need something above and beyond now your task will be to match the look and feel and behavior of that very same framework which is often difficult to achieve. Additionally, these frameworks implement their own object models 

I also think that the extreme pricing on some of these frameworks is due to the sheer economics of - free. These once popular companies that used to provide components at reasonably prices are fighting against the tide of mediocre free components today and the only way they can stay afloat is by charging an arm and a leg to make up for the enormous development cost and by sticking that cost to Enterprise customers with deep pockets.

This is a nasty devaluation side effect of OSS that has driven out the middle market - you now see either free (and often mediocre) or high end expensive components. There's no middle ground as it's too expensive to develop rich component suites by small developers and not exciting enough for OSS developers to provide content for this market. 




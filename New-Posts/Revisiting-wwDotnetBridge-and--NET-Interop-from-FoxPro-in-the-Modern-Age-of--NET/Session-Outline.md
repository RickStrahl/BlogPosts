# Session Outline: Revisiting wwDotnetBridge and .NET Interop from FoxPro in the Modern Age of .NET 
If you're building modern applications that need to interface with various system or operating system features, or you need to integrate with many third party components or libraries, you'll likely need external functionality that isn't available natively in FoxPro. Whatever your needs are, you can probably find this functionality in .NET either via built-in .NET features, or by way of open source or third party libraries. With the free wwDotnetBridge Interop library for FoxPro, you can access most features directly or build connector .NET components to simplify access to more complex .NET interfaces in a FoxPro friendly way.

In this session, I show how to use wwDotnetBridge to access .NET functionality both in built-in .NET and Windows system components, as well as take advantage of the wide variety of open source and commercial .NET libraries that you can integrate into your FoxPro code. I'll review the basics of using wwDotnetBridge from FoxPro, and demonstrate a few practical examples of .NET integration in FoxPro, how to find and install components, as well as best practices in for how to effectively expose .NET functionality in your code. In the course of the session, I'll also demonstrate a few useful tools to help discover and test out .NET functionality while you are trying to interface with it from FoxPro.

Finally we'll also take a look at some architectural considerations to decide whether to call .NET code directly from FoxPro, or whether to create small wrapper .NET components that can ease integration of more complex .NET code or components in a FoxPro friendly manner. I'll demonstrate building of your own .NET components using free and light-weight command line tooling, as well as using the traditional .NET flagship IDE in Visual Studio.

The barrier of entry to .NET development is considerably lower these days, and I hope this session will inspire you to take advantage of the wealth of functionality available to extend your FoxPro applications with modern application features.

You will learn:

- Why you'd want to use .NET in your FoxPro Applications
- How to get started with wwDotnetBridge
- Call native .NET components
- Find, load and call third party .NET components
- Use decompilers to discover out API signatures
- Test code interactively with LINQPad
- Create your own .NET components
- Distribute your application with .NET components

Prerequisites: None
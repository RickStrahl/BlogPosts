---
title: Accepting Raw Request Body Content with ASP.NET Web API
abstract: One ASP.NET Web API related question that frequently comes up frequently is how to capture the raw request content to a simple parameter on a controller method. Turns out that's not as easy as it should be. In this post I discuss how to natively capture the raw request content and then create a [NakedBody] attribute that makes it easy capture the raw content in a string or byte[] parameter.
categories: Web Api
keywords: POST,Raw,Content,Body,WebAPI,
weblogName: West Wind Web Log
postId: 161059
---
# Accepting Raw Request Body Content with ASP.NET Web API


>If you're looking for an **ASP.NET Core version** of this post you can find it here: [Accepting Raw Request Body Content in ASP.NET Core API Controllers](https://weblog.west-wind.com/posts/2017/Sep/14/Accepting-Raw-Request-Body-Content-in-ASPNET-Core-API-Controllers).


[ASP.NET Web API](http://www.asp.net/web-api) is a great tool for building HTTP services with ASP.NET. It makes many things HTTP, that used to be ill defined in .NET easy and allows you to build a variety of services very easily. Like other complex abstraction frameworks it makes complex scenarios super easy, while some very simple and common operations are not quite as straight forward or as transparent as they should be.

During this year’s MVP summit it was pointed out that ASP.NET Web API makes some very simple operations that a newbie might try when getting started very non-obvious. One of those I wrote about last year, which is [mapping post values to controller method parameters](http://weblog.west-wind.com/posts/2012/Sep/11/Passing-multiple-simple-POST-Values-to-ASPNET-Web-API) and turns out to require a fairly complex workaround. Another one that was brought to my attention by [Scott Hanselman](http://www.hanselman.com/blog) and is the topic of this post, is how to capture the raw content of an HTTP request.

Capturing raw request content is by no means difficult with Web API, but it’s not exactly obvious either. Yet, it’s one of those first steps that somebody kicking the tires of ASP.NET Web API is very likely to do.

> “Hey let’s take a string and just post it to the server and see what happens, right?”

Yeah well… if you try that, you’re likely going to hit a wall because Web API’s behavior for simple value content mapping is not well defined nor easy to discover.

So in this post I’ll look at posting raw data – not JSON or XML, but just plain text or binary data – to an Web API controller and picking up that data in a controller method. In the process we’ll create a [NakedBody] attribute (the name is Scott’s idea, but it I like it!) that’ll handle the task of capturing raw request data to a parameter.

### Complex Values are easy

ASP.NET Web API makes it pretty easy to pass complex data in the form of JSON or XML to the server. It’s easy to do and intuitive. If you want to capture an object you can simply create a controller method that has an object parameter and Web API automatically handles decoding JSON or XML into the object's structure for you.

```cs
[HttpPut] 
public HttpResponseMessage PutAlbum(Album album)
{
}
```

You don't have to do anything special to get album to parse from say JSON or XML - Web API's Conneg logic automatically detects the content type, maps it to a MediaFormatter and converts the incoming JSON or XML (or whatever other formatters are configured) data and converts it to the type of the parameter of the controller method.

If the data happens to be POST form data (ie. urlencoded key value pairs), Web API’s Model Binding can automatically map each of the keys of the form data to the properties of the object, including nested object paths.

So that's very easy and as it should be, and it actually addresses most of the realistic use cases. This is the ‘complex stuff is easy’ part.

### Capturing the raw Request Body

But things are not so easy and transparent when you want to pass simple parameters like strings, numbers, dates etc. Because Web API is based on a host of conventions, some things that should be easy, such as easily picking up the raw content of a POST or PUT operation and capturing it, aren't quite so transparent as the automatic type mapping shown above.

One thing you might expect to be able to easily do, is to pick up the entire content body and map it to a parameter like this:

```cs
[HttpPost]
public string PostRawBuffer(string raw)
{
    return raw;
}
```

Quick, what do you think is required by the client to call this method the string parameter? I’ll wait here while you ponder…

The answer is - **not easily and not without some additional ‘hints’**.

There are a number of issues here that actually make this one of the worst parameter signatures in Web API.  
This parameter signature **does not work** with any of these posted values:

*   Raw Content Buffer Data (entire buffer)
*   A JSON string with application/json content type
*   A UrlEncoded Form Variable
*   A QueryString Variable

In fact, no matter what you pass here in posted body content – the string parameter is always null. The same is true if you have any other simple parameter type – numbers, bools, dates, byte[] etc. Plain parameter mapping (without special attributes) works only complex types like objects and arrays.

If you really think about how Web API’s parameter bindings work, this sort of makes sense with the exception of the JSON string parameter. Parameter bindings map based on media types (ie. content-type header) using the Conneg algorithm by default and try to map parameters as whole entities. If you post a a raw string or buffer Web API internally really has no idea how to map this to anything. Should it map the entire buffer? A form variable? A JSON string? So it needs some hints to do it’s thing.

### Why doesn’t a JSON string work?

That explains raw strings, but not the JSON string. It’s definitely baffling that a JSON string posted with an _application/json_ content type doesn’t work. So if you POST something like this:

```csharp
POST http://dev.west-wind.com/aspnetwebapi/samples/PostJsonString HTTP/1.1
Host: dev.west-wind.com
Content-type: application/json; charset=utf-8 
Content-Length: 24

"Posting a JSON string."
```


this is _a valid JSON request_, but **it still fails to map**.

### **[FromBody] to retrieve Content**

I mentioned hints, and Web API allows you to use parameter binding attributes to provide these hints. These allow you to tell Web API where the content is coming from explicitly. There are [FromBody] and [FromUri] attributes that can force content to be mapped from POST or query string content for example.

Using [FromBody] like this:

```csharp
[HttpPost]
public string PostJsonString([FromBody] string text)
{
    return text;
}
```

now allows JSON or XML content to be mapped from the body. Same goes for other simple parameter types like numbers, dates, bools etc.

So if you now post:

```txt
POST http://rasxps/aspnetwebapi/samples/PostRawBuffer HTTP/1.1
Content-Type: application/json; charset=utf-8
Host: rasxps
Content-Length: 22
 
"Hello World Suckers."
```
you now get the raw parameter mapped properly because the input string is in JSON format.

`[FromBody]` works for properly formatted content – ie. JSON, XML and whatever other media formatters that are configured in the Conneg pipeline. It requires that the data is formatted in JSON or XML. [FromBody] also works with a single POST form variable in urlencoded form data, but because it only works with a single parameter it’s kind of limited for that.

But [FromBody] still doesn’t work if you just want to capture the entire raw content – so if the data is not JSON or XML encoded and you just want the raw data [FromBody] is no help.

### Capturing the raw Content

Without extending Web API with custom parameter bindings, you can capture the raw HTTP request content, but it doesn’t capture the raw content to a parameter. This is pretty easy to do with code like this:

```csharp
[HttpPost]
public async Task<string> PostRawBufferManual()
{
    string result = await Request.Content.ReadAsStringAsync();            
    return result;
}
```
There are additional overloads to capture the raw Request content in various formats like byte[] or stream so it’s easy to read the data however you like it.

This solves the problem, but it’s not quite as expressive as having a typed parameter filled describing what’s happening in this operation at a glance. Nor does the parameter show up in the WebAPI controller documentation.

### Creating a [NakedBody] custom Attribute

So in order to capture raw content into a parameter we have to take parameter binding process into our own hands. This solution is similar to the way [FromBody] works by applying an attribute to a single string or byte array parameter. This is a little bit more involved, but it’s generic tooling that you can reuse on any method in any application once created.

In order to accomplish this we need to create two components:

*   A custom parameter binding class
*   A [NakedBody] attribute that hooks up the binding to a parameter

### Creating the NakedBodyParameterBinding

The first thing needed is a parameter binding that can pull the data from the Request content, and feed it to the parameter.

Parameter bindings are applied against each of the parameters in any Web API controller method. Each parameter is automatically mapped to a parameter binding typically based on the Conneg algorithm that determines the parsing and formatting pipeline. There are default bindings that process on standard Conneg media types and handle ModelBinding or raw data binding from JSON/XML etc. objects directly to parameters.

Using attributes  like [FromBody], [FromUri] or this [NakedBody] override the default parameter bindings and explicitly allow binding custom parameter bindings to a given parameter. Parameter bindings are called when Web API parses the controller method signature and goes through each of the parameters one by one to unbind the request content into each of the parameters if possible.

Here’s what the NakedParameterBinding() class looks like:

```csharp
/// <summary>
/// Reads the Request body into a string/byte[] and
/// assigns it to the parameter bound.
/// 
/// Should only be used with a single parameter on
/// a Web API method using the [NakedBody] attribute
/// </summary>
public class NakedBodyParameterBinding : HttpParameterBinding
{
    public NakedBodyParameterBinding(HttpParameterDescriptor descriptor)
        : base(descriptor)
    {

    }


    public override Task ExecuteBindingAsync(ModelMetadataProvider metadataProvider,
                                                HttpActionContext actionContext,
                                                CancellationToken cancellationToken)
    {
        var binding = actionContext
            .ActionDescriptor
            .ActionBinding;

        if (binding.ParameterBindings.Length > 1 || 
            actionContext.Request.Method == HttpMethod.Get)            
            return EmptyTask.Start();            

        var type = binding
                    .ParameterBindings[0]
                    .Descriptor.ParameterType;

        if (type == typeof(string))
        {
            return actionContext.Request.Content
                    .ReadAsStringAsync()
                    .ContinueWith((task) =>
                    {
                        var stringResult = task.Result;
                        SetValue(actionContext, stringResult);
                    });
        }
        else if (type == typeof(byte[]))
        {
            return actionContext.Request.Content
                .ReadAsByteArrayAsync()
                .ContinueWith((task) =>
                {
                    byte[] result = task.Result;
                    SetValue(actionContext, result);
                });
        }

        throw new InvalidOperationException("Only string and byte[] are supported for [NakedBody] parameters");
    }

    public override bool WillReadBody
    {
        get
        {
            return true;
        }
    }
}
```


The workhorse method of a parameter binding is the ExecuteBindingAsync() method which handles conversion of the parameter. Of the parameters passed the actionContext is vital in that it provides us the information needed to determine if the parameter should be handled and what the type of the parameter is. In this case we need to check that the request is not a GET request and that there’s only a single string or byte[] parameter passed – otherwise this binding is ignored.

If those requirements are fulfilled we can go ahead and read the request body either as a string or byte buffer and then call SetValue() on the ParameterBiding() to assign the value to the parameter.

The most complex thing about this code is the async logic as couple of Task operations are strung together – first reading the request context, then picking up the result and assigning it with the Task’s result string or byte[] values. We also need an ‘empty’ task to return when we just want to continue on without processing anything since the ExecuteBindingAsync method always has to return a task and you can’t return null or else you get a server exception. Here’s my EmptyTask class:

```csharp
/// <summary>
/// A do nothing task that can be returned
/// from functions that require task results
/// when there's nothing to do.
/// 
/// This essentially returns a completed task
/// with an empty value structure result.
/// </summary>
public class EmptyTask
{
    public static Task Start()
    {
        var taskSource = new TaskCompletionSource<AsyncVoid>();
        taskSource.SetResult(default(AsyncVoid));
        return taskSource.Task as Task;
    }

    private struct AsyncVoid
    {
    }
}
```


### Creating the [NakedBody] Attribute

In order to attach the NakedBodyParameterBinding() we need a mechanism to let Web API know that a parameter is requesting this binding. I played around with just applying this binding as a default binding as the very last binding, but there that didn’t work reliably because Web API would choke before ever getting to this point if the content type didn’t match one of the media formatters installed. So an explicit attribute seems to be the only way this can work reliably.

Creating the attribute is easy enough:

```csharp
/// <summary>
/// An attribute that captures the entire content body and stores it
/// into the parameter of type string or byte[].
/// </summary>
/// <remarks>
/// The parameter marked up with this attribute should be the only parameter as it reads the
/// entire request body and assigns it to that parameter.    
/// </remarks>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Parameter, AllowMultiple = false, Inherited = true)]
public sealed class NakedBodyAttribute : ParameterBindingAttribute
{
    public override HttpParameterBinding GetBinding(HttpParameterDescriptor parameter)
    {
        if (parameter == null)
            throw new ArgumentException("Invalid parameter");

        return new NakedBodyParameterBinding(parameter);
    }
}
```

The NakedBodyAttribute inherits from the ParameterBindingAttribute class and it’s sole purpose is to dynamically determine the binding that is to be used on that parameter. All that needs to happen is creating an instance of our NakedBodyParameterBinding class described above and passing the parameter in.

### Using the [NakedBody] Parameter Attribute

To use the attribute is pretty easy. Simply create a method with a single _string_ or _byte[]_ parameter and mark it up with the [NakedBody] attribute:

```csharp
[HttpPost]
public string PostRawBuffer([NakedBody] string raw)
{
    return raw;
}

[HttpPost]
public string PostBinaryBuffer([NakedBody] byte[] raw)
{
    return raw.Length + " bytes sent";
}
```


You can now send data to the first one using this HTTP trace. Here’s the string version trace of the request data:

```csharp
POST http://dev.west-wind.com/aspnetwebapi/samples/PostRawBuffer HTTP/1.1
Content-Type: text/plain; charset=utf-8
Host: dev.west-wind.com
Content-Length: 30
Connection: Keep-Alive

This is a raw string buffer...
```

In this case you get a the original string back as a JSON response – JSON because the default format for Web API is JSON. BTW, I noticed that if omitted Accept headers and I used a Content-Type of text/xml the response would be XML. If the content type is application/json or any non-mapped media format, JSON is returned. News to me that the input Content type had an impact on output format, but it appears that it does in some cases when an Accept header is missing.

### Web API should address some of these simple Use Cases

The  good news is that solutions like this to work around some of the simple limitations of Web API are possible and not very complex. While these types of solutions often are not very discoverable, they are relatively easy to implement if you poke around a little. To create this [NakedBodyAttribute] I basically looked at the [FromBody] attribute and followed the pattern laid out there to create the attribute and parameter binding which is fairly simple. As you can see the solution is really just a few lines of code in a couple of classes. But… finding out exactly what to do for this is not exactly easy to discover. Luckily you won’t have to since it’s done for you with the code here :-)

But it does gall a bit that some of these simple scenarios are not addressed out of the box. While these are not the most practical operations, they are the kinds of things that new users typically want to try first. I can’t tell you how often I’ve forgotten to use [FromUri] for example when I wanted parameters mapped from the query string, or when wanted to pick up 2 or 3 form variables without having to create a new class just to model bind those 2 or 3 values or as described here when I wanted to capture the raw request input. Instead bindings are simply falling through and returning null or empty values – this simply shouldn’t happen in most cases. Attributes are a reasonable solution, but again it’s not really discoverable if you’re just starting out and it’s not the easiest to find out about since it’s considered a specialty scenario.

I suspect there are good reasons why these use cases are not ‘in the box’ – performance for one as mapping these scenarios requires reading the entire content buffer up front to determine whether parameters can actually be bound. But still… this should be addressed in some way in the future to make the ‘first time tire kicking experience’ easier and more rewarding.

### Resources and Related Content

*   [**ASP.NET Web API Article Code on GitHub**](https://github.com/RickStrahl/AspNetWebApiArticle)
*   [**NakedBodyParameter Binding Code**](https://github.com/RickStrahl/AspNetWebApiArticle/blob/master/AspNetWebApi/Code/WebApi/Binders/NakedBodyParameterBinding.cs)
*   [**NakedBodyAttribute Code**](https://github.com/RickStrahl/AspNetWebApiArticle/blob/master/AspNetWebApi/Code/WebApi/Binders/NakedBodyAttribute.cs)
*   [**POST Form Field Parameter Binding Article**](http://weblog.west-wind.com/posts/2012/Sep/11/Passing-multiple-simple-POST-Values-to-ASPNET-Web-API)
*   [**An Introduction to ASP.NET Web API**](http://weblog.west-wind.com/posts/2012/Aug/21/An-Introduction-to-ASPNET-Web-API)
*   [Accepting Raw Request Body Content in ASP.NET Core API Controllers](https://weblog.west-wind.com/posts/2017/Sep/14/Accepting-Raw-Request-Body-Content-in-ASPNET-Core-API-Controllers)
---
title: System.Text.Json Dynamic JSON Parsing Is No Fun
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2024-07-05T20:50:23.9888306-07:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# System.Text.Json Dynamic JSON Parsing Is No Fun
One big reason I've stuck to the `Newtonsoft.Json` library for JSON parsing is to have an easy way to parse dynamic data. The Newtonsoft library continues to have a much better and wider usability API as well as supporting a wider range of borderline JSON formats (like non-quoted props, comments, etc.) , that `System.Text.Json` refuses to process. In most cases that's fine, those borderline features are rarely used, although dynamic parsing that doesn't require serialization to pull out just a few values is something I do quite frequently, especially for API error handling. The System.Text.Json library is meant to be lean and mean and it's supposedly a bit faster and less resource intensive, although I've never had an issue with the Newtonsoft library. I do know that I've hit a lot of serialization edge cases over the years that have forced me back to using the Newtonsoft library and ASP.NET projects and otherwise.

Long story short one of the use cases that usually made me grab for the Newtonsoft library was dynamic parsing, but I'm glad to see that at some time at least some minimal support for dynamic parsing was added to the `System.Text.Json.JsonSerializer` class.

## JsonNode and JsonObject Deserialization
The primary way way to deserialize using the `JsonSerializer` class is to use the generic parameter to provide a type to deserialize into.

You would do something like this:  

```csharp
var json = """
{
    "error": {
        "message": "Incorrect API key provided: sk-wp****************************************fKnX.",
        "type": "invalid_request_error",
        "param": null,
        "code": "invalid_api_key"
    }
}
""";

var argh = JsonSerializer.Deserialize<OpenAiResponseError>(json);
message = argh.error.message;
```

That works splendidly, except you have to define a C# class hierarchy for this to work first. In this case two objects are needed.

```cs
public class OpenAiErrorResponse        
{
    public OpenAiError error { get; set; }
}

public class OpenAiError
{
    public string message { get; set; }    
    public string code { get; set; }
}
```

You need both of these objects in order to get to the child object - so even though we might only need the `message` property you have to create at least two objects. This can get cumbersome especially if you have deep object structures when you only need to pull one or a few values out deep inside of the structure. 

> ##### Json to C# Classes
> In case you haven't found this neat Visual Studio feature: Edit -> Paste Special -> Paste as JSON can convert JSON from the clipboard and turn it into C# classes for you:  
> 
> ![Paste As Json](https://github.com/RickStrahl/ImageDrop/blob/master/BlogPosts/2024/PasteAsJson.gif?raw=true)
> 

## Using System.Text.Json
So System.Text.Json has support for dynamic parsing. But the syntax to do so is a bit verbose. Here's what this looks like:

```csharp
var json = """
{
  "name": "rick", 
  "address": 
  { 
     "street": "123 Eastwick",
   "streetNumber": 123
  }
}
""";

JsonObject jobj = JsonSerializer.Deserialize<JsonObject>(json);

// Explicit type conversion
string name = jobj["name"].GetValue<string>();
Console.WriteLine(name);

// ToString() works for string values
name = jobj["name"].ToString();
Console.WriteLine(name);

// AsXXX() methods give you specific Json type
JsonObject jaddress = jobj["address"].AsObject();

// GetXXX methods return .NET values
string street = jaddress["street"].GetValue<string>();
Console.WriteLine(street);

int sno = jaddress["streetNumber"].GetValue<int>();
Console.WriteLine(sno);
```

This functionality was introduced with .NET Core 3.0 so it's been around for some time. I'm glad to see that this now works but the syntax for this is... awkward. 

### Some 'dynamic' Features: Sort of
If you've worked with the Newtonsoft library you probably know that it has a cool feature that lets you Parse objects into dynamic types which allow you to use natural class hiearachy syntax to drill into even complex object structures without having to deserialize into a fixed type hierarchy.


```csharp
var json = """
{ "name": "rick", "address": { "street": "123 Eastwick" } }
""";

dynamic node = JsonSerializer.Deserialize<ExpandoObject>(json);

// this works - (implicit ToString())
Console.WriteLine(node.name);

// this works explicit .ToString()
var name = node.name.ToString();
name.Dump();
```
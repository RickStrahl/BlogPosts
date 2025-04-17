---
title: RequestValidation Changes in ASP.NET 4.0
abstract: ASP.NET 4.0 changes the way request validation works by default, pushing request validation into the ASP.NET pipeline from the Web Forms engine. This might cause some unexpected behavior if you've used the validateRequest Page level attribute to allow unsafe content to be posted but it can also cause problems in other scenarios.
keywords: Request Validation, ASP.NET 4.0
categories: ASP.NET
weblogName: West Wind Web Log
postId: 746477
postDate: 2018-09-22T12:00:05.4868283-10:00
---
# RequestValidation Changes in ASP.NET 4.0

There’s been a change in the way the ValidateRequest attribute on WebForms works in ASP.NET 4.0\. I noticed this today while updating a post on my WebLog all of which contain raw HTML and so all pretty much trigger request validation. I recently upgraded this app from ASP.NET 2.0 to 4.0 and it’s now failing to update posts. At first this was difficult to track down because of custom error handling in my app – the custom error handler traps the exception and logs it with only basic error information so the full detail of the error was initially hidden.

After some more experimentation in development mode the error that occurs is the typical ASP.NET validate request error (‘A potentially dangerous Request.Form value was detetected…’) which looks like this in ASP.NET 4.0:

![RequestValidationErrorScreen](http://www.west-wind.com/Weblog/images/200901/WindowsLiveWriter/ValidateRequestinASP.NET4.0_CE30/RequestValidationErrorScreen_814e822f-9184-4627-adec-f5d837f15915.png "RequestValidationErrorScreen")

At first when I got this I was real perplexed as I didn’t read the entire error message and because my page does have:

```html
<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="NewEntry.aspx.cs" 
         Inherits="Westwind.WebLog.NewEntry" 
         MasterPageFile="~/App_Templates/Standard/AdminMaster.master"  
         ValidateRequest="false"         
         EnableEventValidation="false"
         EnableViewState="false" 
%>
```

WTF? ValidateRequest would seem like it should be enough, but alas in ASP.NET 4.0 apparently that setting alone is no longer enough. Reading the fine print in the error explains that you need to explicitly set the requestValidationMode for the application back to V2.0 in web.config:

```xml
<httpRuntime executionTimeout="300" requestValidationMode="2.0" />
```


Kudos for the ASP.NET team for putting up a nice error message that tells me how to fix this problem, but excuse me why the heck would you change this behavior to require an explicit override to an optional and by default disabled page level switch? You’ve just made a relatively simple fix to a solution a nasty morass of hard to discover configuration settings??? The original way this worked was perfectly discoverable via attributes in the page. Now you can set this setting in the page and get completely unexpected behavior and you are required to set what effectively amounts to a backwards compatibility flag in the configuration file.

It turns out the real reason for the .config flag is that the request validation behavior has moved from WebForms pipeline down into the entire ASP.NET/IIS request pipeline and is now applied against all requests. Here’s what the breaking changes page from Microsoft says about it:

> The request validation feature in ASP.NET provides a certain level of default protection against cross-site scripting (XSS) attacks. In previous versions of ASP.NET, request validation was enabled by default. However, it applied only to ASP.NET pages (`.aspx` files and their class files) and only when those pages were executing.
> 
> In ASP.NET 4, by default, request validation is enabled for all requests, because it is enabled before the **BeginRequest** phase of an HTTP request. As a result, request validation applies to requests for all ASP.NET resources, not just .aspx page requests. This includes requests such as Web service calls and custom HTTP handlers. Request validation is also active when custom HTTP modules are reading the contents of an HTTP request.
>
> As a result, request validation errors might now occur for requests that previously did not trigger errors. To revert to the behavior of the ASP.NET 2.0 request validation feature, add the following setting in the `Web.config` file:
>
> ```
> <httpRuntime requestValidationMode="2.0" />
> ```
>
>However, we recommend that you analyze any request validation errors to determine whether existing handlers, modules, or other custom code accesses potentially unsafe HTTP inputs that could be XSS attack vectors.

Ok, so ValidateRequest of the form still works as it always has but it’s actually the ASP.NET Event Pipeline, not WebForms that’s throwing the above exception as request validation is applied to every request that hits the pipeline. Creating the runtime override removes the HttpRuntime checking and restores the WebForms only behavior. That fixes my immediate problem but still leaves me wondering especially given the vague wording of the above explanation.

One thing that’s missing in the description is above is one important detail: The request validation is applied only to _application/x-www-form-urlencoded_ POST content not to all inbound POST data.

When I first read this this freaked me out because it sounds like literally ANY request hitting the pipeline is affected. To make sure this is not really so I created a quick handler:

```csharp
public class Handler1 : IHttpHandler
{

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "text/plain";
        context.Response.Write("Hello World <hr>" + context.Request.Form.ToString());
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }
}
```


and called it with Fiddler by posting some XML to the handler using a default form-urlencoded POST content type:

![FiddlerRequest](http://www.west-wind.com/Weblog/images/200901/WindowsLiveWriter/ValidateRequestinASP.NET4.0_CE30/FiddlerRequest_7cb82cd4-679e-49d7-acff-bd73182f934b.png "FiddlerRequest")

and sure enough – hitting the handler also causes the request validation error and 500 server response.

Changing the content type to text/xml effectively fixes the problem however, bypassing the request validation filter so Web Services/AJAX handlers and custom modules/handlers that implement custom protocols aren’t affected as long as they work with special input content types. It also looks that _multipart encoding_ does not trigger event validation of the runtime either so this request also works fine:

```txt
POST http://rasnote/weblog/handler1.ashx HTTP/1.1
Content-Type: multipart/form-data; boundary=------7cf2a327f01ae
User-Agent: West Wind Internet Protocols 5.53
Host: rasnote
Content-Length: 40
Pragma: no-cache

<xml>asdasd</xml>--------7cf2a327f01ae
```

*That* probably should trigger event validation – since it is a potential HTML form submission, but it doesn’t.

### New Runtime Feature, Global Scope Only?

Ok, so request validation is now a runtime feature but sadly it’s a feature that’s scoped to the ASP.NET Runtime – effective scope to the entire running application/app domain. You can still manually force validation using Request.ValidateInput() which gives you the option to do this in code, but that realistically will only work with the requestValidationMode set to V2.0 as well since the 4.0 mode auto-fires before code ever gets a chance to intercept the call. Given all that, the new setting in ASP.NET 4.0 seems to limit options and makes things more difficult and less flexible. Of course Microsoft gets to say ASP.NET is more secure by default because of it but what good is that if you have to turn off this flag the very first time you need to allow one single request that bypasses request validation??? This is really shortsighted design… <sigh>
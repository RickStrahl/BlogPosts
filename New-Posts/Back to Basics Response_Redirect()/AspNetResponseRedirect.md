# Back to Basics: Response.Redirect() in ASP.NET

In ASP.NET Response.Redirect() is an often used construct to redirect content. But did you know that the standard behavior of Response.Redirect() is very expensive in operation as it causes a thread abort exception?

### Standard Response.Redirect()
When you call Response.Redirect() off an ASP.NET request the current request thread is immediately terminated after the new Redirect response has been created. The effect is that the code that’s currently executing just stops after Response.Redirect(). This is a hold over from ASP classic which had similar behavior where a Response.Redirect() immediately terminated page execution.

```cs
Response.Redirect("~/home/");
```

In ASP.NET termination of the thread is a very expensive operation because typically ASP.NET caches and reuses request threads as part of the HttpApplication pipeline’s thread pool. When the thread is terminated that thread can no longer be recycled and so a new thread has to be created. Thread creation is relatively expensive when it comes to application operations so this should be avoided.

### Enhanced Response.Redirect()
Starting with .NET 2.0 Response.Redirect() got an optional second Boolean parameter that allows you to Redirect but not terminate the IIS request cycle. Instead the Response is cleared and the new output written, but the request continues running through the HTTP pipeline of ASP.NET. 

Response.Redirect("~/home/",false);Using this signature requires that you explicitly exit the code you are running by returning from the code so a more typical piece of code might be the following:

```cs
if (!IsLoggedIn())
{
    Response.Redirect("~/home/",false);
    return;
}
```

Notice that I explicitly return here because the thread is not terminated so the current method code following the call to Response.Redirect() would otherwise execute. It’s important to exit the method when you use the second parameter.

It’s important to understand that at this point the rest of the ASP.NET Request pipeline will continue to fire. Your actual request method ended and the Redirect() HTTP response are created but the request continues to fire all the modules configured on your pipeline. The behavior here will vary depending on which ASP.NET framework you are using.

If you’re using ASP.NET the rest of the Page event cycle continues to fire. So if you are in Page_Load() and you have a Page_PreRender() method the latter will fire, which may have bad side effects. ASP.NET is smart enough to detect you’ve redirected the response and it will not send output to the Response() after a Redirect() but the code may still run.

If you are inside of an ASP.NET HttpHandler or MVC or Web Api – anywhere else, the code will exit. 

### Context.ApplicationInstance.CompleteRequest()
If you want to cut out the rest of the ASP.NET pipeline when requests Response.Redirect() is called you can use Context.CompleteRequest() following the Response.Redirect() call. 

```cs
if (!IsLoggedIn())
{
    Response.Redirect("~/home/",false);
    HttpContext.Current.ApplicationInstance.CompleteRequest();                          
    return;
}
```

This bypasses the rest of the ASP.NET pipeline and jumps straight to the Application_EndRequest() event after the handler or module has completed operation. 

This doesn’t guarantee that no other code runs, but it does guarantee only that ASP.NET pipeline code does not run.


http://blogs.msdn.com/b/tmarq/archive/2009/06/25/correct-use-of-system-web-httpresponse-redirect.aspx

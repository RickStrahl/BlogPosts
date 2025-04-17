# ASP.NET Core and CORS Gotchas

![Interconnected](Connected.png)

Last night I was working on updating my [ASP.NET Core AlbumViewer sample application](https://github.com/RickStrahl/AlbumViewerVNext) to Angular 2.0 and in the process ran into CORS problems. Angular 2.0's default working environment runs a development server off a seperate port which is effectively a seperate domain and all calls back to the main ASP.NET site for the API calls effectively are cross domain calls. Alas those calls failed and upon closer inspection it was due to the fact that the CORS headers weren't getting sent.

### CORS Setup in ASP.NET Core
CORS is a server based mechanism that essentially lets a **server** say: 

> I allow cross domain calls from the domains I specify

It's good to be king, huh? (especially a king with no clothes since the protocol does next to nothing to prevent malicious attacks but that's a story for another post)

When browsers make cross domain calls using XHR, they request CORS headers to decide whether the target server allows access to the source domain. In this case the source domain is Angular's dev server (localhost:3000) and the target server is my ASP.NET API service (localhost:5000 (raw Kestrel) or localhost/albumviewer (IIS/IIS Express)).

To set up CORS is at least a 3 step process:

* You register CORS functionality
* You configure CORS options
* You apply the functionality

There are a number of different ways to do this but by far the best approach IMHO is to create a CORS policy and then apply that policy either globally to all requests or specific controllers.

I like the policy approach because:

* It allows me to add CORS and declare the policy in one place
* It allows the policy to be reused and be applied selectively

Below I use the explicit policy approach. 

##AD##

### Register and Define a Policy
To do this start with registering CORS functionality in `ConfigureServices()` of Startup.cs:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    // Add service and create Policy with options
    services.AddCors(options =>
    {
        options.AddPolicy("CorsPolicy",
            builder => builder.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials() );
    });
    
    
    services.AddMvc(); 
}
```

The `AddCors()` call above adds the CORS features to ASP.NET and creates a custom policy that can be reused in the application by name. There are other ways to do essentially the same thing by explicitly adding a policy builder in the configuration step but to me this seems cleanest - define one or more policies up front and then apply it.

### Apply the Policy
Once the policy has been defined it can be applied.

You can apply the policy globally to every request in the application by call `app.useCors()` in the `Configure()` method of Startup:

```csharp
public void Configure(IApplicationBuilder app)
{
    // ...

    // global policy - assign here or on each controller
    app.UseCors("CorsPolicy");

    // ...
    
    // IMPORTANT: Make sure UseCors() is called BEFORE this
    app.UseMvc(routes =>
    {
        routes.MapRoute(
            name: "default",
            template: "{controller=Home}/{action=Index}/{id?}");
    });
}
```

> #### @icon-info-circle UseCors() has to be called before UseMvc()
> Make sure you declare the CORS functionality **before**  MVC so the middleware fires before the MVC pipeline gets control and terminates the request.

or you can apply the policy to individual controllers:

```csharp
[EnableCors("CorsPolicy")]
[ApiExceptionFilter]
public class AlbumViewerApiController : Controller
```


### Check that it works

When it's all said and done you now should get the appropriate CORS headers with your response:

```http
HTTP/1.1 200 OK
Date: Tue, 27 Sep 2016 07:09:08 GMT
Content-Type: application/json; charset=utf-8
Server: Kestrel
Vary: Origin
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: http://localhost:3000
Content-Length: 2851
```

Note that the actual headers sent may vary depending on what your request needs. GET operations might have different CORS headers than a POST or OPTION request.

##AD##

### Watch out for testing CORS without Cross Domain!
So last night I reviewed my code and checked for the CORS functionality. It turns out I had at some point renamed the policy and so the policy strings were out of sync resulting in mismatched policy names and no CORS headers. Once I fixed that it seemed that everything should be well.

I went ahead and tested API calls through a browser and found: No CORS headers. Checked all again for errors and it all looked just fine. WTH? It wasn't until I tried running the full Angular application again that I found that the app was now working, and the CORS headers were being sent properly. In this **duh!** moment I realized of course that this is the **correct** behavior.

**CORS headers are only sent on cross domain requests** and the ASP.NET CORS module is smart enough to detect whether a same domain request is firing and if it is, doesn't send the headers. Duh - of course, but in the heat of the moment I totally didn't think of that. 

The sad thing is this is not the first time I've made this mistake :-) As soon as I figured it out, I realized I had made that very same mistake a few months earlier when I set up the original CORS functionality and tested - and failed/flailed. History repeats itself. To avoid that - I'm writing it down to jog my memory.

So, if you're going to test CORS operation the only effective way to do is is **by using a cross-site origin to trigger the CORS behavior**. Either use a cross site client app (my Angular app in this case) or an HTTP test client (I used my [West Wind WebSurge](https://websurge.west-wind.com) tool with an explicit origin header) and avoid scratching your head on why the CORS headers are not showing up.

### Resources
* [Official ASP.NET CORS documentation](https://docs.asp.net/en/latest/security/cors.htmlhttps://docs.asp.net/en/latest/security/cors.html)


<!-- Post Configuration -->
<!--
```xml
<blogpost>
<abstract>
CORS is a requirement for cross domain XHR calls, and when you use Angular 2.0 default dev server and talk to an ASP.NET Core application you'll need to use CORS to get XHR to talk across the domain boundaries. Here's how to set up CORS and how to test it.
</abstract>
<categories>
ASP.NET Core,ASP.NET,Security
</categories>
<keywords>
CORS,ASP.NET Core,Security,XHR,Cross Site
</keywords>
<weblogs>
<postid>22759</postid>
<weblog>
Rick Strahl's Weblog
</weblog>
</weblogs>
</blogpost>
```
-->
<!-- End Post Configuration -->

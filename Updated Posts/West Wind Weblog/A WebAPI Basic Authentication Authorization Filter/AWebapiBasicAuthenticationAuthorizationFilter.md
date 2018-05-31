---
title: A WebAPI Basic Authentication Authorization Filter
abstract: Recently I needed to implement user based security in a Web API application that's easily accessible from a variety of clients. The customer asked specifically for Basic Auth support and so needed to implement custom Basic Auth support. In this post I describe a simple AuthorizationFilter based implementation of Basic Authentication for Web API.
keywords: WebAPI, ASP.NET, Security,Basic Auth,Authentication,AutorizationFilter
categories: Web Api,Security
weblogName: West Wind Web Log
postId: 104409
postDate: 2018-05-11T22:04:18.2169080-07:00
---
# A WebAPI Basic Authentication Authorization Filter

ASP.NET Web API allows for a number of different ways to implement security. The 'accepted' way to handle authentication is to use either IIS's built in security (ie. rely on HttpContext and the IIS authentication through Windows Security) or you can roll your own inside of Web API using Web APIs message semantics. If you roll your own the recommended way for authentication is to create a MessageHandler and then add Authorization with a Filter. AFAIK, Web API natively doesn't ship with any authentication handlers at all, so you pretty much have to roll your own if you want to host outside of IIS.

Anyway, in one of my apps for a customer we needed custom user authentication based on user credentials from the business layer and the client explicitly requested Basic authentication due to the client side requirements. Basic Authentication is easy and support by just about any Web client, but it's not secure and requires that SSL is used to keep the encoded (not encrypted) credentials somewhat safe from simple attacks. In this case the app runs on an internal network so the risk factor is low.

### Filter Only?

When I looked at the various options at implementing custom login security outside of ASP.NET, the first thing I found was Authorization filters. Authorization filters are a really easy way to examine the request, determine whether a user has access and then either going on or exiting out with an UnauthorizedAccess exception.

Filters aren't meant to be full on HTTP request managers that return results - typically that's meant for MessageHandlers in Web API - but Basic Authentication is such a simple protocol that requires just a few lines of code to implement, so I went ahead and implemented the entire protocol in the filter. Since in this application we have a specific way of authorizing there's only one type of auth happening, there was little need to use a more complex implementation. For contrast in my next post [I also implement a message handler based Basic Authentication implementation](http://www.west-wind.com/weblog/posts/2013/Apr/30/A-WebAPI-Basic-Authentication-MessageHandler), so you can easily compare the two if wish.

### Authorization Filters in ASP.NET Web API

An Authorization filter inherits from the AuthorizationFilterAttribute class and typically overrides the OnAuthorization() method which should handle the authorization tasks. The filter should do nothing to allow a request through if authorization is valid, throw a UnauthorizedException() if it fails to validate a user, or return a new custom HttpResponseMessage.

Here's the somewhat generic Authorization filter version I ended up with:

```cs
/// <summary>
/// Generic Basic Authentication filter that checks for basic authentication
/// headers and challenges for authentication if no authentication is provided
/// Sets the Thread Principle with a GenericAuthenticationPrincipal.
/// 
/// You can override the OnAuthorize method for custom auth logic that
/// might be application specific.    
/// </summary>
/// <remarks>Always remember that Basic Authentication passes username and passwords
/// from client to server in plain text, so make sure SSL is used with basic auth
/// to encode the Authorization header on all requests (not just the login).
/// </remarks>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class BasicAuthenticationFilter : AuthorizationFilterAttribute
{
    bool Active = true;

    public BasicAuthenticationFilter()
    { }

    /// <summary>
    /// Overriden constructor to allow explicit disabling of this
    /// filter's behavior. Pass false to disable (same as no filter
    /// but declarative)
    /// </summary>
    /// <param name="active"></param>
    public BasicAuthenticationFilter(bool active)
    {
        Active = active;
    }
        

    /// <summary>
    /// Override to Web API filter method to handle Basic Auth check
    /// </summary>
    /// <param name="actionContext"></param>
    public override void OnAuthorization(HttpActionContext actionContext)
    {
        if (Active)
        {
            var identity = ParseAuthorizationHeader(actionContext);
            if (identity == null)
            {
                Challenge(actionContext);
                return;
            }


            if (!OnAuthorizeUser(identity.Name, identity.Password, actionContext))
            {
                Challenge(actionContext);
                return;
            }
            
            var principal = new GenericPrincipal(identity, null);

            Thread.CurrentPrincipal = principal;

            // inside of ASP.NET this is required
            //if (HttpContext.Current != null)
            //    HttpContext.Current.User = principal;

            base.OnAuthorization(actionContext);
        }
    }

    /// <summary>
    /// Base implementation for user authentication - you probably will
    /// want to override this method for application specific logic.
    /// 
    /// The base implementation merely checks for username and password
    /// present and set the Thread principal.
    /// 
    /// Override this method if you want to customize Authentication
    /// and store user data as needed in a Thread Principle or other
    /// Request specific storage.
    /// </summary>
    /// <param name="username"></param>
    /// <param name="password"></param>
    /// <param name="actionContext"></param>
    /// <returns></returns>
    protected virtual bool OnAuthorizeUser(string username, string password, HttpActionContext actionContext)
    {
        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            return false;

        return true;
    }

    /// <summary>
    /// Parses the Authorization header and creates user credentials
    /// </summary>
    /// <param name="actionContext"></param>
    protected virtual BasicAuthenticationIdentity ParseAuthorizationHeader(HttpActionContext actionContext)
    {
        string authHeader = null;
        var auth = actionContext.Request.Headers.Authorization;
        if (auth != null && auth.Scheme == "Basic")
            authHeader = auth.Parameter;

        if (string.IsNullOrEmpty(authHeader))
            return null;

        authHeader = Encoding.Default.GetString(Convert.FromBase64String(authHeader));

        var tokens = authHeader.Split(':',2);
        if (tokens.Length < 2)
            return null;

        return new BasicAuthenticationIdentity(tokens[0],tokens[1]);
    }


    /// <summary>
    /// Send the Authentication Challenge request
    /// </summary>
    /// <param name="message"></param>
    /// <param name="actionContext"></param>
    void Challenge(HttpActionContext actionContext)
    {
        var host = actionContext.Request.RequestUri.DnsSafeHost;
        actionContext.Response = actionContext.Request.CreateResponse(HttpStatusCode.Unauthorized);
        actionContext.Response.Headers.Add("WWW-Authenticate", string.Format("Basic realm=\"{0}\"", host));
    }

}
```

This code relies on a customized BasicAuthenticationIdentity class that extends the standard GenericIdentity with a password:

<pre class="code"><span style="color: blue;">public class</span> <span style="color: rgb(43, 145, 175);">BasicAuthenticationIdentity</span> <span style="color: black;">:</span> <span style="color: rgb(43, 145, 175);">GenericIdentity</span> <span style="color: black;">{</span> <span style="color: blue;">public</span> <span style="color: black;">BasicAuthenticationIdentity(</span><span style="color: blue;">string</span> <span style="color: black;">name,</span> <span style="color: blue;">string</span> <span style="color: black;">password)
        :</span> <span style="color: blue;">base</span><span style="color: black;">(name,</span><span style="color: rgb(163, 21, 21);">"Basic"</span><span style="color: black;">)
    {</span> <span style="color: blue;">this</span><span style="color: black;">.Password = password;
    }</span> <span style="color: gray;">/// <summary>
    ///</span> <span style="color: green;">Basic Auth Password for custom authentication</span> <span style="color: gray;">/// </summary></span> <span style="color: blue;">public string</span> <span style="color: black;">Password {</span> <span style="color: blue;">get</span><span style="color: black;">;</span> <span style="color: blue;">set</span><span style="color: black;">; }
}</span></pre>

The implementation of the filter is pretty straight forward and handled in a few distinct steps:

*   Parsing credentials into a BasicAuthenticationIdentity if available
*   If no credentials were found Challenge for Authorization (401 Response)
*   If credentials were found authorize the user based on the credentials
*   Set the ThreadPrinicipal (or HttpContext.User) if credentials are valid

### Basic Auth is - basic

One of the reasons basic auth is often fallen back to is that it's - basic. It's very simple to implement because the data travelling over the wire is simply a user name and password encoded as a base64 string separated by a :.

**username:password**

The whole thing is then base64 encoded:

**dXNlcm5hbWU6cGFzc3dvcmQ=**

An inbound Authorization header from the client, that sends a username and password then looks like this:

**Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=**

Because it's so basic it's also fairly insecure. Remember in real world scenarios to use SSL with Basic Authentication accessed APIs to minimize exposure of the plain text username and password!

### Authorization

The ParseAuthorizationHeader() method in the filter then decomposes the Authorization header and reconstitutes username and password into a BasicAuthenticationIdentity which simply holds the username and password so that the Authorization process can determine whether that user and password combination is valid.

The filter contains a very simple OnAuthorize() method that can be overridden in a subclass. This method simply should return true or false and should implement any business logic necessary to determine whether the user is authorized or not. You can validate against a business object, or you could even validate against local or domain Windows accounts given that you have a username and password to work with.

The default implementation simply checks for presence of the Authorization header and returns true.

Here's an example of specialized BasicAuthenticationFilter that uses a business  object to validate the user:

```csharp
public class MyBasicAuthenticationFilter : BasicAuthenticationFilter
{

    public MyBasicAuthenticationFilter()
    { }

    public MyBasicAuthenticationFilter(bool active) : base(active)            
    { }


    protected override bool OnAuthorizeUser(string username, string password, HttpActionContext actionContext)
    {
        var userBus = new BusUser();

        var user = userBus.AuthenticateAndLoad(username, password);
        if (user == null)
            return false;

        return true;
    }
}
```

To use the filter now you can simply add the attribute to a controller you want to apply it to:

```csharp
[MyBasicAuthenticationFilter]
public class QueueController : ApiController
```

or you can globally apply it in the Web API configuration:

```csharp
GlobalConfiguration.Configuration.Filters.Add(new MyBasicAuthenticationFilter());
```

Additionally you can also apply the filter attribute on an individual method to either enable or disable the authentication functionality.

```csharp
[MarvelPressAuthorizationFilter(false)]
[GET("Queue")]
public IEnumerable<QueueMessageItem> GetRecentMessages(string type = null)
```

Generally I prefer the first approach, since in most of my apps I have at least one section where the authentication security doesn't apply. For this filter it probably doesn't matter, but if you're using something like token based security you might have a Login API that needs to be accessible without authentication. If you need to keep an individual method (like a Login method!) from firing authentication you can use the last approach and add an attribute with the active=false parameter.

This works pretty well, and it's all fully self contained. What's also nice about this simple implementation is that you have some control over where it is applied. It can be assigned to global filters to fire against every request or against individual controllers and even individual action methods. With a MessageHandler this is considerably more involved as you have to coordinate between a MessageHandler and a Filter to decide where to apply the message handler.

### Do we need a Message Handler?

Most other examples I looked at involved message handlers which are a bit more involved to set up and interact with. MessageHandlers in WebAPI are essentially pre-and post request filters that allow to manipulate the request on the way in the response on the way out. To effectively build an authentication message handler is a bit more work than the code I have above. MessageHandlers are also fully async so you have to deal with tasks (or async/await at least) in your code which adds some complexity.

An authentication message handler typically only would have to deal with checking for authentication information in the HTTP headers and if not there fire the challenge requests. Authorization is left to other mechanisms - like a filter. The handler then sets up a principal that can be checked later. The handler also has to check the response output to determine whether to challenge the client. So with a Message Handler implementation you'd have a two fold implementation: the message handler plus an AuthorizationFilter to validate the user.

For reference I also wrote [a blog post about a Basic Authentication MessageHandler](http://www.west-wind.com/weblog/posts/2013/Apr/30/A-WebAPI-Basic-Authentication-MessageHandler). It's a little more involved, but most of the code is similar, just a bit more scattered - you can check it out for yourself and take your pick from the two implementations.

I do think that if you are building a generic authentication mechanism that is universally usable, then a MessageHandler makes sense. You can combine multiple message handlers and authentication schemes for example.

But for simple use cases where you use a very application specific custom logon scheme - you are not going to care about other security implementations, so the filter actually makes sense because it keeps all the code for managing the authentication and authorization logically together.

This has been a nice and simple and self-contained solution that's easy to reuse and I've used it on a few projects now. I hope some of you find this useful as well.

### Resources

*   [**Full Source Code in GitHub Repository**](https://github.com/RickStrahl/WestwindToolkit/blob/master/Westwind.Web.WebApi/Filters/BasicAuthenticationFilter.cs)
*   **[MessageHandler Basic Authentication Implementation Post](http://www.west-wind.com/weblog/posts/2013/Apr/30/A-WebAPI-Basic-Authentication-MessageHandler)**
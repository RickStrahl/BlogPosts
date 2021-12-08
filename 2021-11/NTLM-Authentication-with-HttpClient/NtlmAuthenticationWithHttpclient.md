---
title: Windows Authentication with HttpClient
abstract: 'In this short post I review how to use HttpClient with Windows Authentication security using Negotiate or NTLM authentication schemes, which oddly is not documented in the official documentation for the `CredentialCache` class used to handle authentication header generation in HttpClient. '
categories: .NET
keywords: HttpClient, Windows Authentication, Negotiate, NTLM, .NET,C#
weblogName: West Wind Web Log
postId: 2829506
dontInferFeaturedImage: false
dontStripH1Header: false
postStatus: publish
featuredImageUrl: https://weblog.west-wind.com/images/2021/NTLM-Authentication-with-HttpClient/RedTrafficLight.jpg
permalink: https://weblog.west-wind.com/posts/2021/Nov/27/NTLM-Windows-Authentication-Authentication-with-HttpClient
postDate: 2021-11-27T10:26:30.5230894-10:00
---
# Windows Authentication with HttpClient

![](RedTrafficLight.jpg)

Ah yes this is a nostalgic post: The other day I needed to programmatically access a very old  application on one of my servers that's secured with Windows Authentication for its admin interface. Specifically I needed access to a real-time, admin process view that shows what's running on one of these old servers. This app never needed explicit authentication and back then Windows authentication was an easy way to secure the admin interface.

Oh, how the times have changed :smile:

## Windows Auth with HttpClient on .NET 6.0
On full .NET Framework `WebClient` and `HttpWebRequest` were built specifically for Windows, and as such had built in and front and center credential handling on the Web clients themselves. It's pretty obvious how to set up credentials and pass them with each request.

`HttpClient` which is the 'modern' HTTP interface for .NET, being cross-platform in a world where NTLM security and security using auto-processing of credentials is much less prevalent, doesn't make using Windows Authentication security very easy to discover. And it doesn't help that the documentation omits anything except `Basic` and `Digest`, while actually supporting `Negotiate` and `NTLM` as supported security mechanisms.

Without much ado, here's the self-contained code to run an `HttpClient` request against a Windows Authentication endpoint:

```csharp
// NTLM Secured URL
var uri = new Uri("https://localhost:5200/wconnect/ShowStatusJson.wc");

// Create a new Credential - note NTLM is not documented but works
var credentialsCache = new CredentialCache();
credentialsCache.Add( uri, "Negotiate", new NetworkCredential("rick", "superseektrit444"));

var handler = new HttpClientHandler() { Credentials = credentialsCache, PreAuthenticate = true };
var httpClient = new HttpClient(handler) { Timeout = new TimeSpan(0, 0, 10) };

var response = await httpClient.GetAsync(uri);

var result = await response.Content.ReadAsStringAsync();

Console.WriteLine(result);
```

The key item here is the `CredentialCache`, which is an collection of `NetworkCredential` objects to which you can add the Windows Authentication type of `Negotiate` or `NTLM`,  which oddly is [not documented](https://docs.microsoft.com/en-us/dotnet/api/system.net.credentialcache.add?view=net-6.0). `NetworkCredential` objects hold typical username and password based credentials like Windows Authentication, or Basic/Digest.

In addition to the `NetworkCredential` you need to pass a base or full URL to which the authentication is applied and an authentication type. 

For the **base Url** you typically will want to provide a base URL like `https://somesite.com/` rather than a full URL as in the example above, as the HttpClient may be shared for multiple requests to different URLs.

As far as I can tell, the supported **authentication types** are:

* Basic
* Digest
* NTLM
* Negotiate
* Kerberos

Note that `HttpClient` -like the older `WebClient` and `HttpWebRequest` - doesn't automatically `PreAuthenticate` auth requests, meaning that it needs to be challenged before sending credentials, even if you provide them in the credential cache. For the client that means that every request goes to the server first without credentials, gets the 401 challenge and then re-sends with the authentication headers, which generates extra traffic. For most client applications you probably want to set `PreAuthenticate = true` to force HttpClient to send the auth info immediately instead of first receiving the Http 401 from the server.

This code is simple enough and it works, but due to the missing documentation of the Windows Authentication options, not really obvious to find.

### Not so fast! Watch HttpClient Usage
The code above works fine for one off requests. The code I showed above is 'self-contained' in that it creates an HttpClient instance, runs the request and releases the instance.

But there's a problem with that code if you follow proper HttpClient usage advice which is:

> Use a single instance of HttpClient for all requests and reuse it for all requests.

Contrary to the semantics of the Http protocol HttpClient prefers to share a single HttpClient instance that holds some of the connection settings that can help with cached requests and... caching things like cookies and authentication headers.

This optimizes throughput and makes the most use of the open connections available for all shared requests. Shared use of `HttpClient` is good advice - as I've moved some old `HttpWebRequest` code to async `HttpClient` code using reused instances and performance improved significantly for similar high volume request code.

Shared instance use typically manifests in the way of using `IHttpClientFactory` via DI, or a single method that creates and then retrieves a cached HttpClient instance. In [West Wind WebSurge](https://websurge.west-wind.com) which is an Http Request and Load Testing tool that generically runs a lot of user specified Http Requests - potentially in parallel. 

I use the following factory style method to create my shared `HttpClient` instance:

```csharp
public HttpClient GetHttpClient(bool force = false)
{
    if (!force && _httpClient != null) return _httpClient;
    if (force) _httpClient?.Dispose();
    
    var socketsHandler = new SocketsHttpHandler
    {
        PooledConnectionLifetime = TimeSpan.FromSeconds(60),
        PooledConnectionIdleTimeout = TimeSpan.FromMinutes(1),
        MaxConnectionsPerServer = 100,
        UseCookies = Options.TrackPerSessionCookies,
    };
	
	// Set Credentials here
    CredentialCache cache = null;
    if (!string.IsNullOrEmpty(Options.Username) && !string.IsNullOrEmpty(Options.SiteBaseUrl))
    {
        cache = new CredentialCache();
        cache.Add( new Uri(Options.SiteBaseUrl), Options.UsernamePasswordType, new NetworkCredential(Options.Username, Options.Password));
    }
    if (cache != null)
        socketsHandler.Credentials = cache;

    if (!string.IsNullOrEmpty(wsApp.Configuration.ProxyUrl))
        socketsHandler.Proxy = new WebProxy(wsApp.Configuration.ProxyUrl);

    _httpClient = new HttpClient(socketsHandler);
    _httpClient.Timeout = TimeSpan.FromSeconds(Options.RequestTimeoutMs < 10 ? 10 : Options.RequestTimeoutMs);
    
    return _httpClient;
}
```

This works most of the time in WebSurge, because for load testing you typically stick to a single site and have a base URL for all tests configured in the first place. WebSurge internally builds a up a full URL from the user provided URL, Verb, headers etc. that's then used for each request.

But... requests are typically for a single site, **but not always**! Sometimes a session may include one or more URLs on a different site altogether and in that case the CredentialsCache is now no longer appropriate for this site.

The `CredentialsCache` is a collection, which is meant to address this as it allows you to add another set of credentials for a different site if necessary. But boy is that awkward if you don't know until the HTTP requests run what sites you might need credentials for. 

And it royally sucks that you can't override credentials on an individual request - it **has to be done** at the time the shared and reused HttpClient is created. Grrr.

In WebSurge I minimize this issue by forcing to recreate my shared instance before every test run (of many, many requests):

```cs
public void InitializeTestRun()
{
    GetHttpClient(true);  // force client to be recreated with current session settings

    CancelThreads = false;
    
    ...
    
    // now let the Load Test run
    List<HttpRequestData> result = null;
    await Task.Run(async () =>
    {
        await model.StressTester.RunSessions(model.Requests.ToList(), runOnce: false);
        result = Model.StressTester.RequestWriter.GetResults();
    });
}
```


All of this is probably less of an issue in a typical application that communicates with one server at a time, but if you do have multiple sites that require credentials, having to define each of the credentials up front before requests are even run... is awkward at best.

It is something to be aware of!

## Summary
Nothing particularly new and exciting here, other than pointing out a little non-obvious solution that has a 'documentation issue' with the missing docs for Windows Authentication security using the `Negotiate` or `NTLM` authentication schemes.

Leaving this here mainly for myself as a reminder to my future self...

## Resources

* [CredentialCache Documentation](https://docs.microsoft.com/en-us/dotnet/api/system.net.credentialcache.add?view=net-6.0)
* [NetworkCredential Documentation](https://docs.microsoft.com/en-us/dotnet/api/system.net.networkcredential?view=net-6.0)



<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
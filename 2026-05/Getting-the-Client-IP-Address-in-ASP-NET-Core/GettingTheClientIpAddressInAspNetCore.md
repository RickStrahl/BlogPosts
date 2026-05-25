---
title: Getting the Client IP Address in ASP.NET Core
abstract: When I need to pick up the client IP Address in ASP.NET Core I always forget where to find the connection information and/or forget about picking proxy forwarding instead of the actual IP address. To make things easy and reusable, here's a small HttpRequest extension method.
keywords: IP Address, Proxy, HttpRequest
categories: ASP.NET
weblogName: West Wind Weblog (BlazePost API)
postId: dkvnwxdbh42n
permalink: https://weblog.west-wind.com/posts/2026/May/13/Getting-the-Client-IP-Address-in-ASPNET-Core
featuredImageUrl: https://weblog.west-wind.com/images/2026/Getting-the-Client-IP-Address-in-ASP-NET-Core/ClientIpBanner.jpg
stripH1Header: true
postStatus: publish
postDate: 2026-05-13T13:35:12.0797363-07:00
---
# Getting the Client IP Address in ASP.NET Core

![Client Ip Banner](./ClientIpBanner.jpg)

##AD##

When I need to pick up the client IP Address in ASP.NET Core I always forget where to find the connection information. 

It's simple enough:

```cs
HttpContext?.Connection?.RemoteIpAddress
```

but I never remember to look on the context object as I expect it to be on the Request :smile:.

It's also useful to remember that if requests are proxied, we need to return the **forwarded IP address**, rather than the proxy's IP Address. Finally, in most cases you'd likely want the ipv4 address rather than an IPv6 address.

Here's ready to use helper extension method for the `HttpRequest` class that makes this more easily accessible:

```csharp
/// <summary>
/// Returns the client IPv4 Address for a request.
///
/// Checks proxy forwarding first, the actual ip
/// and returns null.
/// </summary>
/// <param name="request">The HttpRequest instance.</param>
/// <param name="checkForProxy">
/// Indicates whether to check for proxy headers.
/// 
/// Default returns the un-translated connection's IP Address
/// returned by the Web server.
///
/// When true, checks the Proxy forwarding headers 
/// `X-Forwarded-For`, `Forwarded` and `X-Real-IP`
/// in that order and returns the 1st valid IP address found.
/// </param>
/// <returns>IP Address or null</returns>
public static string GetClientIpAddress(this HttpRequest request, bool checkForProxy = false)
{
    if (request == null) return null;

    string ip = NormalizeIpAddress(request.HttpContext?.Connection?.RemoteIpAddress);
    if (!checkForProxy)
        return ip;

    string proxy = GetForwardedIpAddress(request.Headers["X-Forwarded-For"].FirstOrDefault());
    if (!string.IsNullOrEmpty(proxy))
        return proxy;

    proxy = GetForwardedIpAddress(request.Headers["Forwarded"].FirstOrDefault(), true);
    if (!string.IsNullOrEmpty(proxy))
        return proxy;

    proxy = GetForwardedIpAddress(request.Headers["X-Real-IP"].FirstOrDefault());
    return proxy ?? ip;
}


/// <summary>
/// Handle various forwarding headers and their custom parsing
/// of multiple proxy chain values
/// </summary>
/// <param name="headerValue">The value of the forwarding header.</param>
/// <param name="isForwardedHeader">Indicates if the header is the `Forwarded` header.</param>
/// <returns>The extracted IP address or null if none found.</returns>
private static string GetForwardedIpAddress(string headerValue, bool isForwardedHeader = false)
{
    if (string.IsNullOrWhiteSpace(headerValue))
        return null;

    foreach (var value in headerValue.Split(','))
    {
        string candidate = value?.Trim();
        if (string.IsNullOrWhiteSpace(candidate))
            continue;

        if (isForwardedHeader)
        {
            candidate = candidate.Split(';')
                .Select(segment => segment?.Trim())
                .FirstOrDefault(segment => segment != null && segment.StartsWith("for=", StringComparison.OrdinalIgnoreCase));

            if (string.IsNullOrWhiteSpace(candidate))
                continue;

            candidate = candidate.Substring(4).Trim();
        }

        candidate = candidate.Trim('"');

        if (candidate.StartsWith("[", StringComparison.Ordinal) && candidate.Contains("]", StringComparison.Ordinal))
            candidate = candidate.Substring(1, candidate.IndexOf(']') - 1);
        else if (candidate.Count(ch => ch == ':') == 1)
        {
            var parts = candidate.Split(':');
            if (parts.Length == 2 && IPAddress.TryParse(parts[0], out _))
                candidate = parts[0];
        }


        if (string.Equals(candidate, "unknown", StringComparison.OrdinalIgnoreCase))
            continue;

        if (IPAddress.TryParse(candidate, out var address))
            return NormalizeIpAddress(address);
    }

    return null;
}

/// <summary>
/// Return as IPv4 address if the address is an IPv4-mapped IPv6 address,
/// otherwise return the original address as a string.
/// </summary>
/// <param name="address"></param>
/// <returns></returns>
private static string NormalizeIpAddress(IPAddress address)
{
    if (address == null)
        return null;

    if (address.IsIPv4MappedToIPv6)
        address = address.MapToIPv4();

    return address.ToString();
}
```


The bulk of this code is related to the Proxy forwarding handling which is optional. If you know you're directly connected to the Internet, you can skip the proxy forwarding stuff - in fact it's a good idea to do this to avoid any spoofing from a client. The various forwarding headers provide multiple IP Addresses in the proxy chain and you essentially need to pick out the first IP address to get the original address. 

You can also find this as part of the `HttpRequestExtensions` class in the [`Westwind.AspNetCore` package here](https://github.com/RickStrahl/Westwind.AspNetCore/blob/f244102fcc3b9fbed5f0d736bd0bb9cd2cd57799/Westwind.AspNetCore/Extensions/HttpRequestExtensions.cs#L204) which provides a host of other small, but frequently used extensions.

## Alternative: Use the IP Forwarded Headers Middleware
<small>*thanks to @RichardD in the comments*</small>

If you know you are always running behind a proxy server, and you need the IP Address in all or most requests, you can run the Forwarded Headers Middleware which handles the above logic and simply populates the `HttpContext.Connection.RemoteIpAddress` making the process complete transparent. That certainly works, but depending on how you use IP Address might be overkill.

The middleware is configured like this in the service configuration during startup:

```cs
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardLimit = 2;
    options.KnownProxies.Add(IPAddress.Parse("127.0.10.1"));
    options.ForwardedForHeaderName = "X-Forwarded-For-My-Custom-Header-Name";
});

...

// near the very top of the middleware pipeline
// to ensure subsequent middleware pieces get the updated addresses
app.UseForwardedHeaders();
```

There's more info on the Microsoft site on [how the middleware works  here](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-10.0).

##AD##

### Summary
Nothing new here, but given how often I fumble around with this value, creating a wrapper and putting a reminder here for quick lookup seems worth the effort :smile:


## Resources

* [Westwind.AspNetCore on Github](https://github.com/RickStrahl/Westwind.AspNetCore)
* [Configure ASP.NET Core to work with proxy servers and load balancers](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-10.0)


<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
---
title: Getting the Client IP Address in ASP.NET Core
abstract: When I need to pick up the client IP Address in ASP.NET Core I always forget where to find the connection information and/or forget about picking proxy forwarding instead of the actual IP address. To make things easy and reusable, here's a small HttpRequest extension method.
keywords: IP Address, Proxy, HttpRequest
categories: ASP.NET
weblogName: West Wind Web Log
postId: 
stripH1Header: true
postStatus: publish
postDate: 2026-05-13T12:51:24.9206513-07:00
---
# Getting the Client IP Address in ASP.NET Core

When I need to pick up the client IP Address in ASP.NET Core I always forget where to find the connection information. 

It's also useful to remember that if requests are proxied we need to return the forwarded IP address, rather than the proxy's IP Address.

Good ready to use a small helper extension method for the `HttpRequest` class that makes this more easily accessible:

```csharp
/// <summary>
/// Returns the client IP Address for a request.
///
/// Checks proxy forwarding first, then the actual ip
/// and returns null if not available.
/// </summary>
/// <param name="context">HttpRequest instance</param>
/// <returns>
/// IP Address or null if not available. Note local IP
/// tends to get returned as IPv6 `::1` value.
/// </returns>
public static string GetClientIpAddress(this HttpRequest request)
{
    if (request == null) return null;

    return request.Headers["X-Forwarded-For"].FirstOrDefault() ??
           request.HttpContext?.Connection?.RemoteIpAddress?.ToString() ??
           null;
}
```

You can also find this as part of the `HttpRequestExtensions` class in the [`Westwind.AspNetCore` package here](https://github.com/RickStrahl/Westwind.AspNetCore/blob/da93cd30f5304d16af5ee7866e746064405ada3f/Westwind.AspNetCore/Extensions/HttpRequestExtensions.cs#L194) which provides a host of other small, but frequently used extensions.

### Summary
Nothing new here, but given how often I fumble for this value, creating this wrapper and putting a reminder here for quick lookup seems worth the effort :smile:


## Resources

* [Westwind.AspNetCore on Github](https://github.com/RickStrahl/Westwind.AspNetCore)
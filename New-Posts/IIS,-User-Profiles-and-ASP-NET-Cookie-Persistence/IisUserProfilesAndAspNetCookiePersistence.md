---
title: IIS, User Profiles and ASP.NET Cookie Persistence
abstract: 
keywords: 
categories: 
weblogName: West Wind Weblog (BlazePost API)
postId: 
stripH1Header: true
postStatus: publish
postDate: 2026-05-21T10:34:43.8845527-07:00
---
# IIS, User Profiles and ASP.NET Cookie Persistence

Last week I finally updated my blog and moved it to .NET 10 from the ancient WebForms based engine I built 20 years ago. The app is deployed onto a Windows server running IIS and I ran into a snag related to cookie authentication in ASP.NET. 

> And yeah, yeah people are going to hate on Windows and IIS - but I have my reasons mainly related to legacy requirements of several applications.

Actually the problem wasn't ASP.NET - it's doing what it was supposed to - but rather in how the cookie encryption is handled.

The problem showed up as a login issue where the cookies created after authentication wouldn't persist past an application restart. Browser restart is fine - ie. the cookie created was persisting just fine, but an application restart that occurs after a crash (unlikely) or more commonly a republish of the application.

## Encryption Keys
The app uses Cookie Authentication for the administration backend using a custom identity implementation which is very simple nowadays. Just for review:

In app startup:  

```csharp
services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.LoginPath = "/account/login";
        o.LogoutPath = "/account/logout";
        o.SlidingExpiration = true;
        o.ExpireTimeSpan = new TimeSpan(0, 12, 0, 0); // overridden by login 
        o.Cookie.Name = "ww_wl";
    });
```

and:

```csharp
// in this order!
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();
```


and then to log in the user in the account controller/endpoint:

```csharp
// `user` comes from Db
var identity = new ClaimsIdentity(CookieAuthenticationDefaults.AuthenticationScheme);
identity.AddClaim(new Claim("Fullname", user.Fullname));
identity.AddClaim(new Claim("Username", user.Username));
identity.AddClaim(new Claim("UserId", user.Id.ToString()));

if (user.IsAdmin)                
    identity.AddClaim(new Claim(ClaimTypes.Role,"Admin"));

// Set cookie and attach claims
await HttpContext.SignInAsync(
    CookieAuthenticationDefaults.AuthenticationScheme,
    new ClaimsPrincipal(identity), 
    new AuthenticationProperties
    {
        IsPersistent = true,
        ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7),
        AllowRefresh = true
    });
```

The idea is that in order to access the admin panel I have to log in, and then once I'm in the cookie persists and should persist across browser sessions and across application shutdowns.

And on the local machine for testing all is hunky dory.


## On Server: Not so much
I then ended up deploying the app and browser persistence is working, but cross app restart persistent forces a new login every time. Annoying!
 
So what gives?

Turns out I was looking in all the wrong places for the problem...

I have several applications that use the exact same cookie auth set up, and they works just fine with cookies persisting across restarts.

After checking and checking and re-checking everything and even pointing CoPilot at two projects and having it compare setups, there was no application level resolution on why this is happening.

Except, for a small offhand note in the chat log, that it might be related to the DataProtection API and the location where the Keys are stored.

## DataProtection APIs for Cookie Encryption
The cookies that ASP.NET writes are two-way encrypted and so the keys to read and write them have to be available when the cookie is created and then also when it is read and extracted.

It turns out that location is crucial. The location is configurable, but by default this location is stored in the User Profile. 

And guess what? For some unfathomable reason when I set up the IIS application pool on the server I managed to unset the default User Profile setting in the Application Pool configuration:

![Invalid Load User Profile Setting](./InvalidLoadUserProfileSetting.png)

The default value there is true, and by setting this to false - by accident - the encryption keys were not preserved across application restarts. 

### Enable the Load User Profile
The fix then was to reset the **Load User Profile** setting back to it's `True` default value.

### Explicitly provide DataProtection Folder Location
Another option if you don't want to load a User Profile: You can explicitly override those settings with a fixed location on the local machine (preferably outside of the Web site!)

```csharp
// Key storage for cookies - so cookies can persist
if (env.IsProduction())
{
    services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(env.ContentRootPath, "DataProtectionKeys")))
        .SetApplicationName("Weblog");
}
```

This creates a folder in the specified location with an XML file that contains the required key chain used for encryption using the DataProtection APIs.

There are additional options including persistence to the registry, AzureBlobStorage etc. but in my case those don't apply.

In the end I loaded the User Profile, because several other apps are already using it and for consistency across these apps.


With ASP.NET Core on IIS, the Data Protection system commonly persists keys to a location tied to the current Windows user profile when one is available. So when the app pool runs as Network Service and Load User Profile is True, the worker process gets a real profile-backed storage location, and the key ring survives process recycles.
When Load User Profile is False:
•	the process may not get a usable profile
•	Data Protection may fall back to a less stable/ephemeral key repository
•	after recycle, the new worker cannot read the old key ring
•	existing auth cookies can no longer be decrypted
In practical terms
Your auth cookie contains an encrypted ticket.
That ticket is encrypted with a Data Protection key.
After recycle:
•	if the same key ring is still available, cookie works
•	if not, cookie is unreadable and user is logged out
For Network Service
It is not that the cookie key is stored inside the cookie profile itself, but rather that the Data Protection key ring is typically persisted in a user-profile-based location for that identity when the profile is loaded.
So your conclusion is right:
•	Network Service + profile loaded => stable key storage
•	Network Service + no profile => no reliable persisted key ring
Short answer
Yes — effectively, the encryption keys are being persisted in a profile-backed location for the app pool identity, so enabling Load User Profile gives ASP.NET Core a place to keep and reload those keys across recycles.
If wanted, I can also give the exact default Data Protection persistence behavior order for IIS/Windows.

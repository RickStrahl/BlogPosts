---
title: Connection Failures with Microsoft.Data.SqlClient 4 and later
featuredImageUrl: https://weblog.west-wind.com/images/2021/Microsoft.Data.SqlClient-4-Connection-Failures/BrokenConnection.jpg
abstract: After a recent update to `Microsoft.Data.SqlClient` version `4.0.0.0` I ended up not being able to connect to any of my SQL Server databases. Turns out Microsoft has made some default settings changes in the updated provider and these settings are likely going to break connections.
keywords: Connection Failure,Sql Server,.NET
categories: .NET,Sql Server
weblogName: West Wind Web Log
postId: 2849288
permalink: https://weblog.west-wind.com/posts/2021/Dec/07/Connection-Failures-with-MicrosoftDataSqlClient-4-and-later
postDate: 2021-12-07T14:02:15.7854568-10:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
customFields:
  mt_githuburl:
    id: 
    key: mt_githuburl
    value: https://github.com/RickStrahl/BlogPosts/blob/master/2021-12/Microsoft.Data.SqlClient-4-Connection-Failures/MicrosoftDataSqlclient4ConnectionFailures.md
---
# Connection Failures with Microsoft.Data.SqlClient 4 and later

![](BrokenConnection.jpg)

So I just ran into an annoying issue while upgrading to the `Microsoft.Data.SqlClient` version `4.0.0`. I've been running version `3.0.1` and everything has been fine, but when I switched to `4.0.0` I started getting immediate connection failures.

![](ConnectionFailure.png)

Switch back to `3.0.1` everything's fine: Connections work as expected. Back to `4.0.0` and no go... immediate connection failures. What the heck happened in this upgrade?

After a bit of digging into my logs and actually stepping through the code, the full SqlClient Connection error I got is:

> A connection was successfully established with the server, but then an error occurred during the login process. (provider: SSL Provider, error: 0 - The certificate chain was issued by an authority that is not trusted.)

This gives a clue that this has something to do with security and certificates. Which is odd, because I'm not specifying any security on the connection...

## Encryption is now On by Default
It turns out that Microsoft has changed the connection defaults in `Microsoft.Data.SqlClient` in version `4.0.0` and it now sets the equivalent of `Encrypt=true` **by default**.

This means:

>  **If your database is not using encryption, any connection will now fail by default.**

Nice Microsoft! 

The reasoning behind this is the age old *'secure by default'* adage, and while I can see the point of that, I'd argue that a lot, if not most applications - including your typical local developer setup or even containerized applications - are not using encryption.  

Luckily the fix is pretty simple - once you know what the problem is - as you can just specify `Encrypt=False` on the connection string like this:

```text
server=.;database=LicenseManager;integrated security=True;Encrypt=False"
```

Et voila - now the connection works correctly again with `4.0.0.0`.

##AD##

## Le Sigh
Seriously this is a head scratcher. I get the secure by default thinking, but [setting up SQL Server for Encryption](https://docs.microsoft.com/en-us/sql/database-engine/configure-windows/enable-encrypted-connections-to-the-database-engine?view=sql-server-ver15) is not one of those features that you just enable flipping a configuration switch. You have to create and install a certificate and then propagate that certificate out to clients and configure SQL clients. In short, this is far from something that 'just works out of the box'. There's a bunch of set up that needs to happen for a server to run with encryption enabled and for a client to use the certificate the server is set up with.

So making this decidedly non-default behavior in the server, the default behavior in the client feels just very, very wrong. But what you're gonna do? 🤷

## Summary
Bottom line is that this was not on my list of things I wanted to track down today. If you're like me when you run into this and see SQL connections fail, you're probably not thinking of your SQL Connection string that has worked for the last 10 years no longer working for you because you changed a .NET Framework library. :smirk:

It took me a while of figuring out that the problem was the `Microsoft.Data.SqlClient` `4.0.0.0` package I had updated a few days ago and then that the **connection string** was at fault. In fact, it was a [Tweet](https://twitter.com/pomma89/status/1468340472976490497) that led me to [the solution](https://techcommunity.microsoft.com/t5/sql-server-blog/released-general-availability-of-microsoft-data-sqlclient-4-0/ba-p/2983346).

And hence this post: As I often do, I'm leaving this here as a note to self along with a blog title that's searchable, as I am almost certain to forget that `Encrypt=True` connection string flag in the future.

Hopefully this will help a few other souls to avoid the hour of back and forth I've wasted...

## Resources

* [Microsoft.Data.SqlClient 4.0 Release Notes](https://github.com/dotnet/SqlClient/blob/main/release-notes/4.0/4.0.0.md)
* [Microsoft.Data.SqlClient 4.0 Release Discussion](https://techcommunity.microsoft.com/t5/sql-server-blog/released-general-availability-of-microsoft-data-sqlclient-4-0/ba-p/2983346)

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a>
</div>
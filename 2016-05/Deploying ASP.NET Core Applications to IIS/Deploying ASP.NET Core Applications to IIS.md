# Deploying ASP.NET Core Applications to IIS
Although there's been a lot of focus of running ASP.NET Core on other platforms and using the Kestrel Web Server, IIS certainly still is an important part of the ASP.NET eco-system. Although ASP.NET Core includes a new high performance Web server in the form of **Kestrel**, Microsoft recommends that you don't expose Kestrel directly to the internet. Kestrel lacks features like SSL and internal process management, request routing and is not likely to aquire those features. Rather Kestrel is meant as a back end Web server with requests fronted by a Web front end like IIS or nGinx on Linux.

In the past, running ASP.NET Core on IIS was tricky, but with RC2 a stable version of the `aspNetCore` module has arrived that makes the process of hosting ASP.NET Core with IIS much easier than before.


### IIS's new Role with ASP.NET Core
As mentioned above with ASP.NET Core IIS is playing much less the role of a Web server than a front end router. IIS's role is primarily to handle port sharing, Web site and Virtual directory management, certificate serving, malicious request filtering, IP limiting and load balancing  etc. 

IIS also acts as a process manager to ensure that the Kestrel process - your application basically - stays up and running and if it crashes fires up a new one. IIS manages process shutdown, and overlapped restarts similar in the way that IIS currently manages AppDomains. 

Note that IIS itself does nothing with .NET - in fact when you configure a site for ASP.NET Core you should disable the .NET runtime in the Application Pool; there's no need to load up a .NET runtime. IIS merely receives the request on the IP Address that has been routed and forwards it immediately to Kestrel.

Rather than being a full featured Web server, IIS is taking on the role of a sophisticated router and application hosting service.

Note that you **can** directly use Kestrel as your Web server especially for development, similar in the way that you can use NodeJs as a server. But both Kestrel and Node are basic TCP/IP based services that are optimized to serve requests as fast as possible - IIS (or other front end service like nginx) merely provide the routing and protocol interface. 

IIS receives requests

### ASP.NET Core Apps are Console Apps
As a result of this the way ASP.NET Core application's run is a little different than we might be used to. Unlike an IIS application which runs as a DLL hosted application that has an entry point fired by the IIS HTTP Pipeline, ASP.NET Core uses Kestrel in a standalone Console application. There's an actual console application that is launched and is running for the duration while the Web server is running.

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>





<!-- Post Configuration -->
<!--
```xml
<abstract>
</abstract>
<categories>
</categories>
<keywords>
</keywords>
<weblog>
Rick Strahl's Weblog
</weblog>
```
-->
<!-- End Post Configuration -->

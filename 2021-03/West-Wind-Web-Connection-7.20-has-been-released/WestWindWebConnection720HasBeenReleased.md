---
title: West Wind Web Connection 7.20 has been released
abstract: Web Connection 7.20 is here. This is a maintenance release but it also features a number of new and updated features including support for Web Sockets, consolidated Administration UI, a new `OnRouting()` handler and a bunch of updates to core components.
categories: Web Connection
keywords: Release Notes, Web Connection, 7.20
weblogName: Web Connection Weblog
postId: 9166
dontInferFeaturedImage: false
dontStripH1Header: false
postStatus: publish
featuredImageUrl: https://webconnection.west-wind.com/docs/images/managementconsole/moduleadministrationpage.png
postDate: 2021-03-15T15:05:42.1091419-10:00
---
# West Wind Web Connection 7.20 has been released

![](https://webconnection.west-wind.com/images/webconnection_code_banner.png)

I've just released an update to [West Wind Web Connection.](https://webconnection.west-wind.com) Version 7.20 is a maintenance release that brings a handful of new features and fixes a few small issues. The changes in this release center around logging improvements with a new way to specify log formats and a new Request Viewer that makes it easier to examine requests while debugging applications.

This is a maintenance release with a few small fixes, as well a few new banner features that I'll describe in this post:

* Native Web Sockets Support
* Consolidated Administration UI
* `wwProcess::OnRouting()` Handler
* .NET (Core) 5.0 Support for Web Connection Web Server
* wwDotnetBridge .NET (Core) 5.0 Support
* JSON serialization and parsing Improvements

You can find the full change log here:

* [Web Connection 7.20 Change Log](https://west-wind.com/wconnect/weblog/ShowEntry.blog?id=9166)

Let's jump right in.

### [Web Socket Support](https://webconnection.west-wind.com/docs/_600118edc.htm)
Over the years there have been many requests to provide server push features in Web Connection and in this release I've added basic Web Socket handling support in Web Connection.

You can use this functionality in a hub and spoke model where the Web Connection server is the Hub and any number of Web Socket clients - Web Browsers or Desktop applications - can publish requests to all attached listeners. The idea behind sockets is that you have a server that can either directly push client messages to other users or for the server to send messages based on events that occur on the server. 

The key benefit is that the communication of Web Sockets allows for the server to push messages to the client. 

#### How does this work?
FoxPro and Web Connection can't directly handle Web Socket processing as these operations are highly asynchronous and handled in core Web server processing in the Web Connection module handlers. Rather than directly handling the sockets Web Connection intercepts incoming socket requests and forwards them to a Web Connection server as special HTTP requests that can be handled just like a regular Web Connection HTTP request. Web Socket requests use a specific message format that essentially wraps a message payload in a message wrapper that describes the recipients, the action and the actual data which is simply a string. The string can contain complex data in the form of serialized JSON.

Here's what messages look like:

```js
{
    // a routing action that allows the server or 
    // client to differentiate messages
    action: action,

    // actual message data as a string - can be JSON
    message: message,

    // GroupId for the current user
    groupId: groupId,
    
    // userId for the sending user
    userId: userId,

    // Recipient list - can be empty which goes to the 'default' empty group
    recipients: [
        { type: 'group', value: 'chatusers' }
        { type: 'allButUser', value: 'rstrahl' }
    ]
}
```

Web Connection provides both FoxPro and JavaScript helpers to create and broadcast these messages. In Web Connection this is handled via the `wwWebSocketMessage` class and on the client there's a `westwind-websockets.js` library that provides this functionality.

The idea is that the server has a few well known endpoints that allow for:

* Socket initialization (`__initializeSocket.wc`)
* Broadcasting a message (`__broadcastsocket.wc`)

InitalizeSocket is used by Web browsers to connect to the Web socket - this essentially connects the persistent Web socket and opens the socket connection. This happens on page load and while the page is active the WebSocket essentially stays open.

The connected client can then listen for incoming socket messages. Web Connection provides a small Chat sample application that allows users to send message to all other users. 

On the browser end this looks something like this.

```javascript
import {WebConnectionWebSocket} from '../scripts/web-connection-websocket.js'

// Create the Socket instance
var socket = new WebConnectionWebSocket();

// handle message object { action, message, groupId, userId } props
socket.onMessageHandler = (msg) => {
    // just for reference
    var action = message.action  // for routing
    var message = msg.message;   // string message
    var user = msg.userId;       // User that sent it
    var group = msg.groupId;     // Group that sent it
    
    // typically you can route on action
    if (action == "broadcastchatmessage") {
        var msg = message;   // plain text message
    }
    else if(action == "initialmessages") {
        var msgs = JSON.parse(message);   // JSON message:  array of messages
    }
    // recommend you 'route' any actions to separate methods to keep
    // this function from getting huge
}  
// events when sockets are connected and closed
socket.onOpenHandler =(ev) => {    // optional 
}
socket.onCloseHandler = (ev) => {  // optional 
}

var group = $("#group").val(); // from input field
var user = $("#user").val();   // from input field

// this actually creates the socket 
// pass group/user if you need to differentiate recipients
// if you broadcast to all this is not needed
socket.tryConnect(true, groupId, userId);
```

The code above connects the socket and allows to listen for incoming messages.

To send a message code like the following can be used:

```js
btnSend$.on("click",function(e) {
    var userName = userName$.val();
    var group = group$.val();    
    var message = send$.val();

    // create a broadcast message object - action and message are ctor parms
    var msg = socket.createBroadcastMessage("broadcastchatmessage", message );  
    msg.userId = userName;
    msg.groupId = group;
        
    // specified group(s) to send to - if empty (goes to 'empty' group)
    if (group)
        msg.addRecipient(group, 'group')
            
    socket.send(msg);
    send$.val('');
    send$.focus();    
});
```

`createBroadcastMessage` creates a message instance with the correct properties that you can then populate. Basically you set the `.message` and `.action` properties to specify what action (if any) the server should take and the actual message data.

It's also possible to send a message to a socket from a FoxPro application:

```foxpro
DO wwWebSockets
loSocket = CREATEOBJECT("wwWebSockets")
loSocket.cBaseUrl = "http://localhost:5200/"

loMsg = loSocket.GetMessageObject()
loMsg.action = "broadcastchatmessage"  
loMsg.userId = "RickFox"
loMsg.groupId = "Web Connection Chat 03-10-2021"
loMsg.Message = "Hello from FoxPro " + TIME()

loSocket.BroadcastMessage(loMsg)
```

This allows a FoxPro application to essentially post a message to a Web application. This can be a server application, or a desktop application. This is similar to the JavaScript code, but the FoxPro code can't listen to incoming messages.

How does this work? The FoxPro code to send actually **doesn't use Web Sockets** at all, but rather uses an HTTP endpoint on the Web Connection module (`__broadcastwebsocket.wc`) to send a socket request. The message that is sent is then routed in the exact same way as messages sent from a JavaScript socket client. This makes it very easy to use Web sockets at least on the send side from FoxPro code. In the future if there's enough interest we may add proper client side Web Socket support via .NET integration.

Finally, Web Socket requests send from clients - JavaScript or FoxPro or anything that uses the correct format and protocol - can be handled by the Web Connection server. As mentioned above these requests are routed into Web Connection as HTTP requests (the module creates a local HTTP request with the original payload acting like a Proxy forwarder).

These HTTP request fire a specific URL in the Web Connection server which intercepts it and routes it to an `OnWebSocket()` handler in the Process class. The request receives the incoming message on which the server can act. In the case of the Chat action, the server code basically takes the client message that was sent, parses it for embedded Markdown using the built-in `Markdown()` function, and then broadcasts the message back out to all connected clients in the group the user was using.

Here's what an OnWebSocket handler looks like:

```foxpro
FUNCTION OnWebSocket
************************************************************************
*  OnWebSocket
****************************************
***  Function: Fired when a Web Socket request comes in.
***    Assume: loMsg.Message, loMsg.UserId, loMsg.GroupId
***      Pass: loMsg             - Incoming (loMsg.Message) from Socket
***            loSocketBroadcast - Use to broadcast message to others
***    Return: nothing
************************************************************************
LPARAMETERS loSocket as wwWebSocketMessage
LOCAL lcMarkdown, loSocketMsg, loMsg

*** This is the Socket payload
loMsg = loSocket.oMessage

*** Use Action to route to different operations
DO CASE

CASE loMsg.action == "broadcastchatmessage"	
	*** Let's modify the incoming message and use it
	*** to broadcast. Inbound and outbound Socket Messages
	*** are identical so it's easiest to just modify original.
	*** Change: action to "broadcast" and message to new/updated value
	* loMsg.action = "broadcastchatmessage"   && we're sending to same action, but you can change it
	
	*** Parse incoming message as Markdown
	lcMarkdown = Markdown(loMsg.message)
	lcMarkdown = ALLTRIM(lcMarkdown) && RTRIM(LTRIM(lcMarkdown,0,"<p>"),"</p>")	
	loMsg.message = lcMarkdown
		
	*** Broadcast the message
	loSocket.BroadcastMessage(loMsg)   && lomsg
	
	*** Alternately create a new message from scratch and send
	* loSend = loSocket.CreateMessageObject()
	* loSend.Action = "broadcastchatmessage"
	* loSend.Message = "<p>New <b>Message</b></p>"
	* loSend.GroupIp = loMsg.Groupid
	* loSend.UserId = loMsg.UserId
	* loSend.AddRecipient("MyGroup","group")
	* loSocket.BroadcastMessage(loSend)   && lomsg
ENDCASE

ENDFUNC
*   OnWebSocket
```

> Web Connection can only have a single Web Socket handler per application at this time. You have to specify a specific scriptmap extension to which all Web Socket request are routed in the FoxPro server.


As you can see the code required to make Web Socket requests, and Web Socket handling in the browser, is not very complicated. There's very little code. The more complex bit is the conceptual ideas that are required in order to build two-way communication into applications. Web Sockets are highly asynchronous (ie. there's no confirmation of success or failure) and require separate messages for each direction of communication.

Finally a note of consideration: Web Sockets are stateful - you basically connect to a socket in a Web Page and the socket connection stays open. As such Web Sockets with huge numbers of users can cause significant load on servers so be aware of connection requirements. Don't overuse sockets when other messaging mechanisms are available. For example, sending data to the server is almost always easier and more efficiently handled by hitting an HTTP endpoint rather than using a Web Socket connection (unless the connection is already open).

I'll be curious to see how some of you might use this new technology integration. If you do end up using it, please leave a note on the message board.

### [Consolidated Administration Page: Administration.wc](https://webconnection.west-wind.com/docs/_sb4193pb9.htm)
Web Connection administration over the years has changed a bit and although I've tried to make things simpler it's been a long road to consolidate features and make them easy to administer through a single unified UI. This started in the 7.0 timeframe but it wasn't until this release that everything has been consolidated.

We now have a single `Administration.wc` page (it also still works with `ModuleAdministration.wc`) that contains all the administration links that previously were scattered on `Maintenance.wc` and `Admin.aspx`. The two pages have been feature merged and the actual interface has been cleaned up to more easily display the large number of settings that Web Connection exposes. Many settings can now also be set interactively, directly on the administration form.

![](https://webconnection.west-wind.com/docs/images/managementconsole/moduleadministrationpage.png)

#### Web Sockets
In this release there's a new section to show the status of Web Sockets whether they are enabled and which scriptmap is used to handle WebSocket requests.

#### Edit Configuration on Local Machine
The form now has an **Edit** button to allow you to edit the current configuration **if you are running the Web Connection server as the interactive user**. This means when using IIS Express or the Web Connection .NET Core Web Server you can immediately edit the configuration file. IIS likely will not work, unless you have the Application Pool set up to run as the INTERACTIVE user.

### [wwProcess :: OnRouting()](https://webconnection.west-wind.com/docs/_5up0uzzqp.htm)
This new method allows you dynamically inject custom route handling into a `wwProcess` class. Web Connection has its own default routing mechanism that routes requests based on method name or physical file matches. 

If you need to do something different you can now create your own custom route handler **without having to override the entire `RouteRequest()` method that handles the default routing.

The overridable wwProcess method looks like this:


```foxpro
************************************************************************
*  OnRouting
****************************************
***  Function: Method that can be used to override custom routing.
***    Return: .F. keep processing, 
***            .T. you've handled the full request  and have generated
***            a valid response.
************************************************************************
FUNCTION OnRouting(lcPhysical, lcScriptname, lcExtension)

* Totally bogus example
CASE lcScriptName = "bogusrequest.wc"
     Response.ContentType = "application/json"
     Response.Write([{ "bogus": true }])
     RETURN .T.   && I've handled the request

RETURN .F.
ENDFUNC
*   OnRouting
```

You're passed the physical path, script name and extension and based on that you can decide how to handle a request. You can also access the `Request` and `Response` objects here as you normally would.

The idea is that you look at the incoming URL - usually the scriptname - and determine whether you need to handle this request in this overload. If you do you process the request and generate standard output using the `Response` object - just like you would in a standard process method.

Some use cases for this might be for multi-tenant processing of host header based routes, or for running routes from a look up table rather than by method names or even for instantiation separate classes and routing to them instead of to the local class.

It's a specialty use case, but I've added this because I've run into several situations where I otherwise had to completely copy the `RouteRequest()` method to change one little thing. Using this overload I can just make my small behavior change without having to copy the entire base functionality.

### [Web Connection Web Server now uses .NET 5.0 (.NET Core 5.0)](https://webconnection.west-wind.com/docs/_5lw0ysxq9.htm)
If you haven't looked at the local Web Connection Web Server, it's a .NET Core based console application that ships with your Web Connection application and can be deployed with it. Assuming you have the appropriate .NET Core runtime installed you can use this server to run your application **on any machine** without any custom configuration. The server is setup by default to execute the Web application. This means you essentially have a portable Web application that you can just copy to a new machine and then run (as long as .NET Core is installed).

Here's the server running Web Connection requests:

![](https://webconnection.west-wind.com/docs/images/misc/webconnectionwebserver.png)

You can launch this server with:

```foxpro
launch("WebConnectionWebServer")   && or just "WC"
```

or if you're running it standalone externally you can just launch the EXE in the `\WebConnectionWebServer` folder of your project.

In this release the server runtime has been updated to .NET 5.0 (.NET Core 5.0 which has been renamed to just .NET 5.0). By switching to .NET 5.0 from .NET Core 3.1 the Web Connection Web Server has much improved startup performance and significantly faster page processing latency.

In the last release we also added a server hostable version of this runtime, which can run in IIS and also on a Linux server - using standard .NET Core hosting mechanisms. That won't help with FoxPro requiring Windows, but it does allow you to run the module part on different platformns and pass file processing data for a Windows machine running your Web Connection server to process. A number of people over the years have asked for this sort of functionality and it is actually available now (better late than never). Be curious to see if anybody actually decides to use it in this non-standard way. 

For IIS there's specific integration via the ASP.NET IIS Hosting Module, which allows .NET Core apps to run in process of IIS - much in the same way as classic ASP.NET ran in IIS. Performance of this mechanism is on par with classic ASP.NET but it's considerably less flexible in updating running components as the server needs to be shut down to swap any binaries.

The classic ASP.NET Handler and .NET Core middleware share the same codebase and so you can easily switch between the two. It's perfectly reasonable to use the .NET Core middleware for local development and deploy with classic ASP.NET on IIS for production or vice versa.

As far as versions go, going forward the Web Connection Server will always try to build to the latest release version of .NET Core to match what the currently latest SDK expects. .NET Core versions are forward compatible in the same versions and in most cases to the next major version so the current version - barring any major feature changes should also work in v6 which releases at the end of this year. The older 3.x version should also work on 5.x etc.

### wwDotnet Bridge .NET 5.0 Support
In this latest update wwDotnetBridge now supports accessing of .NET 5.0 components. The last couple of updates have supported .NET Core 3.1 but due to some underlying changes in the runtime in 5.0 the original runtime hosting code failed to load .NET 5.0. This latest update now properly supports .NET 5.0.

Incidentally the integration code has been updated to use more recent hosting APIs which should hopefully future proof the loader for a bit going forward. The .NET Core runtime loaders have changed on several occasions which has been extremely annoying. 

In this case the bug actually turned out to be a runtime switch (on the TLSModes specifically) that cause the wwDotnetBridge root object to fail loading. It was a very simple bug that was nigh impossible to debug as it happened in code before the runtime was properly hooked up to even debug the code. 

This is a good lesson in feature compatibility. .NET 5.0 actually supports running full framework code, which is essentially what we do with wwDotnetBridge. The wwDotnetBridge assemblies are written for full framework, but they actually work in .NET Core because they are only using mostly very low level semantics. 
  
At some point we probably need to re-target wwDotnetBridge as a .NET Standard component, but currently there are a few Windows specific features there that will cause problems. I leave that for another day.

In the meantime though - testing out functionality in various libraries, exercising a good chunk of the framework all works well. I actually set up running the Web Connection components using wwDotnetCoreBridge and that all worked without a hitch.

Still there's potential for code to not work if full framework code is executed resulting in runtime errors that compiled correctly on full framework but wouldn't on Core. The TLS settings are an example of that. Buyer beware. Luckily it's likely that if you're using wwDotnetCorebridge you are going to be calling .NET Core APIs so that should be safe and behave as expected.

### JSON Improvements
There have been a few JSON fixes that related to number precision errors due to floating point calculation differences in FoxPro and JavaScript. Specifically JavaScript numeric values with decimals would in some situations round incorrectly. Numbers are now rounded to the `SET DECIMAL` setting which ensures the values are using the system defaults correctly rather than just free form picking a decimal scope.

Additionally there have been updates to the free standing JsonSerialize() and JsonDeserialize() methods which are shortcut wrappers around the full object instantiation.

### Summary
Phew. Quite a bit of functionality in this update. There are no breaking changes in this release except for the change to .NET 5.0 runtime for the Web Connection Web Server for local development. 

I hope some of these features are useful to you.  As always if you have any comments or questions regarding these features please post a message on the [message board](https://support.west-wind.com).

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
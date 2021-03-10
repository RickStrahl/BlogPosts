---
title: Playing around with Web Sockets for Web Connection
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2021-02-24T13:22:27.2398701-10:00
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Playing around with Web Sockets for Web Connection

WebSockets are a useful tool for real time messaging and *Server Push* operations that let you notify a browser from the server. Unlike 'normal' HTTP request which are from browser or Desktop HTTP client to server, WebSockets allow for two-way communication. You can send messages to a socket from a client, but the server can also send a message back to the client.

Real-time messaging where you can type a message on one browser, and see the send result displayed on all connected browsers or clients. Other situations where this is useful is for having the server notify a client that some important event has occurred - somebody writes an invoice in one part of the application, and a server notification is sent out to a user that the invoice is ready for processing. Web Sockets make that possible without polling the server.

### Web Connection and WebSockets
WebSockets are a now browser native feature for most recent Web Browsers and Web Servers. IIS 10 (Windows 10 and Server 2016) 
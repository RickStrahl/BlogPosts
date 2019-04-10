---
title: Creating a custom HttpInterceptor to handle 'withCredentials' in Angular 6+
abstract: Client HTTP requests often need to set a few common settings and you don't want to set them on every request. To make this process easier Angular provides an HttpInterceptor class that you can subclass and add custom behavior to for each HTTP request that is sent through the HttpClient. Here's a quick review on how to do this.
keywords: Angular, HttpInterceptor, WithCredentials, Cookies
categories: Angular
weblogName: West Wind Web Log
postId: 1215446
permalink: https://weblog.west-wind.com/posts/2019/Apr/07/Creating-a-custom-HttpInterceptor-to-handle-withCredentials
postDate: 2019-04-07T23:59:11.0183756-10:00
customFields:
  mt_githuburl:
    key: mt_githuburl
    value: https://github.com/RickStrahl/BlogPosts/blob/master/2019-04/Creating-a-custom-HttpInterceptor-to-handle-withCredentials/CreatingACustomHttpinterceptorToHandleWithcredentials.md
---
# Creating a custom HttpInterceptor to handle 'withCredentials' in Angular 6+

![](intercept.jpg)

Been back at doing some Angular stuff after a long hiatus and I'm writing up a few issues that I ran into while updating some older projects over the last couple of days. I'm writing down the resolutions for my own future reference in a few short posts. 

For this post, I needed to **create and hook up a custom HttpInterceptor in Angular 6**. There's lots of information from previous versions of Angular, but with the new HTTP subsystem in Angular 6, things changed once again so things work a little bit differently and that was one of the things that broke authentication in my application.

##AD##

### Use Case
In my use case I have a simple SPA application that relies **on server side Cookie authentication**. Basically the application calls a server side login screen which authenticates the user and sets a standard HTTP cookie. That cookie is passed down to the client and should be pushed back up to the server with each request.

### WithCredentials - No Cookies for You!
This used to just work, but with added security functionality in newer browsers plus various frameworks clamping down on their security settings, XHR requests in Angular by default **do not pass cookie information with each request**. What this means is by default Angular doesn't pass Cookies captured on previous requests back to the server which effectively logs out the user.

In order for that to work the HttpClient has to set the `withCredentials` option.

```ts
return this.httpClient.get<Album[]>(this.config.urls.url("albums"),{ withCredentials: true })
                    .pipe(
                        map(albumList => this.albumList = albumList),
                        catchError( new ErrorInfo().parseObservableResponseError)
                    );
```

It's simple enough to do, but... it's a bit messy and more importantly, **it's easy to forget to add the header explicitly**. And once you forget it in one place the cookie isn't passed, and subsequent requests then don't get it back. In most application that use authentication this way - or even when using bearer tokens - you need to essentially pass the cookie or token on every request and adding it to each and every HTTP request is not very maintainable.

> #### @icon-info-circle CORS - Allow-Origin-With-Credentials
> In addition to the client side `withCredentials` header, if you are going cross domain also make sure that the `Allow-Origin-With-Credentials` header is set on the server. If this header is not set the client side `withCredentials` also has no effect on cross-domain calls causing cookies and auth headers to not be sent.

### HttpInterceptor to intercept every Requests
To help with this problem, Angular has the concept of an HttpInterceptor that you can register and that can then intercept every request and inject custom headers or tokens and other request information.

There are two things that need to be done:

* Create the HttpInterceptor class
* Hook it up in the AppModule as a Provider configuration

### Creating an HttpInterceptor
Creating the Interceptor involves subclassing the HttpInterceptor class so I create a custom class `HttpRequestInterceptor.ts`:

```ts
import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest
} from '@angular/common/http';

import { Observable } from 'rxjs';

/** Inject With Credentials into the request */
@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {
    
      // console.log("interceptor: " + req.url);
      req = req.clone({
        withCredentials: true
      });
      
      return next.handle(req);
  }
}
```

This is some nasty code if you had to remember it from scratch, but luckily most of this boilerplate code comes from [the Angular docs](https://angular.io/guide/http#intercepting-requests-and-responses). What we want here is to the set the request's `withCredentials` property, but that property happens to be `read-only` so you can't change it directly. Instead you have to explicitly **clone the request object**  and explicitly apply the `withCredentials` property in the clone operation.

Nasty - all of that, but it works.

##AD##

### Hooking up the Interceptor
To hook up the interceptor open up `app.module.ts` and assign the interceptor to the `providers`  section.

Make sure to import the `HTTP_INTERCEPTORS` at the top:

```
import {HttpClientModule, HTTP_INTERCEPTORS} from '@angular/common/http';   // use this
```

and then add the interceptor(s) to the providers section:

```ts
providers: [            
    // Http Interceptor(s) -  adds with Client Credentials
    [
        { provide: HTTP_INTERCEPTORS, useClass: HttpRequestInterceptor, multi: true }
    ],
],
```

### Summary
Customizing every HTTP request is almost a requirement for every client side application that deals with any kind of authentication. Nobody wants to send the same headers or config info on every request, and if later on it turns out there are additional items that need to be sent you get to scour your app and try to find each place the `HttpClient` is used which is not cool. 
 
Creating one or more interceptors is useful for handling and creating standardized requests that fire on every request. In this example I added additional headers to every request, but you can potentially look at each url and decide what needs to be handled. The control is there as one or multiple central interception points to HTTP requests.

In the end this is relatively easy to hook up, but man is this some ugly, ugly code and good luck trying to remember the class salad - or even finding it. That's why I'm writing this up if for nothing else than my own sanity so i can find it next time. Maybe it's useful to some of you as well.

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>
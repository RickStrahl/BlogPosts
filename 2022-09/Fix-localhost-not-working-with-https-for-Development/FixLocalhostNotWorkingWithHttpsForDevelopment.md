---
title: Work around localhost unsecured HTTPS access for Development Sites in Edge
abstract: 
keywords: 
categories: 
weblogName: Web Connection Weblog
postId: 
postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Work around localhost unsecured https access for Development Sites in Edge

![](EdgeConnectionNotPrivate.png)

[Microsoft Edge](https://www.microsoft.com/en-us/edge) in recent versions has gotten really annoying when it comes to accessing local Dev sites for development. The problem appears to be that Edge automatically forces `http://` requests to `https://` and then doesn't allow bypassing an invalid local dev certificate as other Chromium browsers allow you to do (and Edge used to).

Depending on what development tools you use this may or may not be a problem. If you're using .NET Server development you can easily set up local development certificates and install them via the  `dotnet dev-certs https import` command. Once installed `https://` connections just work locally using the Kestrel Web server. Unfortunately other tools are not so complete.

I've been working with a Vue application lately and have been muddling through the lack of a valid  certificate - partly because I've been too lazy to figure out how to install a certificate. I've been using one of the hacks described below to get around the limitations in Edge.

This post describes some of the issues with the requirements that Edge has for using `https://` on localhost and for working with `https://` requests if you don't have certificate installs and that cannot be easily just ignored in Edge.

## Localhost HTTPS Hell in Edge
There are a couple of problems with Edge's handling of the Vue server:

* Doesn't allow to override an Invalid Certificate
* Doesn't allow access to a plain `http://localhost` URL

##AD##

### No way to Escape from Invalid HTTPS Certificate on Localhost
So my scenario is that I'm working on a local Vue application and when I launch the local Vite server I see this on `localhost`:

![](ViteServerAndEdge.png)

Note that I'm using:

```ps
vite --https
```

Now I don't really need to run in `https://` but Edge (and Chromium browsers in general) now automatically redirect to `https://` - even on localhost. So essentially `--https` is essentially required (more on that in a moment).

So, in effect I need to run the server using `https://` but I don't have a certificate and the screen above is what I get in Edge. Now I'm fully aware **that there should be a security error** since there's no certificate present, but in the past **you were able to bypass this error** via an advanced options link that explicitly asked, if I'm sure I want to take life in my own hands :smile: : 

**Yes, damn it! I like to live on the Edge. But Edge won't let me actually live on the Edge  (ironic don't you think? :stuck_out_tongue_winking_eye:)** - at least not with `localhost`. 

The `https://` certificate behavior on localhost seems to be specific to Edge, as using [Brave](https://brave.com/) (another Chromium based browser) I can bypass the invalid certificate via the Advanced options override link. With Brave I can get to `https://localhost:3000` without a valid certificate:

![](BraveHttpsByPass.png)

Not so in Edge!

### localhost `http://' links get forced to `https://`
So you might think - screw all this `https://` bullshit, lets just use plain old `http://`. You Heathen you! `http://` is so frowned upon these days.

So for the Vite server if I don't use the `--https` flag, and serve plain `http://` content, I have another problem: Going to `http://localhost:3000` Edge immediately redirects me to `https://localhost:3000` and then fails with a protocol error:

![](EdgeHttpsAutoRedirect.png)

The error makes sense at the `https://` link - the server is not serving `https://` but Edge insist on going there, so there's no response from port 443. Boom!

But the point is by default you really can't use `http://localhost` anymore as Chromium now always redirects to https. **Edge doesn't let me go to the actual URL that I put into the address bar and forces the redirect** to `https://`. 

**Heads you lose, tails you lose!**

The redirect behavior seems to be common to all Chromium Browsers now (FireFox also) so I think that's something we have to live with (but... why? why? why?).

## Hackity Hack
So, with Edge out of box I basically can't run this Vue application. There are a few things that can be done of course, but you really have to ask yourself why is all this necessary **on localhost**?

### Edge: Use an explicit local IP Address
Oddly it appears that Edge **does allow** other URLs than `localhost` to override an invalid certificate. If I run `vite --https --host 0.0.0.0` which allows me to connect to the local IP address, I can then bypass the HTTPS certificate:

![](EdgeLocalIpAddress.png)

So that's one way around this problem: Using `http://192.168.50.240:3000` lets me get past the invalid HTTP certificate. 

That makes perfect fucking sense, doesn't it? `localhost` - nope, `192.168.50.240` - yep. Go figure!

### `thisisunsafe` Security ByPass Hack
This is a weird one: If you get a security dialog that you cannot bypass like the one above for `localhost` and `https://` access with a certificate error in Edge, you can type `thisisunsafe` anywhere in the active browser window's Viewport.

If I do this I get through and now get the page to display with the broken `https://localhost:3000` link in the address bar (ie. same behavior as with the dedicated IP Address):

![](EdgeThisIsInsecure.png)

Once you've done this the security setting is cached for some time so repeated restarts of the browser continue to bring up the page without the warning page.

It works, but man, that is one hell of a hack!

##AD##

### Vue/Vite Specific: Use `vite-plugin-mkcert`
The next solution is probably the appropriate one to use, at least for a Vue/Vite based environment, which is to actually create a local certificate and properly get it registered.

There are lots of ways to do this, and you may already have a valid certificate on your machine for IIS Express or for the ASP.NET Dev server that you could export and make available to the server. Not exactly simple especially if like me you're not very certificate-management-savvy.

Another, easier option for Vite specifically is a plug-in called `vite-plugin-mkcert` which creates and automatically installs a local dev certificate  for `localhost`.

```ps
npm i vite-plugin-makecert -d
```

Then add the plugin config to the `vite.config` file:

```js
import {fileURLToPath, URL} from 'url'

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

// *** THIS
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // *** THIS
    mkcert()
  ],
  server: { https: true },  // *** THIS or use --https on the command line
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  }
})
```

With the installed certificate, I now get a clean `https://` Url in the browser, regardless which browser I use. Here's Edge:

![](CleanHttpsEdge.png)

This solution is Vite specific, but there are similar plug-ins for other dev pipelines like the Angular CLI etc.

### Another Option: LetsEncrypt and a local Web exposed domain name
In the past I've solved this problem with a pass through local IP Address on my router, by passing through port 443 and routing it to my local DCHP IP address. I keep track of the ISP IP Address (which these days very rarely changes) and then once DNS mapped, create a LetsEncrypt certificate for the domain.

This is a bit of work, but is actually quite useful for quite a few different scenarios including easier testing with mobile devices which can then use a simple DNS name to find the local server without explicitly entering IP Addresses through a phone DNS entry app.

Regardless this is not a quick setup and requires some upkeep if IP addresses change. For bonus points you can also use a dynamic DNS service that can track your local IP Address as it changes.

## Summary
So in summary Edge is being relentlessly **Edgy** with `https://` requests on localhost, more so than other Chromium browsers. The two problems are:

* Always redirecting to `http://` links `https://`
* Not allowing to bypass `https://` certificate errors on localhost

The former doesn't really have  solution that I could find that doesn't involve incessant browser security warnings. 

The latter has a few work arounds discussed in this post.

Here's a summary of the work arounds:

1. Use a different Chromium browser for `localhost` and bypass `https://` warning
2. Use a local fixed IP address in Edge (ie. `192.168.xxx.xxx`) and bypass `https://` warning
3. Use `thisisunsafe` trick (type into browser) and bypass `https://` warning
4. Create a self-signed certificate for localhost and register with your server
5. Map localhost to a Web accessible domain and install a LetsEncrypt Certificate
6. Use a tooling plug-in to create and install a local self-signed cert (ie. `vite-plugin-mkcert`)

For me #6 was ultimately the cleanest, which works for the application I'm working on, but it's a specific solution to the Vue project I'm working on at the moment.

I've used #5 on quite a few occasions and that works well too if you can map a local IP or use dynamic DNS of some sort.

None of these solutions are great or easy to discover or even mentioned. It takes some digging to find the workarounds or an obscure post such as this.

But hey, at least there are workarounds at least... with house of cards Web tech these days that's better than other problems...

<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
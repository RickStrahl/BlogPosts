---
title: Using Live Reload in West Wind Web Connection
weblogName: West Wind Web Log
postDate: 2019-05-23T13:19:40.2460127-10:00
---
# Using Live Reload in West Wind Web Connection



### The Run, Crash, Fix, Restart Cycle is Long
The idea behind Live Reload is very simple - while you're developing your application you often make a lot of very small, incremental changes especially in HTML and CSS, and if you're working with client side applications also in JavaScript. You are probably also making small code changes frequently to fix a bug you might have introduced.
  
Traditionally that process involves a long cycle of operations. For source code changes in the Web Connection Server:

* Open the browser
* Navigate to a page

Then the Actual 'debug' steps:

* Fail on some error
* Switch to FoxPro
* Cancel the application and Clear Memory
* Open the editor
* Make the change
* Save
* Go back to the Command Window
* Start the Application
* Go back to the browser
* Refresh the page

**That's a lot of steps!** 

It's a little bit better if you're changing Web code for HTML, CSS, JavaScript or Web Connection Script Pages. It's better because these items do not require stopping and restarting of the server.

* Fail on some error
* Open the editor
* Make the change
* Save
* Go back to the browser
* Refresh the page

That's better but still you have to switch back to the browser and refresh.

### Live Reload Reduces time to Fix
Live reload can significantly cut this cycle by essentially taking various context switches - restarting your FoxPro application and refreshing the browser - out of that process.

Live Reload works by monitoring for file changes and when a file changes automatically triggers a reload of the browser and - in the case of server code also a reload of the FoxPro Web Connection application. 

So when you're working wiht Live Reload you basically make a code change, and **immediately see the code change applied** on the Web Page that you were on without having to manually restart the application or refresh the browser. 

Essentially you can leave your editor(s) and a browser window sitting side by side and as you make changes you can see the browser immediately reflect that change.

> **Live Reload is like WYSIWYG on steroids**

### Live Reload in Web Connection








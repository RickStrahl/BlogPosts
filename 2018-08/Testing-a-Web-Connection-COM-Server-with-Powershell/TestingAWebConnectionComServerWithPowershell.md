---
title: Testing a Web Connection COM Server with FoxPro or PowerShell
abstract: If you run into problems with a Web Connection COM Server one of the first things you need to do is ensure that the server is properly registered and working on the Windows installation. In this post I look at using both Visual FoxPro and PowerShell to load and test to see whether a Web Connection server is installed and able to return a result.
keywords: PowerShell,Web Connection
categories: Web Connection,Windows
weblogName: Web Connection Weblog
postId: 941
postDate: 2018-08-15T20:04:44.6612968-07:00
---
# Testing a Web Connection COM Server with FoxPro or PowerShell

![](powershell.png)

This is a quick tip to a question that comes up frequently when testing runtime installations:

> How can I quickly test whether my COM server is properly installed and working on a live server where I don't have the full Visual FoxPro IDE installed?

If you recall when you install Web Connection on a live server the preferred mode of operation is by using **COM Mode** where Web Connection servers are running as COM objects. If you ever run into a problem with a COM server not loading the first thing you want to do is check whether the COM server can be loaded outside of Web Connection either using a dedicated FoxPro IDE installation or if you only have the FoxPro Runtimes available using PowerShell.

### Registering your COM Server
The first step for COM servers on a new server is that that they have to be registered in the Windows Registry. When you build during development Visual FoxPro automaqtically registers the COM server during build, but on a live server install you manually have to install the server.

Assuming you have an EXE server called **MyApp**, you can register your server using the following from a Command or PowerShell prompt **running as an Administrator**:

```
MyApp.exe /regserver
```

COM registration requires Admin access because the registration data is written into the `HKEY_LOCAL_MACHINE` key in the registry which is writable only as an Admin user. On a server this usually isn't an issue as you typically are logged on as as an Admin user, but on a local dev machine you typically need to start Command or PowerShell with **Run As Administrator**.

> #### @icon-warning The `/regserver` Switch produces no Output
> One problem with the `/regserver` switch is that it gives absolutely no feedback. You run it on your EXE and it looks like nothing happened regardless of whether it succeeded or failed. No output, no dialog - nothing.

### COM Registration is Automatic with Web Connection Configuration Tooling
Note that if you're using the new Web Connection self-configuration tooling for applications using `YourServer_Config.prg` or `Youserver.exe CONFIG`, the COM registration is automatically run for you, so you don't have to manually register the server.

The naming of the server by default will be `MyApp.MyAppServer` - the naming is based on the project name plus the `OLEPUBLIC` server class name which is auto-generated when the project is created. Keep in mind that if you change names, of the project or class the COM server name will also change, which can break existing installations.

When it's all said and done you should have a COM server registered as `MyApp.MyAppServer`.

> #### @icon-info-circle Re-Register COM Servers when the Server Interface Changes
> Note that COM server registration is always required on first installation, but also when you make changes to the public COM interface of the server. COM registration writes ClassIds, ProgIds and Type library information into the registry and if the COM interface changes these ids often change along with the interface signatures. So remember to re-register your servers whenever properties or methods on the Server class are added or changed.

### Testing the Server
So, to test the server and see if it's actually working, you can do the following using FoxPro code:

```foxpro
loServer = CREATEOBJECT("MyApp.MyAppServer")
? loServer.ProcessHit("")   && produces an error HTML page if it works
```

This produces an error page with a **404 Not Found** header because no path was passed. This is usually all you need to check whether the server can load and run. It's easy to run and remember.

If you want to see a **real response** from the server you can instead specify a **physical path** to the request. For example, to test the Web Connection sample server I can do:

```foxpro
loServer = CREATEOBJECT("wcDemo.wcDemoServer")
? loServer.ProcessHit("&PHYSICAL_PATH=c:\wconnect\web\wconnect\testpage.wwd")
loServer = null
```

which should produce the output of the testpage.

Note it'll depend on the URL you hit whether additional parameters like query strings, form variables or other URL parts are required, but if you fire a simple GET request it should typically work.

### No FoxPro Installation? Use PowerShell
On a live server however you often don't have the FoxPro IDE installed, so if you want to test a COM server you can't use FoxPro code. However, Windows Powershell can instantiate COM objects (and also .NET objects) and so we can use a powershell script to test the server.

```ps
$server =  new-object -comObject 'yourProject.yourProjectServer'
$server.ProcessHit("")
```

This should produce an HTML error page with an HTTP 404 response header that says page not found.

If you want to test a 'real' request, you can provide a **physical path** - here again using the Web Connection sample server as an example:

```ps
$server =  new-object -comObject 'wcDemo.wcDemoMain'
$server.ProcessHit("&PHYSICAL_PATH=c:\wconnect\web\wconnect\testpage.wwd")

# release the server (optional)
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($server) | Out-Null
```

Note the rather nasty syntax to release a COM server from memory. Alternately you can shut down the PowerShell session to release the object as well.

### Summary
Testing COM objects on an installed server is something that is often needed if you are troubleshooting an installation. A FoxPro installation is easiest, but if you only have a runtime install the PowerShell option is a good and built-in alternative.
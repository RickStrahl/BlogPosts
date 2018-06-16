---
title: IIS Server Authentication and Loopback Restrictions
abstract: If you've ever run into a problem on a Windows Server and weren't able to run a local browser and try to log in using your local network Windows credentials you might have found out the long way that your credentials are not working by default. Recently Windows 10 also seems to have enabled this policy and I noticed local Windows account log ins not working. This comes from a local Loopback access policy. In this post I describe what fails and how you can work around it both for Web Connection applications and manually.
keywords: Loopback,Authentication,Fail,IIS,Local Machine
categories: Web Connection,Security
weblogName: Web Connection Weblog
postId: 939
postDate: 2018-06-14T19:26:51.5886187-07:00
---
# IIS Local Machine Authentication and Loopback Restrictions

![](loopback.jpg)

Here's a common problem I hear from user installing Web Connection and trying to test their servers from the same live server machine:

*When logged into your Windows server, IIS Windows authentication through a browser does not work for either Windows Auth or Basic Auth using Windows user accounts. Login attempts just fail with a 401 error.*

*However, accessing the same site externally and logging in works just fine, using Windows log on credentials. It only fails when on the local machine.*

### Loopback Protection on Windows Server
In the past these issues only affected servers, but today I just noticed that on my local Windows install with Windows 10 1803 I also wasn't able to log in with Windows Authentication locally. As if it isn't hard enough to figure out which user id you need on Windows between live account and local account, I simply was unable to log in with **any** bloody credentials.

Servers have always had this 'feature' enabled by default to prevent local access attacks on the server (not quite sure what this prevents since you have to log in anyway, but whatever).

When attempting to authenticate on a local Web site using a Windows account using username and password always fails when this policy is enabled. For Web Connection this specifically affects the admin pages that rely on Windows authentication for access.

This problem is caused by a policy called **Loopback Protection** that is enabled on server OSs by default. Loopback Protection disables authenticating against local Windows accounts through HTTP and a Web browser.

For more info please see this Microsoft KB entry:  
<a href="https://support.microsoft.com/en-us/kb/896861" target="top">https://support.microsoft.com/en-us/kb/896861</a>

### Quick Fix: Disable Loopback Check
The work around is a registry hack that disables this policy explicitly.

Starting with Web Connection 6.21 and later you can run the following using the Console running as an Administrator:

```
c:\> console.exe disableloopbackcheck
```

To reverse the setting:

```
c:\> console.exe disableloopbackcheck off
```

To perform this configuration manually find this key in the registry on the server:

`HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Lsa`

and edit or add a new key:

`DisableLoopbackCheck` (DWORD)

then sent the value to `1` to disable the loopback check (local authentication works), or to `0 ` (local authentication is not allowed).

### Summary
Web Connection 6.21 isn't here yet as of the time of writing of this post, but in the meantime you can just use the registry hack to work around the issue.
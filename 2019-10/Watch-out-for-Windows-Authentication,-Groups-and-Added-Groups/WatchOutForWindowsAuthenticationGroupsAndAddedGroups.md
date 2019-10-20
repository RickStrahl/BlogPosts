---
title: Watch out for Windows Authentication, Groups and Added Groups
weblogName: West Wind Web Log
postDate: 2019-10-13T18:13:41.8282711-10:00
---
# Watch out for Windows Authentication, Groups and Added Groups

I've been struggling with a strange problem in an application that's using Windows Authentication against Active Directory domains. The application picks up the Windows user credentials including the Windows groups the user is a part of as part of the Windows Identity claims available in the `WindowsIdentity` object.

Ok - figured it out. Turns out it's sort of Operator Error, but related to the way Windows logons are apparently handled.

The issue is that I created **new groups** in Windows and then tried to use these groups in the application. These days, I don't reboot or log out of Windows very much so even though this discussion has dragged on for a week and more, I **never logged out**.

Apparently when you do Auto-Logon, Windows picks up a cached token of the user **when the logon occurred**. IOW, it looks like it shows only the groups that were present when I logged in. When logging in explicitly it refreshes credentials completely rather than re-using the cached credential.

When I finally decided to reboot my machine, the automatic login started returning the missing groups just fine. I verified if I add additional groups after the logon, they don't show up until I either log out or reboot.

This might be worthwhile to document in relation to groups with Windows Authentication.
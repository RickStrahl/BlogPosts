---
title: Rendering Web Connection Scripts and Templates to a String
weblogName: West Wind Web Log
postDate: 2018-11-01T21:00:50.7399883-10:00
---
# Rendering Web Connection Scripts and Templates to a String
If you've used Web Connection's MVC style development you know that you can use scripts and templates to effectively render templates from disk and render them as complete script pages into the HTTP stream.

The `Response.ExpandScript()` and `Response.ExpandTemplate()` functions are used to generate full page HTML responses that return full HTTP responses including an HTTP header to the client.

A typical MVC stryle wwProcess request  might look like this:

```foxpro
************************************************************************
*  UserList
****************************************
FUNCTION UserList()
PRIVATE pnUserCount
pnUserCount = 0

*** Admin Only
IF !this.oUserSecurity.oUser.Admin
   Response.Redirect("~/")
   RETURN
ENDIF

pnUserCount = THIS.oUserSecurity.GetUsers()

Response.ExpandScript()
ENDFUNC
```

Notice the call the `ExpandScript()` at the end that's responsible for rendering a `UserList.usm` page in this application, which produces an entire HTML page.

### Partial Rendering
Web Connection scripts and templates also support partial rendering which effectively allows you to embed smaller scripts and templates to embed into an existing page. `RenderPartial()` allows you to break down large pages into a top level page that has many smaller pieces inside of it, which makes HTML development a lot more manageable in many cases.

Inside of a larger page you can simply do:

```html
<%= RenderPartial("~/Partials/Login_Partial.usm") %>
```

to pull in the content of the partial page. The page is processed as its own script or template (if it's a script it gets its own PRG file) 

### Rendering to String
But did you know that ExpandScript can also be used to render output to string instead of into the HTTP output stream?

This can be quite useful in applications where perha
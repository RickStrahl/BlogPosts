---
title: Save Files With Elevated Permissions on UnautorizedException
abstract: 
keywords: 
categories: 
weblogName: West Wind Web Log
postId: 
postDate: 2023-10-11T22:41:00.9285561-07:00
:dizzy_face:postStatus: publish
dontInferFeaturedImage: false
dontStripH1Header: false
---
# Save Files With Elevated Permissions on UnautorizedException

When building Desktop Applications that are document based and that allow users to save files in any location - like an editor for example - you may run into a situation where you on rare occasions need to save a file in a location that doesn't have permissions of the current user.

Ideally the file shouldn't be saved in a restricted location, but sometimes you need to edit a file that lives in this restricted file location, and then save the file after making changes. 

This should be fairly rare, but I've seen a number of instances in my logs of users trying to save files in [Markdown Monster](https://markdownmonster.west-wind.com/) and failing with `UnauthorizedAccessException` due to file location that is inaccessible.
Rather than outright failing the request, I wanted to show a notification, and give the user the option to save the file with elevated rights on Windows, which amounts to popping up the UAC dialog to elevate the user to Admin in order to save.

I originally saw this in VS Code and thought this came in quite handy, and I've now implemented something similar in Markdown Monster:

![Save with Elevation in Markdown Monster](https://github.com/RickStrahl/ImageDrop/blob/master/MarkdownMonster/SaveElevated.gif?raw=true)

In this example, I'm opening and saving a file in the `Program Files` folder, which usually *doesn't have write permissions* for saving a file. When the call to write the file fails, a notification dialog is popped up with an option to **Elevate** and then save the file using the elevated account.

> #### @icon-info-circle UAC Elevation
> UAC account elevation only works if the user is or can log on as an Admin on the machine. 
>
> Even though a user may be set up as an 'Admin' user, the account by default runs as a non-Admin user (unless you disable UAC) which can then be elevated to provide admin rights via the UAC dialog.
>
> If the user is not an Admin an optional login for an Admin account can be provided. 
>
> Failing that, the write operation cannot be performed.

## How to Copy a File with Elevation

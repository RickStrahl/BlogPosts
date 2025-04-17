---
title: The wrong direction with Cloud Computing
weblogName: West Wind Web Log
postDate: 2018-06-18T12:55:10.6397556-07:00
---
# The wrong direction with Cloud Computing

In response to Scott Ha's post:
https://www.hanselman.com/blog/PennyPinchingInTheCloudDeployingContainersCheaplyToAzure.aspx

You know when you say cheap I think you have a very different view of what cheap means than most people. So for a container Web app the minimum for a production app will have to be at least 2 cores, so you're looking at the p2V2 which lists as $297 for 2 core, 7gb. I don't know in which world this classifies as cheap. I run a physical box that has 10 times the horse power of that for less than half that. 

I get that a physical box or VM is different than hosted services, but the pricing is just not inline with what you're actually getting performance wise. So basically what we're saying here is let's spend all the money on the convenience of sliding bars and knobs, instead of getting adequate performance in the first place.

To me it seems the cost should be going **down** when you move off of physical hardware, not up... but that's exactly what's happening with cloud computing. Let's not forget that for years you could host shared ASP.NET apps for a few bucks a month and most of those apps worked no worse than they work on low end Azure plans today. Again that's not accounting for the management capabilities, but honestly that part of it should amortize over the years driving prices down not up as they have been.

I for one am very skeptical of putting my apps into anything like Azure because it's a one way street. Once you're in you're not easily getting back out because it's usually not just a single thing - onec

So show me the money on this... 
---
title: First thoughts on .NET 5.0
weblogName: West Wind Web Log
postDate: 2020-11-11T20:50:11.2625740-10:00
---
# First thoughts on .NET 5.0

Please note this is not meant as a comprehensive post on .NET 5.0. This is by far too big of a release to have a post around, but I wanted to give a few impressions that I've had upgrading a ton of projects to .NET 5.0 over the last couple of days.

### Porting is Easy
The first and maybe most welcome 'feature' of .NET 5.0 to me is that for maybe the first time ever in .NET history, I've been able to move most of my applications to a new major version without having to change any code. Although Microsoft often touts backwards compatibility major version updates often have small little changes to dependencies or tiny behavior changes that tend to break builds and on occasion runtime behavior.

With .NET 5.0 I've now upgraded 5 component projects, and 2 small to medium size Web applications. The 5 components required no code changes at all (other than changing the target framework and updating NuGet components). One of the Web application required no changes while one required a few small signature changes.

That's impressive. 
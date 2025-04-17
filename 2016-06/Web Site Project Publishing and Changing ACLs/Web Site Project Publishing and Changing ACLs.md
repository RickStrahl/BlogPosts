# ASP.NET Web Site Project Publishing and Changing ACLs

This post is a note to self regarding a problem I ran into today - again - with Publishing a Web Site project to my server so I decided to write it down so I can find it next time.

### Overwriting ACLs...
The problem is if you use Web Deploy from Visual Studio with a **Web Site Project** (and only a Web Site Project), the publish will overwrite the ACLs on the server by clearing them to the inherited defaults of the parent.

Needless to say this is usually not what you want - if you have any ACLs set at all on the server this will simply undo them which is rarely a good idea. The intent of the default at some point was likely to ensure that no extra rights are available so data isn't accidentally shared. Alas - with recent changes to IIS's secure by default settings that generally isn't a problem so this behavior of clearing ACLs is very annoying.

### Bite me once...
In my particular case I have a content site - which is usually the only place I use Web Site Projects for - that I added a new small service to that receives bug reports on, which are then written to disk. In order to write, permissions are needed which are set with ACL access writes to the IIS Application Pool user - NETWORK SERVICE in this case. I added the ACLs checked the application and verified that the server can write to the file in questions. Splendid.

Until the next publish from the Web Site project which promptly removes those custom ACLs. Ugghhh!

### Not updating ACLs
The problem is caused by a default setting that is not overwritten in Web site projects but is in other project types.

You can override this setting explicitly in the  `Your Web Site.pubxml` file (in your `App_Data` folder) and set `IncludeSetAclProviderOnDestination>False</IncludeSetAclProviderOnDestination>` in there.

Here's a complete `pubxml` file with the setting disabled:

```
<Project ToolsVersion="4.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <PropertyGroup>
    <WebPublishMethod>MSDeploy</WebPublishMethod>
    <LastUsedBuildConfiguration>Release</LastUsedBuildConfiguration>
    <LastUsedPlatform>Any CPU</LastUsedPlatform>
    <SiteUrlToLaunchAfterPublish />
    <LaunchSiteAfterPublish>True</LaunchSiteAfterPublish>
    <ExcludeApp_Data>False</ExcludeApp_Data>
    <MSDeployServiceURL>https://publish.west-wind.com</MSDeployServiceURL>
    <DeployIisAppPath>markdownmonster.west-wind.com</DeployIisAppPath>
    <RemoteSitePhysicalPath />
    <SkipExtraFilesOnServer>True</SkipExtraFilesOnServer>
    <MSDeployPublishMethod>RemoteAgent</MSDeployPublishMethod>
    <EnableMSDeployBackup>True</EnableMSDeployBackup>
    <UserName>rerickulous</UserName>
    <_SavePWD>False</_SavePWD>
    
    <!-- **** This is the relavant setting --->
    <IncludeSetAclProviderOnDestination>False</IncludeSetAclProviderOnDestination>    
  </PropertyGroup>
</Project>
```

FWIW, there's quite a bit you can do with ACL permissions in this file. There's a [blog post by Sayed Hashimi](http://sedodream.com/2011/11/08/SettingFolderPermissionsOnWebPublish.aspx) that describes some of those options.



### Until next time I forget
Yup this is one of things, I fix and promptly forget, right? Then a year from now I hit it again and I'll probably end up searching and ending up at my own blog post.


<!-- Post Configuration -->
<!--
```xml
<abstract>
When publishing ASP.NET Web Site Projects, the project publish will overwrite server ACLs by clearing them to the inherited defaults and removing rights from common accounts. The result is that if you have custom ACLs set on the server they will be wiped by default. This occurs only on Web Site projects and in this post I remind myself of the .pubxml override setting that disables this default behavior
</abstract>
<categories>
ASP.NET,IIS
</categories>
<postid>1625782</postid>
<keywords>
Web Deploy,Web Publish,ACL,Web Site Project
</keywords>
<weblog>
Rick Strahl's Weblog
</weblog>
```
-->
<!-- End Post Configuration -->

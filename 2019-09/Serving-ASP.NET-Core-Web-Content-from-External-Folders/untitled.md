When publishing an application, the way that web.config is written is inconsistent. If the file exists there is some funky update behavior happening that's trying to diff the file but writing out some invalid entries.

Also it's quite unclear what you can and can't do and when using Visual Studio it will frequently overwrite whatever web.config changes you might have made especially when related to arguments.

The default has settings like this:

```xml
 <aspNetCore processPath="%LAUNCHER_PATH%" arguments="%LAUNCHER_ARGS%" stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="inprocess">
        <environmentVariables>
          <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Development" />
          <environmentVariable name="WEBCONNECTION_WEBROOT" value="c:\webconnectionprojects\wwthreads\web" />
          <environmentVariable name="WEBCONNECTION_OPENBROWSER" value="True" />
        </environmentVariables>
      </aspNetCore>
```


which is fine if you leave these as is and adjust only environment variables. I realize this is probably to most predictable approach, but I actually think it's much cleaner to use command arguments in the arguments attribute.

However, if you decide to explicitly set the process path and arguments as I did, the crazy behavior starts happening.

For example, I set the following in my project's `web.config`:


```xml
<aspNetCore processPath=".\WebConnectionWebServer.exe" arguments="--WebRoot c:\webconnectionprojects\wwthreads\web" 
            stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="inprocess" />
```

If I run out of my publish folder with this exact configuration it works fine - the arguments are passed and the EXE works to bootstrap the app even for IIS Inprocess operation.

But the first time I publish I get this instead:

```xml
<aspNetCore processPath="dotnet" 
    arguments=".\WebConnectionWebServer.dll --WebRoot c:\webconnectionprojects\wwthreads\web" 
    stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" 
    hostingModel="inprocess" />
```

Uhm, ok I guess that works, but why?

Then, if I publish again it gets worse:

```xml
<aspNetCore processPath="dotnet" 
    arguments=".\WebConnectionWebServer.dll .\WebConnectionWebServer.dll --WebRoot c:\webconnectionprojects\wwthreads\web" 
    stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" 
    hostingModel="inprocess" />
```    

publish again and the DLL name just keeps adding up.

On several occasions I've also seen environment variables that have been changed in the project's web.config, not getting published into the publish output folder.

### Expected Behavior
The problem is that the publish behavior for web.config is very inconsistent. In my opinion there's no good reason to keep web.config around in the publish folder and try to sync it up with the project's version...

Web.config should be re-written on each publish/build operation.


I think there should be no fix up at the publish level. Anything that the publish operation touches should be overwritten and not adjusted.

Preferrably I'd like to see the file overwritten each and every time so the result is predictable. I don't want to maintain files in my project and also in the publish or deploy folder.





> #### Related issue
> I can't duplicate this now but my project's Web.config has on several occasions been changed by Visual Studio (presumably when running with IIS Express) wiping out my custom processPath and arguments settings and resetting them to the defaults. Additionally the Debug tab's settings are often not synced properly with is in `web.config`.
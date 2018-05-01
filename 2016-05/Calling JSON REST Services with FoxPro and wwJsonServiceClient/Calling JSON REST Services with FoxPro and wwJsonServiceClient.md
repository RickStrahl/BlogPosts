# Calling JSON REST Services with FoxPro and wwJsonServiceClient

A few days ago I released version 6.0 of the [West Wind Client Tools](http://west-wind.com/webconnection/docs/_1wu18owba.htm) which includes a little gem of a class called [wwJsonServiceClient](http://west-wind.com/webconnection/docs/_4jf1f19zr.htm) that makes it super easy to call JSON REST services. This class is part of the West Wind Client Tools as well as West Wind Web Connection and it makes it a snap to call JSON services to receive and send data.

### Calling REST Services
REST services are becoming more and more popular and are starting to crowd out SOAP based services as the vehicle to share raw data over the Internet. Where SOAP is a very heavy XML based protocol that requires a very strict format, REST generally uses much simpler structures to push data over the wire. Data is usually encoded as JSON rather than XML. JSON is essentially a way to express JavaScript values, objects and arrays as a literal string value, which is easy to create and parse using standard libraries. Like XML, JSON is a serialization format, but unlike XML it skips all the formality and provides *just the data*.

If you're retrieving data from online social services or 'new Web' companies, you're going to encounter REST and JSON APIs generally. The benefit of REST JSON services is that generally they are much simpler than SOAP counterparts as you don't have worry about XML data mapping descreprancies. You don't need any special software to access a REST service - there's no SOAP client that has to parse a SOAP message and call. You simply have a documented endpoint and a set structure of data to send in (if any) and a set structure of data that is returned. All you need to access a REST service is an HTTP client (like wwHttp) and if the data is in JSON format a JSON serializer (like wwJsonSerializer).

On the server side things are also easier because again there's not additional contract that needs to be created. To create a REST service you build plain HTTP endpoints and return a JSON value or object. If you're using FoxPro in Web Connection the [wwRestProcess class](http://west-wind.com/webconnection/docs/_45p0t1xls.htm) makes it easy to create FoxPro based REST services by simply creating classes that take a single input parameter and return a single result value. The wwRestProcess class handles all the logistics of publishing that data.

### What is wwJsonServiceClient?
You can think of wwJsonServiceClient as a simple way to call a REST service. At it's simplest it's a high level wrapper class that wraps the [wwHttp ](http://west-wind.com/webconnection/docs/_4jf1f19zr.htm) and [wwJsonSerializer](http://west-wind.com/webconnection/docs/_1wu18owba.htm) to call JSON services via HTTP and handles the JSON serialization and deserialization.

In a nutshell it reduces calling a REST service to a single line of code. There's not a lot of magic there.

### Making a GET Request
Let's try it out. The following calls a sample site to retrieve a list of Music Albums from an online AlbumViewer sample I created for last year's [Web Connection Training](http://west-wind.com/WebConnection/training/DI_SWFox2016/). 

This first request is a simple GET command that retrieves the list of albums like so:

```foxpro
do wwhttp
do wwJsonSerializer

loProxy = CREATEOBJECT("wwJsonServiceClient")

*** Make the service call
loAlbums = loProxy.CallService("http://albumviewerswf.west-wind.com/api/albums",
                               "","GET")
? loProxy.cErrorMsg

lnCount = loAlbums.Count

* ? loAlbums.Item(1).Title

FOR EACH loAlbum in loAlbums 
   ? loAlbum.Title  + ;
     " by " + loAlbum.Artist.ArtistName + ;
     " (" +  TRANSFORM(loAlbum.Tracks.Count) + " tracks)"
   FOR EACH loTrack IN loAlbum.Tracks
		? "  " + loTrack.SongName
   ENDFOR
ENDFOR

```

The key is this line:


```foxpro
loAlbums = loProxy.CallService("http://albumviewerswf.west-wind.com/api/albums","","GET")
```

which makes an HTTP GET request to the server with not data to send to the server (empty second parameter). The last two parameters are actually not required - if no data is passed GET is assumed for the HTTP verb. You've just simplified a service call to single line of code.

### POSTing data to a server
Along the same lines you can also post data to a server by passing a value, object or array to the server as the second parameter and changing the HTTP verb.

```foxpro
loArtist = CREATEOBJECT("Empty")
ADDPROPERTY(loArtist,"Id","2")
ADDPROPERTY(loArtist,"ArtistName","Accept")
ADDPROPERTY(loArtist,"Description","Old school German Metal band")
ADDPROPERTY(loArtist,"ImageUrl","http://cps-static.rovicorp.com/3/JPG_400/MI0001/389/MI0001389322.jpg?partner=allrovi.com")
ADDPROPERTY(loArtist,"AmazonUrl","")

loProxy = CREATEOBJECT("wwJsonServiceClient")
loArtist = loProxy.CallService("http://albumviewerswf.west-wind.com/api/artist",loArtist,"PUT")

IF  loProxy.lError
   ? loProxy.cErrorMsg
   RETURN
ENDIF

? loArtist.Albums.Count
```

Now in this case the call fails because you actually have to log in first, but if you hook up an HTTP proxy like [Fiddler](http://www.telerik.com/fiddler) you you'll see the following was sent to the server:

```
PUT http://albumviewerswf.west-wind.com/api/artist HTTP/1.1
Content-Type: application/json
User-Agent: West Wind Internet Protocols 6
Host: albumviewerswf.west-wind.com
Content-Length: 194
Pragma: no-cache
Cookie: _ga=GA1.2.1516538738.1449808058; albv=C03E01F1F67F15336

{ 
 "amazonurl":"",
 "artistname":"Accept",
 "description":"Old school German Metal band",
 "id":"2",
 "imageurl":"http://cps-static.rovicorp.com/3/JPG_400/MI0001/389/MI0001389322.jpg?partner=allrovi.com"
}
```

So you can see that the service client is generating an HTTP request with a JSON payload from your method call.

### Dealing with FoxPro Case Limitations
Now it turns out that the service actually expects all the property names to be proper case. FoxPro's property retrieval API unfortunately does not natively support preserving case (except if you use MemberData which is a pain in the ass) and so the serializer by default turns all property names into lower case.

If you need to communicate with a service that requires either proper or camel case (which is common for JSON services) you can override property names explicitly.

```foxpro
loProxy = CREATEOBJECT("wwJsonServiceClient")

*** Create a custom serializer that overrides property names
loSer = CREATEOBJECT("wwJsonSerializer")
loSer.PropertyNameOverrides = "Id,ArtistName,Description,ImageUrl,AmazonUrl"
loProxy.CreateSerializer(loSer)

loArtist = loProxy.CallService("http://albumviewerswf.west-wind.com/api/artist",loArtist,"PUT")

IF  loProxy.lError
   ? loProxy.cErrorMsg
   RETURN
ENDIF

? loArtist.Albums.Count
```

Now the data is sent with proper names:

```JSON
{ 
 "AmazonUrl":"",
 "Artistname":"Accept",
 "Description":"Old school German Metal band",
 "Id":"2",
 "ImageUrl":"http://cps-static.rovicorp.com/3/JPG_400/MI0001/389/MI0001389322.jpg?partner=allrovi.com"
}
```

These overrides are applied globally to all properties, child properties and array items so this addresses the FoxPro type name limitations.

### HTTP Verbs
The above example used a `PUT` command to update an existing record. `POST` is typically used to add a new record, there's also `DELETE` and `HEAD` and a few other verbs. The verbs are usually determined by the service interface which should be provided by the documentation for the service. 

Verbs can be used to differentiate operations on the same URL. For example, in the Item Service above I can use the `Artist` endpoint with `GET` and an ID to retrieve an artist. With `POST` a new artist is added, `PUT` updates an artist and `DELETE` removes an artist all from the same `http://albumviewerswf.west-wind.com/api/artist` Url. This is a common pattern and this approach lets you work with that.

### Make it Better
Ok, so the above works, but you really don't want to scatter code like this into your application logic. It's a much better idea to abstract the service implementation into its own class with methods for each of the operations you want to perform.

Instead I recommend that when you access a service, you create a class that inherits from `wwJsonServiceClient` and then implement methods that make the service call. This can simply error handling and puts all the code related to the service - including any possible pre and post processing you might do for each call -  into a single class.

So if we refactor our two service functions we might end up with a class like this:

```foxpro
******************************************************
DEFINE CLASS AlbumViewerService as wwJsonServiceClient
******************************************************

************************************************************************
*  Init
****************************************
FUNCTION Init()

DODEFAULT()

*** Ensure a serializer exists
this.CreateSerializer()

ENDFUNC

************************************************************************
*  GetAlbums
****************************************
FUNCTION GetAlbums()
LOCAL loAlbums

loAlbums = THIS.CallService("http://albumviewerswf.west-wind.com/api/albums","","GET")

*** Error message is already set
IF THIS.lError
   RETURN null
ENDIF   

RETURN loAlbums
ENDFUNC


************************************************************************
*  UpdateArtist
****************************************
FUNCTION UpdateArtist(loArtist)
LOCAL loArtist

this.oSerializer.PropertyNameOverrides = "Id,ArtistName,Description,ImageUrl,AmazonUrl"

loArtist = THIS.CallService("http://albumviewerswf.west-wind.com/api/artist",loArtist,"PUT")

*** Reset overridden properties
this.oSerializer.PropertyNameOverrides = ""

IF THIS.lError
   RETURN null
ENDIF   

RETURN loArtist
ENDFUNC


ENDDEFINE
```

By doing this you're abstracting all the logic required to deal with the service in this class, so the application doesn't need to see this low level interaction.

To use the service and call both methods the front end code you might use inside of your application looks like this:

```foxpro
*** Create our CUSTOM service
loProxy = CREATEOBJECT("AlbumViewerService")

*** call the wrapper method
loAlbums = loProxy.GetAlbums()

lnCount = loAlbums.Count
* Do something with the data


loArtist = CREATEOBJECT("Empty")
ADDPROPERTY(loArtist,"Id","2")
ADDPROPERTY(loArtist,"ArtistName","Accept")
ADDPROPERTY(loArtist,"Description","Old school German Metal band")
ADDPROPERTY(loArtist,"ImageUrl","http://cps-static.rovicorp.com/3/JPG_400/MI0001/389/MI0001389322.jpg?partner=allrovi.com")
ADDPROPERTY(loArtist,"AmazonUrl","")

loAlbum = loProxy.UpdateArtist(loArtist)
IF  loProxy.lError
   ? loProxy.cErrorMsg
   RETURN
ENDIF

? loArtist.Albums.Count

RETURN 
```

This is much cleaner as you are calling simple methods that describe what's happening. If something goes wrong, you have one place to go to look for the failures and the service becomes now reusable.

### Summary
REST services are becoming much more common and although they are easy to call if you have an HTTP client and JSON serializer, `wwJsonSerializer` offers a more simpler, more abstracted and consistent way of doing it for you. Errors are caught and passed back to you and it reduces the service call to essentially a single line of code potentially with some extra configuration if you need to post data to the server that requires proper casing.

Give wwJsonSerializer a try. It's available in [West Wind Client Tools 6.0](http://west-wind.com/WestwindClientTools.aspx) and [West Wind Web Connection](http://west-wind.com/webconnection), but the Web Connection version is not quite up to date and is missing the `CreateSerializer()` method. This will be addressed in the forthcoming v6.05 release due out shortly.





<!-- Post Configuration -->
<!--
```xml
<abstract>
Calling JSON REST services is becoming more and more common and although various West Wind tools have provided support for calling services using wwHttp and wwJsonSerializer, the newly released wwJsonService class provides an even easier service call wrapper for calling JSON REST service endpoints. In this post I demonstrate basic functionality using the CallServiceMethod() method as well as properly abstracting all service calls into a dedicated class.
</abstract>
<categories>
FoxPro,Web Connection
</categories>
<postid></postid>
<keywords>
FoxPro,REST,JSON
</keywords>
<weblog>
Rick Strahl's FoxPro and Web Connection Weblog
</weblog>
```
-->
<!-- End Post Configuration -->


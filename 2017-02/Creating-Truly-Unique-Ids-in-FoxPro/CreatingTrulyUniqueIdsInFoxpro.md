# Creating Truly Unique Ids in FoxPro
![](numbers.jpg)

Generating ids is a common thing for Database applications. Whether it's for unique identifiers to records in a database, whether you need to send a unique, non-guessable email link to a customer or create a temporary file, unique IDs are common in software development of all kinds.

### Why not Sys(2013)?
FoxPro internally includes a not so unique id generation routine in `SYS(2015)`:

```foxpro
? SYS(2015)
* _4UJ0VDHVX
```

This works for some things as long as they are internal to the application. But there are a lots of problems with this approach:

* The values are easily guessable as they are based on sequential timestamps
* Not unique across machines 
* The id value is too short
* Duplication rate can be very high

`SYS(2015)`'s original purpose was internal to Foxpro for generating unique procedure names for generated code for some of the FoxPro tools. It worked fine because when it was created we had a single application running. Within a single application Ids are unique, but as soon as you throw in multiple applications either on the same machine or the network `SYS(2015)` is no longer able to even remotely guarantee unique ids.

For anything across processes or machines `SYS(2015)` is unacceptable. This can be mitigated somewhat by adding process or thread Ids to the string, but still there is too much possibility of conflict. Because the actual ID (minus the leading `_`) is only 9 character, the chance for duplication is also pretty high once the timestamp 'rounds' around. If you account for different timezones and multiple machines you find that IDs are not anywhere near 'unique'.

### Guids
One way to ensure you generate truly unique IDs is to generate GUIDs. Guids are **guaranteed to be unique across time and space** (machines) as they are based on an algorithm that is based on a timestamp and a machine's MacId. Guids are safe and relatively easy to generate even in FoxPro:

```foxpro
FUNCTION CreateGUID
************************************************************************
* wwapi::CreateGUID
********************
***    Author: Rick Strahl, West Wind Technologies
***            http://www.west-wind.com/
***  Modified: 01/26/98
***  Function: Creates a globally unique identifier using Win32
***            COM services. The vlaue is guaranteed to be unique
***    Format: {9F47F480-9641-11D1-A3D0-00600889F23B}
               if llRaw .T. binary string is returned
***    Return: GUID as a string or "" if the function failed 
*************************************************************************
LPARAMETERS llRaw
LOCAL lcStruc_GUID, lcGUID, lnSize

DECLARE INTEGER CoCreateGuid ;
  IN Ole32.dll ;
  STRING @lcGUIDStruc
  
DECLARE INTEGER StringFromGUID2 ;
  IN Ole32.dll ;
  STRING cGUIDStruc, ;
  STRING @cGUID, ;
  LONG nSize
  
*** Simulate GUID strcuture with a string
lcStruc_GUID = REPLICATE(" ",16) 
lcGUID = REPLICATE(" ",80)
lnSize = LEN(lcGUID) / 2
IF CoCreateGuid(@lcStruc_GUID) # 0
   RETURN ""
ENDIF

IF llRaw
   RETURN lcStruc_GUID
ENDIF   

*** Now convert the structure to the GUID string
IF StringFromGUID2(lcStruc_GUID,@lcGuid,lnSize) = 0
  RETURN ""
ENDIF

*** String is UniCode so we must convert to ANSI
RETURN  StrConv(LEFT(lcGUID,76),6)
* Eof CreateGUID
```

To use these Guid routines:

```foxpro
? CreateGuid()
* {344986DB-D674-42BD-9A2E-A7833B190E05}

? CreateGuid(.t.)
*‰öÓeî‹èK“§Y‚þ¡I

? LOWER(CHRTRAN(CreateGuid(),"{}-"))
* 6823a6f0af7040318964e74cc8a78833
```

The middle one represents binary characters. Typically you wouldn't use that except for direct storage to a binary field (using `CAST()` most likely). The last value is what I recommend if you use GUIDs in any sort of user facing scenario. Using lowercase values makes it much easier to read the long value.

Guids are **safe and guaranteed to be unique**, but they are **big**. Even if you strip out the `{}-` from the string, it's still **32 characters**. The binary value is 16 bytes, which is better, but for FoxPro data the last thing you'd want to do is use binary data for a field especially an indexable one.

Guids as keys also are a problem because they are truly random. There's very little commonality between one GUID and another, so any indexing scheme can't really pack GUIDs. Coupled with the large string size GUID indexes tend to be larger than other indexes.

### Creating custom Variations off of Guids
In [West Wind Web Connection](https://west-wind.com/webconnection) we've had to use unique ids for a long time. Session tables in particular - with their potentially high volume insert/read operations - have always needed to have unique values that were unique across machines. I've gone through a number of iterations with this starting originally with SYS(2015) plus tacked on process and threadIds plus random characters.

But more recently (with Web Connection 6.0) I switched to using **subsets of Guids** and finally more recently I built a new routine that can strip down a Guid to a 16 character string safely.

How do you fit a 32 character string into 16 characters? Simple: GUIDs use hex value notation which means that the number of characters used is actually twice the number of bytes involved in the actual GUID binary. If you break down that each byte value into the full alphabet, digits and perhaps a few symbol characters you can get pretty close to representing GUIDs in full. Note you still lose some fidelity here - because we're shoehorning 255 hex values down to about 70, but in my testing running 10 million guids in a single run and over a billion in aggregate, I've not been able to generate any duplicates. That doesn't mean it can't happen but it's very, very unlikely. If you need 100% guarantees then stick with Guids - otherwise this variation is good enough.

The current routine that [West Wind Web Connection](https://west-wind.com/webconnection) and the [West Wind Client Tools](http://west-wind.com/WestwindClientTools.aspx) (versions 6.10 and later) use is this:

```foxpro
************************************************************************
*  GetUniqueId
****************************************
***    Author: Rick Strahl, West Wind Technologies
***            http://www.west-wind.com/
***  Function: Create a unique ID based on a Guid spread over 
***            full alpha, digit and some symbols
***    Assume:
***      Pass: lnLength = length between 8 and 16 - 16 is full Guid
***    Return:
************************************************************************
FUNCTION GetUniqueId(lnLength,llIncludeSymbols,lcAdditionalChars)
LOCAL lcChars, lcGuid, lcId, lnX, lcHex, lnHex, lcGuidBinary

IF VARTYPE(lnLength) # "N" 
   lnLength = 16
ENDIF
IF lnLength < 8
   lnLength = 8
ENDIF
IF lnLength > 16
   lnLength = 16
ENDIF   
IF EMPTY(lcAdditionalChars)
   lcAdditionalChars = ""
ENDIF   

lcChars = "abcdefghijkmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890" + IIF(llIncludeSymbols,"!@#$%&*+-?","") + lcAdditionalChars
lcGuidBinary = REPLICATE(" ",16) 

DECLARE INTEGER CoCreateGuid ;
  IN Ole32.dll ;
  STRING @lcGUIDStruc
CoCreateGuid(@lcGuidBinary)

lcId = ""
FOR lnX = 1 TO lnLength
   lnHex = ASC(SUBSTR(lcGuidBinary,lnX,1)) % LEN(lcChars)
   lcId = lcId + SUBSTR(lcChars,lnHex + 1,1)   
ENDFOR

RETURN lcID
*   GetUniqueId
```

The routine bascially grabs a new Guid and the breaks the Guid's bytes out into values that are provided as part of a 'string array' - a string of allowable characters. The code loops through all the bytes and pushes them into a new string based on the 'string array'.

To use this:

```foxpro
? GetUniqueId()   && Full 16 chars
* z9h8snad4dwe18sk

? GetUniqueId(8)  && Minimum
* cxip5nre

? GetUniqueId(20) && stripped to 16
* pfdogee6kd29978j
```

Note that you can pass a parameter for the number of characters to generate for the ID. The more characters you choose the more reliable the id up to 16. For small local scenarios 8 characters are going to be enough. Again running in tests I was unable to generate duplicate IDs in a single run, although running in the billion operations I managed to generate a total of 2 dupes. That's very low and goes up significantly as you add more characters.

This routine replaces my existing `GetUniqueId()` routine in Web Connection. The main change here is that the actual string generated is a lot shorter than the old routine. The old one **required** 15 characters up to 32. Here we require 8 up to 16. If a string greater than 16 is requested only 16 characters are returned. This should be Ok for backwards compatibility with `VarChar(x)` types in the DB the values will just work and with `char(x)` extra spaces fill out the number.

### Performance
These routines are not blazingly fast especially if compared to `SYS(2015)`. Most of this is due to the complexity of GUID generation and the FoxPro interop required to call it as well as the limited character iteration support in FoxPro - using SUBSTR() to iterate over each character in a string is very very slow. Interop in FoxPro has a bit of overhead and the routines require Unicode to ANSI conversions internally. Still on my machine I generate 10,000 ids in 2.5 seconds which puts the creation time roughly at 1/4 millisecond which is acceptable for a nearly unique, reasonably sized Id. By comparison though, `SYS(2015)` took less than a quarter second for those same 10,000 generations.

### Summary
Remember that this last routine is not 100% guaranteed to be unique - but it's pretty close. If you need 100% guaranteed unique IDs stick with full GUIDs. Personally I feel pretty confident that there won't be any dupes with the `GetUniqueId()` routine even if I have a fully distributed application where data is entered in multiple locations.

There you have it - a few ways to generate unique IDs in FoxPro. Enjoy.


<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created with 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster</a> 
</div>

<!-- Post Configuration -->
<!--
```xml
<blogpost>
<title>Creating Truly Unique Ids in FoxPro</title>
<abstract>
Generating ids is a common thing for any Database applications. Whether it's for unique identifiers to records in a database, whether you need to send a unique, non-guessable email link to a customer or create a temporary file, unique IDs are common in software development of all kinds. In this post, Rick talks about how to generate unique ids in FoxPro.
</abstract>
<categories>
FoxPro,Web Connection
</categories>
<keywords>
Unique id,SYS(2015),GUID,Ids
</keywords>
<isDraft>False</isDraft>
<featuredImage>http://west-wind.com/wconnect/weblog/imageContent/2017/Creating-Truly-Unique-Ids-in-FoxPro/numbers.jpg</featuredImage>
<weblogs>
<postid>926</postid>
<weblog>
Web Connection Weblog
</weblog>
</weblogs>
</blogpost>
```
-->
<!-- End Post Configuration -->

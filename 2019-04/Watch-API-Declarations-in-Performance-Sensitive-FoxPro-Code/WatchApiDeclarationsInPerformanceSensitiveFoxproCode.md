---
title: API Declarations in Performance Sensitive FoxPro Code
abstract: The FoxPro Declare API has been in FoxPro forever, but did you know that the actual step of calling DECLARE has significant performance overhead that often is much slower than the actual API calls? I recently ran into this checking out a third party library and decided to some closer examination and found some nice ways to speed up some of my existing API calls by separating (or static loading) declarations from invocations.
keywords: DLL, DECLARE, API, DLL
categories: FoxPro
weblogName: Web Connection Weblog
postId: 949
postDate: 2019-04-26T10:51:38.9579339-10:00
---
# API Declarations in Performance Sensitive FoxPro Code

![](Banner.jpg)

Visual FoxPro has good support for interfacing with API interfaces by using the `DECLARE API` keyword that lets you essentially map a function in Win32 DLL and map it a FoxPro callable function.

The good news is that you can a) do this and b) that it's very efficient. FoxPro's interface mechanism to the DLL call once it's registered is very quick.

## Call your DLLs right
When you make API calls in FoxPro it's basically a two step process:

* Declare your API and map it to a FoxPro function
* Call the mapped function

Personally I tend to almost always abstract API calls into separate FoxPro functions that abstract away the API-ness of the function:

```foxpro
FUNCTION WinApi_SendMessage(lnHwnd,lnMsg,lnWParam,lnLParam)

DECLARE integer SendMessage IN WIN32API ;
        integer hWnd,integer Msg,;
        integer wParam,;
        Integer lParam

RETURN SendMessage(lnHwnd,lnMsg,lnWParam,lnLParam)
ENDFUNC 
```

to make it easier to call this code from FoxPro directly. It works fine this way but if you are calling APIs that are frequently called in quick succession you may find that performance is not all that great.

## A Real World Example
Recently Christof Wollenhaupt posted a Windows API based implementation of various Hash encryption routines called [FoxCryptoNg](https://github.com/cwollenhaupt/foxCryptoNG) that don't require any external libraries using all native Windows APIs. Y[ou can check out the code here](https://github.com/cwollenhaupt/foxCryptoNG/blob/master/foxCryptoNG.prg).

If you look at the code you see there's a `DeclareApiFunction` section that declares a number of APIs and originally his code would call the `DeclareApiFunctions()` method for each hash operation. 

I checked out the code and ran some tests for performance (not really sure why) comparing it with the routines that I use in the [wwEncryption class](https://webconnection.west-wind.com/docs/_4c10w1prc.htm) in the [West Wind Client Tools](http://client-tools.west-wind.com/) and [Web Connection](https://webconnection.west-wind.com).

When running the tests initially - when the declare APIs were called for each method call - the performance was abysmal. So much so that I filed an issue on Github.

* [Slow?](https://github.com/cwollenhaupt/foxCryptoNG/issues/1)

The issue basically compares the function vs. the wwEncryption class. Running a test of a 1000 SHA56 hash encodings was taking over 15 seconds with `foxCryptong` class vs. under a second with the .NET based routines in wwEncryption.

Christof eventually responded and tracked down the performance to the API declarations. By changing is code to declare the declaration in the `Init()` instead of in each method performance ended up then being actually a little faster than the .NET based approach.

### Watch your Declarations

So the code to get a  went from:

```foxpro
Procedure Hash_SHA256 (tcData)
	Local lcHash
	DeclareApiFunctions()
	lcHash = This.HashData ("SHA256", m.tcData)
Return m.lcHash
```

taking over 15 seconds for 1000 hashes

to:


```foxpro
Procedure Init()
	DeclareApiFunctions()
EndProc

Procedure Hash_SHA256 (tcData)
	Local lcHash
	lcHash = This.HashData ("SHA256", m.tcData)
Return m.lcHash
```

to 0.7 seconds. 

Whoa hold on there hoss - that's more than 20 times faster!!!

The moral of the story is that API calls are fast, but declarations are not!

The reason for this is that FoxPro's API functionality has to look up these API functions in the Windows libraries. It has to look up the function in these rather large libraries, verify the function signature and then provide a mapping to the FoxPro function that can be called from FoxPro code. That setup takes time and that's exactly what we're seeing here in terms of performance.

> **Bottom Line**: For high traffic API calls - separate your API declaration from your API call!

Christof's solution was to simply move the declaration to the `Init()` which is fair. But as he points out in his response there's the possibility that somebody calls `CLEAR DLLS` at some point which would lose the declarations and the API calls would then fail. I actually find that quite unlikely but hey - anything is possible. If you can fuck it up, somebody probably will. :-)

## Isolating API Call From Declaration
I had never really given this a lot of thought to performance of API calls, although implicitly I've always felt like API calls didn't run particularly fast. I never really tested but now I think that the perceived slowness may have simply been the declaration overhead. For most of my applications I use API declarations go with the call so I'm as culpable as Christof's code to performance issues.

For example here's one that actually gets called quite frequently in my code - calling one of my own DLLs - and probably could use DECLARE optimization.

```foxpro
************************************************************************
*  JsonString
****************************************
FUNCTION JsonString(lcValue)
DECLARE INTEGER JsonEncodeString IN wwipstuff.dll string  json,string@  output
LOCAL lcOutput 
lcOutput = REPLICATE(CHR(0),LEN(lcValue) * 6 + 3)
lnPointer = JsonEncodeString(lcValue,@lcOutput)
RETURN WinApi_NullString(@lcOutput)
ENDFUNC
*   JsonString
```

### Find High Traffic Methods and Separate
So there are a number of ways you can address the separation to cause declarations to be called just once.

### Use a Class and DeclareApis style Initialization
Christof's solution of using a `DeclareApis()` function where you have **all your declares in one place up front** is a great solution if you are using a class. Why a class? Because it has a clear entry point that you can isolate and call with. A class is also a reference that you can easily hold onto after an individual call, and then reuse that class later to make additional calls.

Just to re-iterate to do this you'd create:

```foxpro
DEFINE Class ApiCaller as Custom

Procedure Init()
	DeclareApiFunctions()
EndProc

Procedure DoSomething(tcData)
	return ApiMethod(tcData)
EndProc

Procedure DeclareApiFunctions()
    DECLARE Integer ApiMethod In mydll.dll string
    DECLARE ...
EndProc
```

### `Static` Declarations
The above approach works reasonably well but it may still end up calling the declarations many times because you may be instantiating the class multiple times.

Another approach I've found useful on high traffic APIs is to wrap them around a `PUBLIC` gate variable that checks if the API was previously declared.


So imagine I have this function (as I do in `wwUtils.prg` in various West Wind Tools):

```fox
FUNCTION JsonString(lcValue)

DECLARE INTEGER JsonEncodeString IN wwipstuff.dll string  json,string@  output
	__JsonEncodeStringAPI = .T.

LOCAL lcOutput 
lcOutput = REPLICATE(CHR(0),LEN(lcValue) * 6 + 3)
lnPointer = JsonEncodeString(lcValue,@lcOutput)
RETURN WinApi_NullString(@lcOutput)
ENDFUNC
```

Running the following test code:

```fox
DO wwutils
lnSeconds = SECONDS()
FOR lnX = 1 TO 100000
	lcJson = JsonString("Hello World")
	lcJson = JsonString("Goodbye World")
ENDFOR

lnSecs = SECONDS() - lnSeconds
? lnSecs
```

takes **15.2 seconds**  to run.

Now let's change this code with a Public gate variable definition that only declares it once:

```fox
FUNCTION JsonString(lcValue)

PUBLIC __JsonEncodeStringAPI
IF !__JsonEncodeStringAPI
	DECLARE INTEGER JsonEncodeString IN wwipstuff.dll string  json,string@  output
	__JsonEncodeStringAPI = .T.
ENDIF	

LOCAL lcOutput 
lcOutput = REPLICATE(CHR(0),LEN(lcValue) * 6 + 3)
lnPointer = JsonEncodeString(lcValue,@lcOutput)
RETURN WinApi_NullString(@lcOutput)
ENDFUNC
```

This now takes **0.72 seconds**  to run. That's **more than 20x the performance**!

This code is not pretty and it relies on a public variable, but it's undeniably efficient.

The way this works is that a public boolean variable is created. Initially this value is `.F.` because FoxPro variables declared or otherwise by default are always `.F.` when undefined. So the code checks for that and if `.F.` declares the API and also sets the PUBLIC variable to `.T.`. Next time through now the value of the public var is `.T.` and so the declare doesn't fire again. It's a little trick to have a 'singleton' code path at the expense of an extra PUBLIC variable.

### Apply to Blocks of Declarations

You can apply the same technique to a larger set of API declarations that you might make in `Init()` or `DeclareApis()` type call. For example in wwAPI's init method I do the following now:

```fox
PUBLIC __wwApiDeclatationsAPI
IF !__wwApiDeclatationsAPI
	DECLARE INTEGER GetPrivateProfileString ;
	   IN WIN32API ;
	   STRING cSection,;
	   STRING cEntry,;
	   STRING cDefault,;
	   STRING @cRetVal,;
	   INTEGER nSize,;
	   STRING cFileName
	   
	DECLARE INTEGER GetPrivateProfileSectionNames ;
	   IN WIN32API ;
	   STRING @lpzReturnBuffer,;
	   INTEGER nSize,;
	   STRING lpFileName 

	DECLARE INTEGER WritePrivateProfileString ;
	      IN WIN32API ;
	      STRING cSection,STRING cEntry,STRING cValue,;
	      STRING cFileName     

	DECLARE INTEGER GetCurrentThread ;
	   IN WIN32API 
	   
	DECLARE INTEGER GetThreadPriority ;
	   IN WIN32API ;
	   INTEGER tnThreadHandle

	DECLARE INTEGER SetThreadPriority ;
	   IN WIN32API ;
	   INTEGER tnThreadHandle,;
	   INTEGER tnPriority

	*** Open Registry Key
	DECLARE INTEGER RegOpenKey ;
	        IN Win32API ;
	        INTEGER nHKey,;
	        STRING cSubKey,;
	        INTEGER @nHandle

	*** Create a new Key
	DECLARE Integer RegCreateKey ;
	        IN Win32API ;
	        INTEGER nHKey,;
	        STRING cSubKey,;
	        INTEGER @nHandle

	*** Close an open Key
	DECLARE Integer RegCloseKey ;
	        IN Win32API ;
	        INTEGER nHKey
	  
	DECLARE INTEGER CoCreateGuid ;
	  IN Ole32.dll ;
	  STRING @lcGUIDStruc
	  
	DECLARE INTEGER StringFromGUID2 ;
	  IN Ole32.dll ;
	  STRING cGUIDStruc, ;
	  STRING @cGUID, ;
	  LONG nSize
	__wwApiDeclatationsAPI  = .T.
ENDIF
    
ENDFUNC
* Init
```

which loads all those API declarations only once.

This is a neat trick that I've applied to a few key APIs that are in heavy use in Web Connection recently to see a nice speed bump for a few common operations for the trade off of a few extra `PUBLIC` boolean variables bumping around in memory which is a small price to pay for the slight performance gain.

### Caveat: CLEAR DLLS can break this!
Both of these approaches - per declaration or per block - do come with a Caveat: It is possible for some other code to do `CLEAR DLLS` and that will break subsequent API calls because the DLLS unload but the variable stays set. 

### Not for Every API Call
To be clear you don't need to do this for **every** API call. There's no need to do this say for this API call:

```fox
FUNCTION WinApi_Sleep(lnMilliSecs, llWithDoEvents)
LOCAL lnX, lnBlocks

lnMillisecs=IIF(type("lnMillisecs")="N",lnMillisecs,0)

DECLARE Sleep ;
  IN WIN32API ;
  INTEGER nMillisecs

IF !llWithDoEvents OR lnMillisecs < 200   
   Sleep(lnMilliSecs)    
   RETURN
ENDIF

*** Create 100ms DOEVENTS loop to keep UI active
lnBlocks = lnMilliSecs / 100
FOR lnX = 1 TO lnBlocks - 1 
   Sleep(100)
   DOEVENTS
ENDFOR

ENDFUNC
```

 

### Watch for pre-mature Optimization
This is obviously an operation that's meant to be slow so need to speed it up. It also isn't necessary for UI related tasks, or basically anything that needs to be called only occasionally. It's only for things that are used on the critical path and especially operations that might occur in a tight loop or many times.
  
The previous examples of `JsonString` is a good example - that method is called quite frequently when serializing objects. An array or collection may have hundreds of objects when many string properties for example and there it makes a big difference.

Likewise in Web Connection there's a `UrlDecode()` function that calls into wwIPStuff.dll to decode larger strings. For large input forms in a Web application that method may be called 100 times successively and again that does end up making a difference.

So choose wisely.

## Summary
API calls are one of the earliest Interop features in the FoxPro language and they provide a powerful and potentially fast interface to external functionality in Win32 DLL code.

Just remember that Declaring your API may have significantly more overhead than actually calling it so for critical path operations either declare the API up front or use the gate-keeper trick I showed above to bracket the code and load the declarations only once for the lifetime of the application.
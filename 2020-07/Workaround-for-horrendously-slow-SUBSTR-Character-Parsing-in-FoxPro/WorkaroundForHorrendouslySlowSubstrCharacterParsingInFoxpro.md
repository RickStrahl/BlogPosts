---
title: Workaround for horrendously slow SUBSTR Character Parsing in FoxPro
featuredImageUrl: https://west-wind.com/wconnect/weblog/imageContent/2025/Workaround-for-horrendously-slow-SUBSTR-Character-Parsing-in-FoxPro/FoxSlowBanner.jpg
abstract: FoxPro's string speed is reasonably good for most operations. But one shortcoming is character by character parsing which can only be accomplished via the `SUBSTR()` command, which as it turns out is horribly slow when strings get large. In this post I describe the problem and offer a couple of solutions to get better character by character parsing speed for string iteration.
keywords: FoxPro, SUBSTR, Performance, Speed, Parser
categories: FoxPro
weblogName: Web Connection Weblog
postId: 962
postDate: 2020-07-03T13:05:32.9792110-07:00
postStatus: publish
dontInferFeaturedImage: false
stripH1Header: true
---
# Workaround for horrendously slow SUBSTR Character Parsing in FoxPro

![Fox Slow Banner](FoxSlowBanner.jpg)

FoxPro string processing generally is reasonably fast. String processing has always been optimized with a number of optimizations that make FoxPro - despite its age - reasonably competitive when it comes to effective string processing.

But there's an Achilles heel in the string processing support: There's no decent high performance way to iterate a string character by character. If you are building system components like parsers that's a key feature and it's one that FoxPro - and there is no other way to say this - sucks at.

##AD## 

### SUBSTR(): Slow as Heck
The FoxPro SUBSTR() function is the only native language function that you can use to iterate over string character by character:

```foxpro
FOR lnX = 1 to LEN(lcString)
   lcChar = SUBSTR(lcString,lnx, 1)
ENDFOR
```

At first glance this seems fine. If you work with small strings this is reasonably fast and there's no problem. But if the longer the string gets the slower this function becomes. 

How slow? Very! Consider this 1mb string and parsing through it character by character:

```foxpro
*** Warning this code will lock FoxPro for a long time!
LOCAL lnX, lcString
lcString = REPLICATE("1234567890",1000000)

lnLength = LEN(lcString)
TRANSFORM(lnLength,"9,999,999")

IF .T.
lnSecs = SECONDS()

FOR lnX = 1 TO lnLength
   lcVal = SUBSTR(lcString,lnX,1)
ENDFOR

*** 35 seconds! Holy crap... 
? "SUBSTR: " +  TRANSFORM(SECONDS() - lnSecs )

ENDIF
```

Yikes! On my machine this takes an eternity of 35 seconds. Doubling the iterations makes this take nearly 3 minutes! In other words, the slowdown isn't linear - it gets much worse as the size increases.

Here's how this shakes out (on a reasonably fast, high end I7 Dell XPS laptop):

* 1mb - 35 seconds
* 2mb - 168 seconds 
* 3mb - 525 seconds

Yikes. I would argue even the 1mb use case is totally unusable let alone larger strings.

Bottom line:  

**SUBSTR() is slow as shit on large strings!**

### Does this matter?
For most types of applications it's rare that you need to iterate over a string 1 character at a time. But there are some applications where that's necessary especially if you're building system components like parsers - of which I've built a few over the years and every time I look into it I run into the `SUBSTR()` issue.

A few years back I built my first version of a JSON parser in FoxPro code. A text parser typically needs to read strings a character at a time to determine what to do with the next character, using a sort of state machine. I figured out **right away** that using `SUBSTR()` wasn't an option for this. It was **horrendously** slow once string sizes got even moderately large. I opted for some other approaches that would read to specific string bound using string extraction and while that actually provided decent performance it resulted in a number of artifacts and inconsistencies that required workarounds and ended up being a constant flow of incoming special case scenario bugs. Very unsatisfying.

The performance was so bad that I ended up throwing away the original parser and instead opted to use a .NET based parser (Newtonsoft.Json) and capturing the results as FoxPro objects. Even with all the COM interop involved this solution ran circles around the native implementation and as a side effect has been rock solid because the JSON parser is a hardened and dedicated component that is regular updated and patched.

### Is there a WorkAround?
Natively FoxPro doesn't offer any good workarounds for the `SUBSTR()` quandry. However, if you really need this functionality there are a few ways you can get around it using creative alternatives.

Two that I found are:

* Using `wwDotnetBridge::ComArray` on `.ToCharArray()`
* Using a file and `FREAD(lnHandle,1)`


### wwDotnetBridge and `ToCharArray()`
Since FoxPro natively doesn't have a solution, it's reasonable to hold the data in another environment and then retrieve the data. One option for this is to use .NET and [wwDotnetBridge](https://github.com/RickStrahl/wwDotnetBridge) which provides for the ability to store a string in .NET and manipulate it without loading the string or a character array thereof into FoxPro.

Here's what you can do with wwDotnetBridge to parse a string character by character:

```foxpro
do wwDotNetBridge
loBridge = GetwwDotnetBridge()

lnSecs = SECONDS()

* Returns a COM Array object
loStringArray = loBridge.InvokeMethod(lcString,"ToCharArray")
lnLength = loStringArray.Count

FOR lnX = 0 TO lnLength -1
	lcVal = CHR(loStringArray.Item(lnX))
ENDFOR

* ~ 2.5 seconds (still not very quick really) - in .NET same iteration takes 0.03 seconds
? "wwDotnetBridge ToCharArray(): " + TRANSFORM( SECONDS() - lnSecs ) 

ENDIF
```

2.5 seconds - while still not blazing fast - is considerably better. Performance of this solution is also linear - doubling the string size roughly doubles the time it takes to process plus a little extra overhead, but overall, linear.

The way this works is that `wwDotnetBridge.InvokeMethod()` returns arrays as a `ComArray` structure where the actual array isn't passed to FoxPro but stays in a separately stored value in .NET. The `.Item()` method then retrieves an indexed value out of the array which is very fast in .NET.

While better than `SUBSTR()` for large strings, this approach is not as fast as it could be, because there's a lot of overhead in the COM Interop involved in retrieving the individual value from the array. Still the performance with this at least is predicatable and linear.

#### Using FREAD() to Iterate
Another creative solution that doesn't require an external component like wwDotnetBridge is to use low level file functions to:

* Dump the string to a file
* Open and read the file 1 byte at a time
* Close the File
* Delete the file

This seems very inefficient, but file operations on a local drive are actually blazingly fast. The actual file read operations are buffered so reading the bytes is fast. Most of the overhead of this solution is likely to come from dumping the file to disk and then deleting it when you're done with the string.

#### String Splitting
After I posted this article and replied to an original posting [on the Universal Thread, Marco Plaza replied](https://www.levelextreme.com/Home/ViewPage?Activator=1018&ID=1675102) with another **even better** and more performant solution that involves breaking the large string up into small chunks and then running `SUBSTR()` against that.

I made a few tweaks to Marcos version by making the code more generic so it doesn't hardcode the sizes:

```foxpro
lnSecs = SECONDS()

lnCount = 0
lnBuffer = 3500
FOR lnX = 0 TO 9999999999
	lcSub = SUBSTR(m.lcString,(lnX*lnBuffer)+1,lnBuffer)
	lnLen = LEN(lcSub)
	IF (lnLen < 1)
	    EXIT
	ENDIF
	For lnY = 1 To lnLen
		lcVal = Substr(lcSub,lnY,1)
		* lnCount = lnCount + 1  && to make sure right iterations are used
	Endfor
ENDFOR

* 0.35 seconds 
? "String Splitting: " + TRANSFORM( SECONDS() - lnSecs )  + " " + TRANSFORM(lnCount)
```

##AD##

### A few Results to Compare
To test this out I set up a small example:

```foxpro
CLEAR

* 1mb string
LOCAL lnX, lcString
lcString = REPLICATE("1234567890",100000)

lnLength = LEN(lcString)
? "Iterations: " + TRANSFORM(lnLength,"9,999,999")

IF .T.
lnSecs = SECONDS()

FOR lnX = 1 TO lnLength
   lcVal = SUBSTR(lcString,lnX,1)
ENDFOR

*** 35 seconds
? "SUBSTR: " +  TRANSFORM(SECONDS() - lnSecs )

ENDIF

IF .T.
do wwDotNetBridge
LOCAL loBridge as wwDotNetBridge
loBridge = GetwwDotnetBridge()

lnSecs = SECONDS()

* Returns a COM Array object
loStringArray = loBridge.InvokeMethod(lcString,"ToCharArray")
lnLength = loStringArray.Count
FOR lnX = 0 TO lnLength -1
	lcVal = CHR(loStringArray.Item(lnX))
	*lcVal = loBridge.GetIndexedproperty(loStringArray.Instance,lnX)
ENDFOR

* ~ 2.5-2.9 seconds (still not very quick really) - in .NET same iteration takes 0.03 seconds
? "wwDotnetBridge ToCharArray(): " + TRANSFORM( SECONDS() - lnSecs ) 

ENDIF


IF .T.

lnSecs = SECONDS()

STRTOFILE(lcString,"c:\temp\test.txt")
lnHandle = FOPEN("c:\temp\test.txt",0)

DO WHILE !FEOF(lnHandle)
  lcVal = FREAD(lnHandle,1)
ENDDO
FCLOSE(lnHandle)
ERASE("c:\temp\test.txt")

* 3.6 seconds 
? "FREAD : " + TRANSFORM( SECONDS() - lnSecs ) 

ENDIF
```

Running this with:

#### 1,000,000
The divergence here is so large that `SUBSTR()` is basically unusable at this size:

* SUBSTR: 35s
* ToCharArray: 2.6
* FREAD: 3.7
* Split: 0.319

#### 500,000
Here `SUBSTR()` is borderline but already very slow to process the string. 

* SUBSTR: 8.62s
* ToCharArray: 1.32
* FREAD: 1.85
* Split: 0.022


#### 100,000
Here SUBSTR() is roughly on par with the .NET solution. This is roughly the tipping point where `SUBSTR()` becomes significantly less efficient for anything larger.

* SUBSTR: 0.26
* ToCharArray: 2.66
* FREAD: 0.39
* Split: 0.319


#### 10,000
At smaller sizes `SUBSTR()` performs considerably better than the other solutions. here you can see that `SUBSTR()` is 10x faster than the other solutions.

* SUBSTR: 0.003
* ToCharArray: 0.025
* FREAD: 0.041
* Split: 0.002



##AD##

### Summary
From the results above it would appear that `SUBSTR()` is reasonably fast up to about 100kb string, but anything larger than that and its performance starts dropping of extremely quickly and if you need to parse character by character you really need to look at other approaches.

Once that happens you need to really look at one of the alternatives. Marco's string splitting approach is **by far** the fastest solution, but it'll require a bit of logic to make sure you're iterating the string correctly (inner and outer loops) - if you need to grab the individual character in several places and it's not easily isolated into a single location the double loop approach can be tricky to keep consistent. The wwDotnetBridge approach also works reasonably fast and other than the initial string load, retains basically the same behavior as `SUBSTR(). But then again - if you're running into perf issues because your strings are too big you'll probably want to go with the fastest possible solution which is the string splitting.

It's not too often that you'll need this sort of code, but it's good to know there are workarounds to make this work if necessary.


<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
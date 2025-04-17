---
title: JavaScript JSON Date Parsing and real Dates
abstract: JavaScript doesn't have a date literal, and for this reason JSON serializes dates as strings rather than real JavaScript dates. In this post I show how JSON date serialization works, a few approaches how you can manage dates and how to automate the process of converting JSON dates to 'real' dates more easily.
categories: JavaScript,HTML
keywords: Date,JSON,ISO 8601,parse
weblogName: West Wind Web Log
postId: 197764
postDate: 2014-01-06T18:20:41.4753134-10:00
---
# JavaScript JSON Date Parsing and real Dates

JSON has become a rather prevalent serialization format in recent years. For Web based applications one could say it’s become *the* serialization format. It’s used for transport serialization for just about anything REST related these days, for configuration management, for storage and data representation in many database formats (NoSql). But yet there’s at least one very annoying problem with JSON: It doesn’t serialize dates. Or more precisely – it serializes dates just fine, it just doesn’t deserialize them.

I’ve talked about this topic a few times in the past, but I thought I’d revisit because it’s one that comes up quite frequently, and because in the interceding years I’ve started using a more flexible solution than what I previously discussed. In this post I’ll discuss the problem and a few workarounds as well as small JSON extension library that you can use to globally parse JSON with proper date conversion with minimal fuss.

The code and small support library discussed in this post is up on [GitHub in my json.date-extensions library](https://github.com/RickStrahl/json.date-extensions), so you can download and play around with this yourself. I find this functionality indispensable and use as part of my own libraries in just about every client-side application that uses AJAX.

### JSON Dates are not dates – they are Strings

The problem with dates in JSON – and really JavaScript in general – is that JavaScript doesn’t have a date literal. You can represent strings, numbers, Booleans and even objects, arrays and RegEx expressions with language specific literals, but _there’s no equivalent literal representation for dates_. Which seems like a rather major omission given that dates are pretty important in computing and business environments.

In order to represent dates in JavaScript, JSON uses a specific string format – [ISO 8601](http://www.w3.org/TR/NOTE-datetime) – to encode dates as string. There’s no ‘official’ standard for what the date format should look like, although it’s been more or less agreed upon that the JSON Date encoding format should be **ISO 8601** as that’s what all the major browser native JSON parsers use. Dates are encoded as **ISO 8601** strings, but the `JSON.parse()` method **does not automatically deserialize those ISO 8601 string back into dates**. 

_You can serialize to this format, but there’s no direct deserialization back to a date from it._

> JSON parsers for other languages - like various .NET parsers like [JSON.NET](https://www.newtonsoft.com/json) - tend to support **date deserialization** so this is not a problem outside of JavaScript.

### Json Dates

A JSON encoded date is basically a string with a special format. Since there is no Date Literal in JavaScript an encoded string value is used. A JSON encoded date looks like this:

**"2014-01-01T23:28:56.782Z"**

The date is represented in a standard and sortable format that represents a UTC time (indicated by the Z). ISO 8601 also supports time zones by replacing the Z with + or – value for the timezone offset:

**"2014-02-01T09:28:56.321-10:00"**

There are other variations of the timezone encoding in the **ISO 8601 spec**, but the –10:00 format is the only TZ format that current JSON parsers support. In general it’s best to use the UTC based format (Z) unless you have a specific need for figuring out the time zone in which the date was produced (possible only in server side generation).

There have been other date formats in the past – namely Microsoft’s MS AJAX style date - `\/Date(454123112)/\` - which Microsoft used in their original AJAX and REST products (Microsoft AJAX and WCF REST specifically), but which thankfully have disappeared in new frameworks (ASP.NET Web API, Nancy, ServiceStack etc.) in favor of ISO style dates that are now ubiquitous.

##AD##

### How Date Parsing Works with JSON Serializers

To encode a date with JSON you can just use the standard JSON serializer’s stringify() method:

```javascript
var date = new Date();
console.log(date); // Wed Jan 01 2014 13:28:56 GMT-1000 (Hawaiian Standard Time) 
        
var json = JSON.stringify(date);
console.log(json);  // "2014-01-01T23:28:56.782Z"
```

This produces a JSON encoded string value:

**"2014-01-01T23:28:56.782Z"**

If you now want to deserialize that JSON date back into a date you’ll find that JSON.parse() doesn’t do the job. If you try:

```javascript
// JSON encoded date
var json = "\"2014-01-01T23:28:56.782Z\"";

var dateStr = JSON.parse(json);  
console.log(dateStr); // 2014-01-01T23:28:56.782Z
```

You’ll find that you get back… drum roll… a string in dateStr:

**2014-01-01T23:28:56.782Z**

No quotes this time – it’s no longer a JSON string, but a string nevertheless. This is because the JSON created is in fact a string and JSON.parse() doesn’t know anything other than that the encoded date value is a string, so that’s what you get back. Fun, ain’t it?

### Decoding the Date

The good news – and maybe not very widely known news at that – is that ISO dates can be easily converted into JavaScript dates by use of the flexible JavaScript Date constructor. The date constructor accepts a wide variety of inputs to construct a date, ISO 8601 amongst them.

The following turns the ISO date back into a ‘real’ date:

```javascript
// JSON encoded date
var json = "\"2014-01-01T23:28:56.782Z\"";

var dateStr = JSON.parse(json);  
console.log(dateStr); // 2014-01-01T23:28:56.782Z
        
var date = new Date(dateStr);
console.log(date);  // Wed Jan 01 2014 13:28:56 GMT-1000 (Hawaiian Standard Time)
```

Note that the string that is passed to `new Date()` has to be a **plain string**, not a JSON string so make sure if there are quote wrappers around a JSON string to remove the quotes.

This works nicely for single dates, but unfortunately it’s a bit of a pain if you get back complex objects that contain dates: An object with a few date fields or an array containing objects with date fields requires that you to fix up each of the values at the point of use. In an application means you’d have to manually replace dates every time you use them or do any sort of date math.

It works, but you have to be careful in your usage of these pseudo date strings, always remembering that they have to be converted manually when you use them.

### JSON Parser Extensions

One way around this date problem is to extend the JSON parser to automatically convert the ISO string dates into real JavaScript dates. 

The `JSON.parse()` method supports an optional filter function parameter that can be passed to transform values as they are parsed. We can check each of the key value pairs for each property as its parsed and look for strings that look like dates and automatically transform them into dates.

It’s only a short bit of code:

```javascript
if (window.JSON && !window.JSON.dateParser) {
    var reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
    var reMsAjax = /^\/Date\((d|-|.*)\)[\/|\\]$/;
   
    JSON.dateParser = function (key, value) {
        if (typeof value === 'string') {
            var a = reISO.exec(value);
            if (a)
                return new Date(value);
            a = reMsAjax.exec(value);
            if (a) {
                var b = a[1].split(/[-+,.]/);
                return new Date(b[0] ? +b[0] : 0 - +b[1]);
            }
        }
        return value;
    };

}
```

This parser also handles MS AJAX dates. If you don’t care about that you can remove that bit of code making the date parser a bit faster.

Using this date parser you can now add that to the call to `JSON.parse()`:

```javascript
var date = JSON.parse(json,JSON.dateParser);  
console.log(date);
```

which produces a JavaScript date.

This also works on complex objects so if you have and object like this:

```javascript
{   
    "id": "312saAs1",    
    "name": "Jimmy Roe",
    "entered": "2014-01-01T23:28:56.782Z",
    "updated": "2014-01-01T23:28:56.782Z"
}
```

both the entered and updated properties will be parsed to dates. If you have an array of these objects – all the dates are still converted. This much better but still limited in that you have to manually call JSON.parse() in order to apply the filter function.

##AD##

### Taking over JSON.parse()

This works fine if you manually parse the JSON yourself, but it’s unlikely that you do your own JSON parsing in your applications. Most likely JSON is parsed for you by a library of some sort like jQuery, or AngularJs or any other framework. In that case you have no control over the JSON parsing because the parsing happens deeply buried inside of a framework. jQuery and other libraries allow overriding their processing as well, but you don’t really want to do this for every application/page and each framework you use.

The common denominator here is the JSON parser itself. What if we can just take over the parser? What if we could – at the beginning of the page perhaps – override the JSON parser to actually use our behavior instead of the stock behavior?

To do this we can create a few additional functions and provide for a way to switch the parser:

```javascript
if (this.JSON && !this.JSON.dateParser) {
    var reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
    var reMsAjax = /^\/Date\((d|-|.*)\)[\/|\\]$/;

    /// <summary>
    /// set this if you want MS Ajax Dates parsed
    /// before calling any of the other functions
    /// </summary>
    JSON.parseMsAjaxDate = false;

    JSON.useDateParser = function(reset) {
        /// <summary>
        /// Globally enables JSON date parsing for JSON.parse().
        /// replaces the default JSON parser with parse plus dateParser extension 
        /// </summary>    
        /// <param name="reset" type="bool">when set restores the original JSON.parse() function</param>

        // if any parameter is passed reset
        if (typeof reset != "undefined") {
            if (JSON._parseSaved) {
                JSON.parse = JSON._parseSaved;
                JSON._parseSaved = null;
            }
        } else {
            if (!JSON.parseSaved) {
                JSON._parseSaved = JSON.parse;
                JSON.parse = JSON.parseWithDate;
            }
        }
    };

    JSON.dateParser = function(key, value) {
        /// <summary>
        /// Globally enables JSON date parsing for JSON.parse().
        /// Replaces the default JSON.parse() method and adds
        /// the datePaser() extension to the processing chain.
        /// </summary>    
        /// <param name="key" type="string">property name that is parsed</param>
        /// <param name="value" type="any">property value</param>
        /// <returns type="date">returns date or the original value if not a date string</returns>
        if (typeof value === 'string') {
            var a = reISO.exec(value);
            if (a)
                return new Date(value);

            if (!JSON.parseMsAjaxDate)
                return value;

            a = reMsAjax.exec(value);
            if (a) {
                var b = a[1].split(/[-+,.]/);
                return new Date(b[0] ? +b[0] : 0 - +b[1]);
            }
        }
        return value;
    };

    JSON.parseWithDate = function(json) {
        /// <summary>
        /// Wrapper around the JSON.parse() function that adds a date
        /// filtering extension. Returns all dates as real JavaScript dates.
        /// </summary>    
        /// <param name="json" type="string">JSON to be parsed</param>
        /// <returns type="any">parsed value or object</returns>
        var parse = JSON._parseSaved ? JSON._parseSaved : JSON.parse;
        try {
            var res = parse(json, JSON.dateParser);
            return res;
        } catch (e) {
            // orignal error thrown has no error message so rethrow with message
            throw new Error("JSON content could not be parsed");
        }
    };

    JSON.dateStringToDate = function(dtString, nullDateVal) {
        /// <summary>
        /// Converts a JSON ISO or MSAJAX date or real date a date value.
        /// Supports both JSON encoded dates or plain date formatted strings
        /// (without the JSON string quotes).
        /// If you pass a date the date is returned as is. If you pass null
        /// null or the nullDateVal is returned.
        /// </summary>    
        /// <param name="dtString" type="var">Date String in ISO or MSAJAX format</param>
        /// <param name="nullDateVal" type="var">value to return if date can't be parsed</param>
        /// <returns type="date">date or the nullDateVal (null by default)</returns> 
        if (!nullDateVal)
            nullDateVal = null;
            
        if (!dtString)
            return nullDateVal; // empty

        if (dtString.getTime)
            return dtString; // already a date
            
        if (dtString[0] === '"' || dtString[0] === "'")
            // strip off JSON quotes
            dtString = dtString.substr(1, dtString.length - 2);

        var a = reISO.exec(dtString);
        if (a)
            return new Date(dtString);

        if (!JSON.parseMsAjaxDate)
            return nullDateVal;

        a = reMsAjax.exec(dtString);
        if (a) {
            var b = a[1].split(/[-,.]/);
            return new Date(+b[0]);
        }
        return nullDateVal;
    };
}
```


You can find the [current source on GitHub](https://github.com/RickStrahl/json.date-extensions/blob/master/src/json.date-extensions.js).

First there’s a specific function added to the JSON object called .parseWithDate() which can be called internally or explicitly instead of .parse(). .parseWithDate() is just a wrapper around .parse() with the dateParser applied so dates are automatically converted.

We can then create a .useDateParser() function which can swap the parser by replacing the stock parser with JSON.parseWithDate(). By replacing the JSON.parse() method with .parseWithDate() the date parsing behavior is basically made global and is applied to all JSON.parse() operations. .useDateParser() is meant to be called at the beginning of the page before any JSON requests are made, and affects any JSON parsing requests made after it. There’s also support for restoring the original parser by passing any parameter.

To use this you would call JSON.useDateParser() somewhere at the top of your script hierarchy:

```javascript
<script src="jquery.min.js"></script>
<script src="JsonDateExtensions.js"></script>
<script>
    // use date parser for all JSON.parse() requests
    // make sure to call before any JSON conversions
    JSON.useDateParser();
</script>
<script>
    // other libs
    // page script code etc.
</script>
```

Let’s look at an example. Assume we have a JSON object we’re requesting from the server that has a couple of date properties – update and entered.

```javascript
{   
    "id": "312saAs1",    
    "name": "Jimmy Roe",
    "entered": "2014-01-01T13:13:34.441Z",
    "updated": "2014-01-03T23:28:56.782Z"
}
```

Now we want to access this JSON data with jQuery’s $.getJSON() like this:

```javascript
$.getJSON("JsonWithDate.json")
    .done(function (data) {
        console.log("result.entered: " + data.entered +
                    "  result.updated: " + data.updated);
    });
```

If you do nothing, you get the default JSON parsing in jQuery which doesn’t convert dates and leaves the ISO strings:

**result.entered: 2014-01-01T23:28:56.782Z  
result.Updated: 2014-01-01T23:28:56.782Z**

But, if you now add the generic function code shown above followed by a call to JSON.useDateParser() near the top of the script hierarchy of the page:

**JSON.useDateParser()**

and then re-run that same jQuery AJAX call you now get:

**result. Entered: Wed Jan 01 2014 13:34:56 GMT-1000 (Hawaiian Standard Time)  
result.Updated: Wed Jan 03 2014 23:28:56 GMT-1000 (Hawaiian Standard Time)**

The latter creates real dates. As will any other framework that uses the native JSON parsers in JavaScript. This means that by replacing the JSON.parse() method we have effectively overriden the JSON parser so that all JSON.parse() calls now do the date parsing including the external jQuery.getJSON() call or any other framework code that I don’t control. In effect, the date parsing support is now global.

Because the setting is page or scope global, you can also reset the original parser by using:

**JSON.useDateParser(false)**

This restores the default JSON parser and restores the original ISO date string behavior.

### Caveats of overriding JSON Parsing

There are a couple of caveats to doing a wholesale behavior change like this to the JSON parser. First you are in fact changing behavior when you apply this parser and if there is existing code that relies on the existing date ISO format of dates, that will of course cause problems. I’ve been using automatic date conversions for quite a while though with a variety of frameworks, and I haven’t run into any problem yet, so this is probably not a big issue, but still be aware of it.

##AD##

The other caveat of a JSON parse filter is that it is a filter and it slows down JSON parsing. Because parse filters are fired for every key of a JSON document and the code then checks each string value for two RegEx expressions, there’s definitely some overhead. Not a huge amount (about 3-5% in my informal tests of a 10k JSON blocks) but there is definitely some overhead… Probably not enough to worry about, but make sure you test your specific scenarios especially if you have large JSON data sets you’re pushing around in your app.

### Do you really need Dates?

A discussion of dates in serialization wouldn’t be complete without mentioning that the best way to handle dates in UI applications is to not use dates. Ha! No I’m not trying to be snarky, but the best date format is one that you don’t have to format – on the client.

If you’re pushing data from the server to display on the client, consider formatting the date on the server. Native JavaScript date formatting sucks unless you add yet another library ([moment.js](http://momentjs.com/) is a good one) to your page, and you have all the tools necessary to format dates easily on your server. Rather than pushing down date values to the client consider pushing preformatted date strings in your ViewModels. This alone will reduce date usage significantly on the client.

Also when you’re doing date input from the user, it’s often much easier to just accept string values and push those to the server. The JSON.NET parser understands a lot of different date formats including human readable ones and can parse that out of JSON when you push your dates back up to the server using ASP.NET Web API or ASP.NET MVC.

With the advent of purely client side SPA style applications this is getting more common now, but often this still can be addressed via server side formatting.

If you can avoid parsing dates on the client, avoid it and format on the server.

### Sometimes Dates are necessary

That leaves real date requirements on the client where the client has to actively work and manipulate dates and for those cases real JSON date parsing is highly useful.

It seems silly to actually having this discussion. A serializer without date formatting support just seems… silly, if you really think about it. But then this is JavaScript and there are lots of things that are just plain silly.

If you do need to get dates into the client and if you actually send dates from the server, then a global way of date deserialization certainly makes life a lot easier than having to manually translate dates at every usage point in your front end code. And for that these routines I described here have been very useful to me. I hope some of you get some utility out of them as well.

### Resources

*   [**JSON Parser Date Extensions GitHub Project**](https://github.com/RickStrahl/json.date-extensions)
*   [**moment.js JavaScript Date Parsing Library**](http://momentjs.com/)
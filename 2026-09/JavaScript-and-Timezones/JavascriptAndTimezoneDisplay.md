---
title: 'Back to Basics: JavaScript and Timezones'
abstract: JavaScript's native `Date` object internally tracks UTC instants but defaults to local time for display, leading to common timezone pitfalls. In this post, I describe how to manage and display timezones using various JavaScript APIs old and new from the old and trusty `Date` object, `INTL.DateTimeFormat()` and the newish `Temporal` class.
keywords: DateTime, Formatting, Instant, INTL.DateTimeFormat, Temporal
categories: JavaScript, HTML
weblogName: West Wind Weblog (BlazePost API)
postId: u33738s1e975
permalink: https://weblog.west-wind.com/posts/2026/Sep/01/JavaScript-and-Timezones
featuredImageUrl: https://weblog.west-wind.com/imageContent/2026/JavaScript-and-Timezones/TimeZoneBanner.jpg
stripH1Header: true
postStatus: publish
postDate: 2026-09-01T21:31:22.6579980-07:00
---
# Back to Basics: JavaScript and Timezones

![Time Zone Banner](./TimeZoneBanner.jpg)

Classic native `Date` values in JavaScript are internally represented as UTC dates. However, when you display values they are by default shown as local date/time values. I've run into this recently again with an application that was returning a mix of UTC and non-UTC dates from the server to the browser, causing some confusion. At that point I realized I was being inconsistent with my use of the my date display functions, and here I am reviewing various Date formatting and Date conversion operations.

JavaScript's core behavior is consistent once you separate two different concepts:

* The instant represented by a Date
* The timezone used to display that instant

An instant is essentially an instant in time expressed in an offset since the **Unix Epoch**:  

**January 1, 1970 00:00:00 UTC**

The instant is represented via `new Date().getTime()` or a more precise value of `Temporal.Instant` which represents the unique point in time, with nanosecond precision. It is fundamentally represented as the number of nanoseconds since the Unix epoch (midnight at the beginning of January 1, 1970, UTC), without any time zone or calendar system.

##AD##

The most common usage of dates is via the `Date` object and its methods. Dates are stored as UTC values, but standard display of dates in the browser UI or via the debug tools shows dates in **local time**.

So when you output a date it looks like this (`PST` or `America/Los Angeles` timezone in this case):

```js
new Date()
// Mon Aug 24 2026 11:33:26 GMT-0700 (Pacific Daylight Time)
```

my current `PST` timezone value is displayed with `toString()` or any string concat operation. Notice that the date formatter automatically adjusts for Daylight savings time of the active timezone.

I also get a time adjusted value, if I explicitly convert the value using `toLocaleTimeString()` which gives me just the time value as a string:

```js
new Date().toLocaleTimeString()
// '11:33:46 AM'
```

I can also go the other way - if I want to actually display the UTC value I can use the following:

```js
new Date().toLocaleTimeString(undefined, { timeZone: "UTC" });
'6:33:43 PM'
```

I can also specify any specific defined timezone using the familiar timezone abbreviations:

```js
new Date().toLocaleTimeString(undefined, { timeZone: "EST" });
// '1:34:02 PM'
```

or using a full [IANA Time Zones](https://timeapi.io/documentation/iana-timezones) identifier:

```js
new Date().toLocaleTimeString(undefined, { timeZone: "America/New_York" });
// '1:34:02 PM'
```

> ##### @icon-duotone-lightbulb Get your Local Timezone
> If you're like me you're probably used to seeing timezone values represented by their shortcut names like `PST`, `EST`, `CET` etc., but officially JavaScript uses [IANA Time Zones](https://timeapi.io/documentation/iana-timezones) which are represented like `America/Los_Angeles`, `Pacific/Honolulu`, `Europe/Berlin` etc. There are actually many overlapping formats such as `Pacific/Honolulu`, `US/Hawaii` and `HST` for my Hawaii timezone that all represent the same UTC -10 timezone.
>
>I'm in Hood River (near Portland, OR) currently, but the active PST timezone that gets returned is `America/Los_Angeles`, which seems semantically very wrong, but does represent the correct UTC -8 timezone.
>
> You can find out the local timezone like this:
>
> ```js
> Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
>    .resolvedOptions().timeZone;
> // 'America/Los_Angeles'
> ```
>
> or for the abbreviation.
>
> ```js
> new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
> .formatToParts(new Date())
> .find(x => x.type === "timeZoneName")?.value;
> // PDT
> ```

## Dates are Instants, Display is Local
The most important thing to keep in mind is this:

```js
const date = new Date("2026-08-24T18:33:46.000Z");

date.toISOString();
// '2026-08-24T18:33:46.000Z'

date.toString();
// 'Mon Aug 24 2026 11:33:46 GMT-0700 (Pacific Daylight Time)'
```

`toISOString()` returns the instance UTC value with no date time offset regardless of whether the instance has a timezone or not ie. `2026-08-24T18:33:46.000Z`. The `Z` at the end indicates the UTC timezone.

`toString()` and most other date output functions return **local time** values adjusted for the current timezone.

This is where JavaScript can be confusing because many `Date` methods are split between local-time and UTC-time versions:

```js
const date = new Date("2026-08-24T18:33:46.000Z");

date.getHours();
// 11   local time for me

date.getUTCHours();
// 18   UTC time
```

Yeah that `.getHours()` value is confusing if the time instance is a UTC value, but the bottom line is that any of the 'standard' date operations use local dates unless you explicitly use the UTC or ISO functions.

##AD##

## Formatting Dates with Intl.DateTimeFormat
You can use `toLocaleString()` to format dates and times, but if you want more control you can use the `Intl.DateTimeFormat` object which makes formatting more explicit and reusable.

```js
const formatter = new Intl.DateTimeFormat(undefined, {
	dateStyle: "medium",
	timeStyle: "short"
});

formatter.format(new Date("2026-08-24T18:33:46.000Z"));
// 'Aug 24, 2026, 11:33 AM'  // on my machine
```

The first parameter of the constructor is the **locale** ie. `en-US` or `de-DE`. Passing `undefined` use the current user's locale.

To override for a specific timezone you can explicitly specify it as part formatting parameters for `timeZone`. To explicitly show `UTC` time:

```js
const utcFormatter = new Intl.DateTimeFormat(undefined, {
	year: "numeric",
	month: "short",
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
	timeZone: "UTC",
	timeZoneName: "short"
});

utcFormatter.format(new Date("2026-08-24T18:33:46.000Z"));
// 'Aug 24, 2026, 6:33 PM UTC'
```

To show a specific user's timezone formatted for a specific locale:

```js
const newYorkFormatter = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "short",
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
	timeZone: "America/New_York",
	timeZoneName: "short"
});

newYorkFormatter.format(new Date("2026-08-24T18:33:46.000Z"));
// 'Aug 24, 2026, 2:33 PM EDT'
```

### Serve me this, Client me That
The way that timezone display works in browsers makes sense 99% of the time as you typically want to display the timezone as local in the client browser.

But it gets a lot more complicated when the dates are server rendered or passed from the server to the client via API calls. The issue here is that the dates on the server might be stored for a specific timezone and perhaps are even returned with that timezone information encoded into the JSON payload.

This is why most applications store dates dates as UTC and then adjust the value on the client or on the server based on user preferences configured.

UTC dates are most consistent, but for users displaying a UTC date is definitely not ideal. It might work for logs or other systems related information, but for end users local time or a selected timezone display is a requirement.

For many applications I like the second option for user-facing screens: send the timestamp as UTC or ISO 8601 in the HTML, then let client-side JavaScript render it into the user's actual local timezone - potentially adjusted for a user specified timezone.

For example:

```html
<time datetime="2026-08-24T18:33:46.000Z" class="local-time">
	2026-08-24 18:33 UTC
</time>
```

and then for browser local time:

```js
const formatter = new Intl.DateTimeFormat(undefined, {
	year: "numeric",
	month: "short",
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
	timeZoneName: "short"
});

document.querySelectorAll("time.local-time").forEach(element => {
	const date = new Date(element.dateTime);
	element.textContent = formatter.format(date);
});
```

For a specific timezone you can specify the timezone in the constructor:

```js
let timeZone = userConfig.timeZone;
const formatter = new Intl.DateTimeFormat(undefined, {
	year: "numeric",
	month: "short",
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
    timeZone: timeZone,  // America/Los Angeles or PST
	timeZoneName: "short"
});
```

This gives non-JavaScript clients and crawlers a useful UTC fallback, while normal browser users get a local or user specified timezone display value.

#### Getting the user's TimeZone for the Server
In order for client applications to provide the timezone to the server you can detect the value on the client like this:

```js
Intl.DateTimeFormat().resolvedOptions().timeZone;
// 'America/Los_Angeles'
```

and then send that to the server. AFAIK the client does not send timezone information to the server as part of browser headers by default, so some explicit API call or similar operation is required to communicate the default to the server.

## New JavaScript APIs
The classic JavaScript `Date` object has been around forever and it's not going away. It works fine for many things, especially if you treat it as an instant and use `Intl.DateTimeFormat` for display.

But `Date` is a pretty limited API. It mixes parsing, timestamps, local timezone accessors, UTC accessors, mutable setters, and display helpers into a single object. That's a lot of behavior packed into one small type.

### The newish Temporal API
The newer API to keep an eye on is `Temporal`. Depending on the JavaScript runtime you're targeting you may still need a polyfill, so [check current browser and runtime support](https://caniuse.com/temporal) before using it directly in production code. But conceptually it's a much better model because it separates the things that `Date` blends together.

The important Temporal types are:

* `Temporal.Instant` - a point in time, like a better `Date` timestamp
* `Temporal.PlainDate` - a calendar date without time or timezone
* `Temporal.PlainDateTime` - a date and time without timezone
* `Temporal.ZonedDateTime` - a date and time in a specific timezone

That separation maps much more cleanly to real application data.

For example, an instant displayed in a timezone:

```js
const instant = Temporal.Instant.from("2026-08-24T18:33:46.000Z");

const localTime = instant.toZonedDateTimeISO("America/Los_Angeles");
localTime.toString();
// '2026-08-24T11:33:46-07:00[America/Los_Angeles]'
```

A plain date that doesn't accidentally roll back a day:

```js
const birthday = Temporal.PlainDate.from("2026-08-24");
birthday.toString();
// '2026-08-24'
```

And a timezone-aware future event:

```js
const meeting = Temporal.ZonedDateTime.from({
	year: 2026,
	month: 8,
	day: 24,
	hour: 9,
	minute: 0,
	timeZone: "America/New_York"
});

meeting.toInstant().toString();
// '2026-08-24T13:00:00Z'
```

Even if you don't use Temporal yet, the model is useful: decide whether your value is an instant, a plain date, a local date/time, or a timezone-aware date/time. That decision prevents a lot of downstream confusion. 

PlainDate/PlainDateTime is an odd one - it's time instant **without any time zone associated with it**. It's not UTC, but it's also not specifically tied to any other time zone. These values always print exactly what the values are without any transformation. One example where that's useful is Birthdays, which always are on a certain date and regardless of time zone adjustment stay on that particular date.

Personally I've not used Temporal, yet, but looking at the API I sure can see that it's useful because it allows you to be precise about what type of date you're dealing with. An Instant timestamp, a Plain date or date time value or a timezone specific date and time with the corresponding date formatting string functions to match.

##AD##

## Summary
JavaScript has a fair amount of options for formatting dates and dealing with dates in various time zone formats. The basic `Date` type is limited to using UTC or local time formats, but using `INTL.DateTimeFormat` allows you to create specific time instances that can be set to specific timezones which allows you to adjust dates based on user preferences beyond just the default browser time zone.  
  
The `Temporal` class adds a more specific API for representing Date and Timezone values as a single instance, and goes beyond just displaying timezone adjusted values. I haven't run into a particular use case where this matters, as I typically use UTC dates and only need to display timezone adjusted values, but if you're passing date time values around between different APIs this might be useful.

## Resources
* [IANA Time Zones](https://timeapi.io/documentation/iana-timezones)
* [Intl.DateTimeFormat()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
* [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal)
* [Temporal.Instance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Instant)


<div style="margin-top: 30px;font-size: 0.8em;
            border-top: 1px solid #eee;padding-top: 8px;">
    <img src="https://markdownmonster.west-wind.com/favicon.png"
         style="height: 20px;float: left; margin-right: 10px;"/>
    this post was created and published with the 
    <a href="https://markdownmonster.west-wind.com" 
       target="top">Markdown Monster Editor</a> 
</div>
# Getting JavaScript Properties for Object Maps by Index or Name

![](Puzzlepiece.jpg)

Reflecting over JavaScript object properties, or more commonly object maps, is something that I always forget and have to look up over and over again, so I'm writing it down in hopes I can remember and have an easy place to look it up.

### Iterating over a JavaScript Object
JavaScript has a rudimentary object iteration mechanism built into it so if you have an object and you want to get at all the properties and values of an object you can simply do:

```javascript
var o = { "key1": "value1", "key2": "value2"};
for(var prop in o) {
  console.log(prop,o[prop]);  
}
```

That works but it requires iteration of the entire object which is not always what you want.

### Getting a property by Name
As you can see above it's pretty easy to get a property by name:

```javascript
var o = { "key1": "value1", "key2": "value2"};
var val = o["key2"];   // value2
```

### Getting Object Properties by Index
What's not so straight forward is if you want to get both the value as well as the key - as a key value pair. This seems an odd request at first but it comes up frequently if you need to query or filter the data in any way using map, find or filter functions for example.

Quite frequently I want to be able to retrieve values for a specific key value pair where I may not know what the key name is, but only the index (most commonly the first item).

Enter the `Object.keys()` method which allows you to get a specific property name by index:

```javascript
o = { "key1": "value1", "key2": "value2"};
var idx = 1; // key2

var key = Object.keys(o)[idx];
value = o[key]

console.log(key,value); // key2 value2
```

### JavaScript Maps as Dictionaries
For me I run into this most commonly with object maps. Lots of applications including my own use object maps for holding lists of values or enumerated types. For example, in Markdown Monster I have a list of emoji's that are kept as a map with the markdown expansion (ie `:smile:`) as the key and the actual Emoji character as the value.

We often treat maps as dictionaries to hold look up values. But the interface to do this really sucks because a map is not really a good structure to filter or search because of the clunky object parsing interface you have to go through. However, I still use them because maps happen to serialize much nicer than an explicit object.

So this

```javascript
emojis: { 
        ":100:" : "💯",
        ":1234:" : "🔢",
}    
```

is a bit cleaner than:

```javascript
emojis: { 
        key: ":100:", value: "💯",
        key: ":1234:" value: "🔢"
}    
```

But the latter is easier to deal with if you use array.map/filter/find etc:

```javascript
var match = "key2"
var val = o.find( function(item) { return item.key == match } );
console.log(val);
```

There's really no easy equivalent that you can use for a map that works the same.

### A few simple Helpers
In order query a map  a few helpers come in handy.

The following functions facilitate some of these tasks. Note you can also hang these off the `Object` prototype to make available natively on all objects, but I try to avoid that especially for low use case features like this so the functions below explicitly pass in the object to work on :smile:.

For the following assume we have an object map:

```javascript
var obj = { "key1": "value1", "key2": "value2", ":smile:":"😄"};
```

#### Getting a Value from a Map
As mentioned this doesn't really need any helpers. Just use:

```javascript
var key = "key2";
var value = obj[key]  // value2
value = obj["bogus"]  // undefined
```

If the key doesn't exist you get back `undefined`. If you'd rather throw for this situation:

```javascript
function getMapValue(obj, key) {
   if (obj.hasOwnProperty(key))
      return obj[key];
   throw new Error("Invalid map key."); 
}
```

With that you get:

```javascript
var key = "key2";
var value = getMapValue(obj,key);      // value 2
var value = getMapValue(obj,"bogus");  // Error
```


#### Getting a Key and Value Object from a Map 
As with the previous function if you need to get key value pairs transformed for a map or filter function you can just use this:

```javascript
var key = "key1";
var kvpair = { key: key, value: obj[key] };  
// { key: "key1", value: "value1" }

key = "bogus"
var kvpair = { key: key, value: obj[key] };  
// { key: "bogus", value: undefined }
```

If you want a help that throws for invalid keys:

```javascript
function getMapKeyValue(obj, key) {
   if (obj.hasOwnProperty(key))
      return { key: key, value: obj[key] };
   throw new Error("Invalid map key.");
}
```

```javascript
var key = "key1";
var kvpair = getMapKeyValue(obj,key)
// { key: "key1", value: "value1" }

key = "bogus"
var kvpair = getMapKeyValue(obj,key); // Error
```

#### Get Key and Value by Index
The last scenario is an infrequent iteration one where you may need to get a property by its index. For example, you may have a filtered list where you know there's a fixed result and you just want to grab a specific result - typically the first one.

```javascript
function getMapKeyValueByIndex(obj, idx) {
   var key = Object.keys(obj)[idx];
   return { key: key, value: obj[key] };
}
```

Not a common use case but I found this useful on a few occasions.

#### A few more examples in context

```javascript
o = { "key1": "value1", "key2": "value2", ":smile:":"😄"};
var idx = 0; 

prop = Object.keys(o)[idx];    
value = o[prop]             
console.log(prop,value);   // key1, value1

console.log(getMapValue(o,":smile:"));   // 😄

console.log(getMapKeyValue(o,"key1"));  // { key: "key1", value: "value1" }

console.log(getMapKeyValueByIndex(o,2)); // { key: ":smile", value: "😄" }
```
Again - nothing really new here, but this is meant more as a note to self for myself :smile:.

### Resources

* [CodePen Examples](http://codepen.io/anon/pen/QpKrdZ)


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
<title>Getting JavaScript Properties for Object Maps by Index or Name</title>
<abstract>
Getting value out of maps that are treated like collections is always something I have to remind myself how to do properly. In this post I look at JavaScript object iteration and picking out values from a JavaScript object by property name or index.
</abstract>
<categories>
JavaScript
</categories>
<keywords>
Object Map,Index,Dictionary,Map,Index,Key Value
</keywords>
<isDraft>False</isDraft>
<featuredImage></featuredImage>
<weblogs>
<postid>163719</postid>
<weblog>
West Wind Web Log
</weblog>
</weblogs>
</blogpost>
```
-->
<!-- End Post Configuration -->
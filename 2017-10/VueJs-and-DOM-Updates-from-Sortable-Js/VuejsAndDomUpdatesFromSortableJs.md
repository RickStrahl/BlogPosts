---
title: VueJs and DOM Updates from Sortable Js
weblogName: West Wind Web Log
---
# VueJs and DOM Updates from Sortable Js

I'm working on a projects where I'm using VueJs in a page that also uses a sortable component that knows nothing about VueJs. 

* [Sortable](http://rubaxa.github.io/Sortable/)

Sortable is a simple to use library you can use to sort items in a container, or to drag and drop items across containers.

In this case I'm dragging and dropping items between two lists in what is essentially a mover list. Just using Sortable on its own and not explicitly intercepting the drop event handling works great. I can drag elements between the lists without issue.

*** VueJs and External DOM Access
The problem comes in when I try to intercept the drop operation and want to update my model in response to it. 

The sortable supports dragging and dropping of items between containers nice and easily, but when used in VueJs there's a problem:

I have VueJs

```js
var app;
var vm = {
    initialize: function () {
        var options = {
            group: "mover",
            ghostClass: "mover-ghost",
            chosenClass: "mover-selected",
            onAdd: vm.onListDrop                
        };

        app = new Vue({
            el: "#MoverComponent",
            data: vm
        });

        var el = document.getElementById('MoverLeft');
        vm.unselectedSortable = Sortable.create(el, options);

        var el2 = document.getElementById('MoverRight');
        vm.selectedSortable = Sortable.create(el2, options);
    },
}
```

The lists are then rendered with with a Vue Template:

```html
<div id="MoverLeft" class="mover-left-panel">            
<div class="mover-item" 
         v-for="item in unselectedItems"
         :class="{'mover-selection': item.isSelected }"
         v-on:click="selectItem(item, unselectedItems)"                     
         :data-id="item.value" data-side="left" data-item="item"
         >{{item.displayValue}}</div>
</div>

<div class="mover-controls" style="margin-top: 50px;">
    <button v-on:click="moveRight()" style="width: 50px;display: block; margin-bottom: 10px">
        <i class="fa fa-caret-right fa-2x" aria-hidden="true"></i>
    </button>
    <button v-on:click="moveLeft()" style="width: 50px; display: block; margin-bottom: 10px">
            <i class="fa fa-caret-left fa-2x" aria-hidden="true"></i>
    </button>
</div>

<div id="MoverRight" class="mover-right-panel">
    <div class="mover-item" 
         v-for="item in selectedItems"
         :class="{'mover-selectedion': item.isSelected }"                     
         :data-id="item.value" data-side="right"
         >{{item.displayValue}}</div>                
</div>
```

The problem here is that Vue renders the initial list, but when I drag and drop or resort an element to a new location Sortable bypasses Vue since it knows nothing about it. Then if I explicitly update the model in event code, I end up with duplicate DOM elements. Not cool.

A lot of hair pulling and experimenting later I finally figured out that hte way to do this is to **just pull freaking the dropped element out of the DOM**!

To do this I can intercept the event I need and do some thing like this:

```js
onListDrop: function (e, parm2) {
    var key = e.item.dataset["id"];
    var side = e.item.dataset["side"];
    var insertAt = e.newIndex;

    // *** Hack! Remove the dropped item and let Vue handle rendering
    e.item.remove();

    var item = vm.unselectedItems.find(function (itm) {
        return itm.value == key;
    });

    
    if (side == "left") {
        var item = vm.unselectedItems.find(function (itm) {
            return itm.value == key;
        });
        item.isSelected = true;                
   
        // this actually removes the item from one list and adds to the other
        vm.moveRight(item,insertAt);
    }
    else {
        var item = vm.selectedItems.find(function (itm) {
            return itm.value == id;
        });
        item.isSelected = true;
        
        // this actually removes the item from one list and adds to the other
        vm.moveLeft(item, insertAt);
    }

    console.log(vm.selectedItems);
    return false;
}
```

The key item that makes this work is this code:

```js
e.item.remove();
```

which effectively removes the Sortable injected DOM element. Score! Well sort of - it took way too long to figure that out, although in hindsight it seems obvious. The same logic is applied to sorting so that the sort order in the model can be updated.

### Removing DOM Elements
I've run into this with other frameworks as well. Because frameworks like Vue and ANgular effectively take over rendering of content, explicit DOM injections of content can cause major disruption to framework managed content. This approach of intercepting inserted DOM elements has worked with a few other components before. I'm writing this down so I can perhaps recall this later.



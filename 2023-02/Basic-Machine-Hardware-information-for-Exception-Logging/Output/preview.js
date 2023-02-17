/// highlight.pack.js
var te = window.previewer = {
  mmEditor: null,
  mmEditorAsync: null,   // WebViewPreviewer
  isPreviewEditorSync: false,
  highlightTimeout: 1800,
  codeScrolled: new Date().getTime() + 2500,
  setCodeScrolled: function() {
    te.codeScrolled = new Date().getTime();
  },
  isCodeScrolled: function() {
    var t = new Date().getTime() - 350;
    return te.codeScrolled > t ? true : false;
  },
  // all dotnet calls go through this class
  dotnetInterop: {
    // return async instance if available, otherwise sync
    getEditor: function() {
      if (window.chrome) {
        // WebView instance does not want to be cached
        return window.chrome.webview.hostObjects.mm || window.chrome.webview.hostObjects.sync.mm;
      }
      return te.mmEditorAsync || te.mmEditor || null;
    },
    // TODO: Make all this work with Async/Await once IE is dropped
    // always return the sync instance for callbacks that return
    // values (2 funcs). All others use the async version.
    getEditorSync: function() {
      if (window.chrome) {
        // WebView instance does not want to be cached
        return window.chrome.webview.hostObjects.sync.mm;
      }
      return te.mmEditor || null;
    },
    previewContextMenu: function(parm) {
      var editor = te.dotnetInterop.getEditor();
      if (!editor)
          return;

      try {
        editor.PreviewContextMenu(JSON.stringify(parm));
      } catch(ex)  { }
    },
    previewLinkNavigationAsync: async function (url, rawHref) {
        // HACK: Must call sync for result - WPF code uses async so potential lockup scenario
        var editor = te.dotnetInterop.getEditor();
        if (!editor)
            return false;
        try {
            // TODO: ASYNC RESULT DOESN'T WORK IN WEBVIEW - CHECK IN LATER VERSIONS
            var handled = await editor.PreviewLinkNavigationAsync(url, rawHref);
            alert('Handled: ' + handled);
            return handled;
        } catch (ex) { return false; }
    },
    previewLinkNavigation:  function(url, rawHref) {
      // HACK: Must call sync for result - WPF code uses async so potential lockup scenario
      var editor = te.dotnetInterop.getEditorSync();
      if (!editor)
        return false;
      try {
          var handled = editor.PreviewLinkNavigation(url, rawHref);
          return handled;
      } catch (ex) {
           return false;
      }
    },
    gotoBottom: function(noRefresh, noSelection) {
      let editor = te.dotnetInterop.getEditor();
      if (!editor)
        return;

      try {
        editor.GotoBottom(noRefresh || false, noSelection || false);
      } catch(ex)  { }
    },
    gotoLine: function(line, updateEditor) {
      let editor = te.dotnetInterop.getEditor();
      if (!editor)
        return;
      try {
        editor.GotoLine(line, updateEditor || false);
      } catch (ex) {}
    },
    isPreviewEditorToSync: function() {
      var editor = te.dotnetInterop.getEditorSync();
      if (!editor)
        return false;

      try {
        te.isPreviewEditorSync = editor.IsPreviewToEditorSync();
        return te.isPreviewEditorSync;
      } catch(ex) { return false; }
    }
  }

};
var isDebug = false;

// This function is global and called by the parent
// to pass in the form object and pass back the text
// editor instance that allows the parent to make
// calls into this component
function initializeinterop(editor) {
    // WebView2
    if (window.chrome) {
      te.mmEditor = window.chrome.webview.hostObjects.sync.mm;   // WebView Proxy
      te.mmEditorAsync = window.chrome.webview.hostObjects.mm;
    }
    // CEF
    else if (window.dotnetProxy) {
      te.mmEditor = window.dotnetProxy;
    }
    // value passed explicitly from host as parameter
    else {
      te.mmEditor = editor;
    }

    if (te.mmEditor) {
      // te.mmEditor.IsPreviewToEditorSync();
      te.isPreviewEditorSync = te.dotnetInterop.isPreviewEditorToSync();
    }

    scroll();
}


$(document).ready(function() {
  highlightCode();

    // navigate all links externally in default browser
    $(document).on("click",
        "a",
        async function(e) {
            var url = this.href;
            var rawHref = $(this).attr("href");
            var hash = this.hash;

            // Notify of link navigation and handle external urls
            // if not handled elsewhere
            if (te.mmEditor) {
                
                var handled = await te.dotnetInterop.previewLinkNavigationAsync(url, rawHref);                
                if (handled) {
                    // it true editor handled the navigation
                    e.preventDefault();
                    return false;
                }
            }

            if (hash) {
                hash = decodeURIComponent(hash).substr(1);
                var safeHash = CSS.escape(hash);
                var sel = "a[name='" + safeHash + "'],#" + safeHash;

                var els = document.querySelectorAll(sel);
                if (els && els.length > 0) {
                    window.scrollTo(0, els[0].offsetTop - 100);
                    return false;  // handled
                }

                // let browser navigate 
            }
        });
    // definition lists
    $(document).on("click",
        "dt",
        function() {
            $(this).nextUntil("dt").toggle();
        });
});

$(document).on("contextmenu",
    function (e) {
      var parm = { Top: 1, Left: 1, Id: '', Type: '', Src:'', Href: '' };

        if (e.target) {
            parm.Id = e.target.id;
            parm.Type = e.target.nodeName;

            if (e.target.src)
                parm.Src = e.target.src;
            if (e.target.href)
                parm.Href = $(e.target).attr("href");
        }

        if (te.mmEditor) {
            te.dotnetInterop.previewContextMenu(parm); // parm serializes to string
            return false;
        }

        // inside of WebBrowser control don't show MM context menu
        return true;
    });

window.ondrop = function (event) {
    // don't allow dropping here - we can't get full file info
    event.preventDefault();
    event.stopPropagation();

    setTimeout(function () {
        alert("To open dropped files in Markdown Monster, please drop files onto the header area of the window.");
    }, 50);
}

window.ondragover = function (event) {
    event.preventDefault();
    return false;
}



// scroll editor to the scroll position of the preview
var scroll = debounce(function (event) {
    if (!te.mmEditor || !te.isPreviewEditorSync) return;

    // prevent repositioning editor scroll sync
    // when selecting line in editor (w/ two way sync)
    // te.codeScrolled is set in scrollToPragmaLines so that we don't
    // re-navigate
    var isScrolled = te.isCodeScrolled();
    if (isScrolled)
      return;

    var st = window.document.documentElement.scrollTop;
    var sh = window.document.documentElement.scrollHeight - window.document.documentElement.clientHeight;

    if (st < 3) {
      te.dotnetInterop.gotoLine(0, true);
      return;
    }
    //// if we're on the last page
    if (sh === st) {
      te.dotnetInterop.gotoBottom(true, true);
      return;
    }

    var winTop = st + 100;


    var $lines = $("[id*='pragma-line-']");

    if ($lines.length < 1)
        return;

    // find the first line that is below the scrolltop+ position
    var id = null;
    for (var i = 0; i < $lines.length; i++) {

        if ($($lines[i]).position().top >= winTop) {
            id = $lines[i].id;
            break;
        }
    }
    if (!id)
        return;

    id = id.replace("pragma-line-", "");

    var line = (id * 1) - 4;

    te.dotnetInterop.gotoLine(line, true);


},50);
window.onscroll = scroll;

function highlightCode(lineno) {

    var pres = document.querySelectorAll("pre>code");

    // Try to find lineno in doc - if lineno is passed
    // and render only those plus padding above and below
    var linePos = 0;


    // special handling for more than 200 code blocks
    // render only  what's in the viewport
    if (lineno && pres.length > 200) {
        var $el = $("#pragma-line-" + lineno);
        if ($el.length < 1) {
            for (var j = 0; j < 10; j++) {
                if (lineno - j < 0)
                    break;
                var $el = $("#pragma-line-" + (lineno - j) );
                if ($el.length > 0)
                    break;
            }
            if ($el.length < 1) {
                for (var k = 0; k < 10; k++) {
                    var $el = $("#pragma-line-" + (lineno + k) );
                    if ($el.length > 0)
                        break;
                }
            }
        }
        if ($el.length > 0) {
            linePos = $el.position().top;
        }
    }

    for (var i = 0; i < pres.length; i++) {
        var block = pres[i];
        var $code = $(block);

        console.log(block.classList.toString());

        // too many code blocks to render or text/plain styles - just style
        if ((pres.length > 400) ||
            $code.hasClass("language-text") ||
            $code.hasClass("language-plain")) {
                $code.addClass("hljs");
                continue;

        }

        // render only matched lines that are in viewport + padding
        if (linePos > 0) {
            var top = $code.position().top;

            if (top < linePos - 2000) {
                //console.log("Skipping smaller: " + top, linePos);
                //$code.addClass("hljs");
                continue;
            }
            if (top > linePos + 2000) {
                //console.log("Breaking larger: " + top, linePos);
                //$code.addClass("hljs");
                break;
            }
        }
        // no language specified - don't render'
        if (block.classList.toString().indexOf("language-") < 0) {
            $code.addClass("hljs");
            continue;
        }
        
        hljs.highlightBlock(block);
    }

    // add the code snippet syntax and code copying

    if (window.highlightJsBadge)
        window.highlightJsBadge();
}

function updateDocumentContent(html, lineno) {

    // special check for Mermaid script - force reload doc if not in doc
    if (html.indexOf("class=\"mermaid\"") > -1) {
        var el = document.getElementById("MermaidScript");
        if (!el) {
            window.location.reload();
            return;
        }
    }

  var el = document.getElementById("MainContent");
  if (!el)
    return;

  el.innerHTML = html;
  highlightCode(lineno);

  // Raise a previewUpdated event on the document
  var event = document.createEvent("Event");
  event.initEvent("previewUpdated", false, true);
  event.target = el;
  event.currentTarget = el;
  document.dispatchEvent(event);
}

function scrollToPragmaLine(lineno, headerId, noScrollTimeout, noScrollTopAdjustment) {
  if (typeof lineno !== "number" || lineno < 0) return;

  //setTimeout(function() {
      if (!noScrollTimeout)
        te.setCodeScrolled();

      if (lineno < 2) {
        $(document).scrollTop(0);
        return;
      }

      var $el;
      if (headerId != null)
        $el = $("#" + CSS.escape(headerId));
      if (!$el || $el.length < 1)
        $el = $("#pragma-line-" + lineno);

      var lines = 10;
      if ($el.length < 1) {
        var origLine = lineno;

        // try forwards with x lines
        for (var i = 0; i < lines; i++) {
          lineno--;
          $el = $("#pragma-line-" + lineno);
          if ($el.length > 0)
            break;
        }

        // try backwards with x lines
        if ($el.length < 1) {
          lineno = origLine;

          // try forward with 3 lines
          for (var i = 0; i < lines; i++) {
            lineno++;
            $el = $("#pragma-line-" + lineno);
            if ($el.length > 0)
              break;
          }
        }
        if ($el.length < 1)  // couldn't match anything
          return;
      }

      $(".line-highlight").removeClass("line-highlight");
      $el.addClass("line-highlight");
      if (te.highlightTimeout > 0)
        setTimeout(function() { $el.removeClass("line-highlight"); }, te.highlightTimeout);

      if (!noScrollTopAdjustment) {
        var scrollTop = 0;
        if (lineno > 1)
          scrollTop = $el.offset().top - 25; // -150

        $(document).scrollTop(scrollTop);
      }
//  }, 10);
}

function getScrollTop() {

    var st = document.documentElement.scrollTop;
    if (!st)
        return 0;
    return st;
}

function scrollToHtmlBlock(htmlText) {
  te.setCodeScrolled();

  if (!htmlText)
    return;
  try {
    // Normalize the HTML
    var htmlText2 = $(htmlText)[0].outerHTML;
    var $matched = $("#MainContent *").filter(function () {
      var elHtml = $(this.outerHTML)[0].outerHTML;
      return elHtml.startsWith(htmlText2);
    });

    if ($matched.length > 0) {
      $matched[0].scrollIntoView();
      $matched.addClass("line-highlight");
      setTimeout(function () { $matched.removeClass("line-highlight"); }, te.highlightTimeout);
    }
  }
  catch(ex) { }
}

///Reference: https://stackoverflow.com/a/46087348/11197
function getElementByTextContent(str, partial, parentNode, onlyLast) {
  var filter = function (elem) {
    var isLast = onlyLast ? !elem.children.length : true;
    var contains = partial ? elem.textContent.indexOf(str) > -1 :
      elem.textContent === str;
    if (isLast && contains)
      return NodeFilter.FILTER_ACCEPT;
  };
  filter.acceptNode = filter; // for IE
  var treeWalker = document.createTreeWalker(
    parentNode || document.documentElement,
    NodeFilter.SHOW_ELEMENT, {
      acceptNode: filter
    },
    false
  );
  var nodeList = [];
  while (treeWalker.nextNode()) nodeList.push(treeWalker.currentNode);
  return nodeList;
}

function status(msg,append) {
    var $el = $("#statusmessage");
    if ($el.length < 1) {
        $el = $("<div id='statusmessage' style='position: fixed; opacity: 0.8; left:0; right:0; bottom: 0; padding: 5px 10px; background: #444; color: white;'></div>");
        $(document.body).append($el);
    }

    if (append) {
        var html = $el.html() +
            "<br/>" +
            msg;
        $el.html(html);
    }
    else
        $el.text(msg);

    $el.show();
    setTimeout(function() { $el.text(""); $el.fadeOut() }, 6000);
}


window.onerror = function windowError(message, filename, lineno, colno, error) {
    var msg = "";
    if (message)
        msg = message;
    //if (filename)
    //    msg += ", " + filename;
    if (lineno)
        msg += " (" + lineno + "," + colno + ")";
    if (error)
        msg += error;

    // show error messages in a little pop overwindow
    if (isDebug)
        status(msg);

    console.log("Error: " + msg);

    // don't let errors trigger browser window
    return true;
}

function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow)
            func.apply(context, args);
    };
};

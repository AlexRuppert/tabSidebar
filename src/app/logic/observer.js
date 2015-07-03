//based on https://github.com/knyar/theoldreader-chrome/blob/master/source/js/observer.js
'use strict';

if (typeof (window.injected) == "undefined") {
  window.injected = true;

  var target = document.querySelector('head > title');

  if (target) {
    var observer = new window.MutationObserver(
      function (mutations) {
        mutations.forEach(
          function (mutation) {
            notify(mutation.target.textContent, true);
          }
        );
      }
    );

    observer.observe(
      target,
      {
        subtree: true,
        characterData: true,
        childList: true
      }
    );

    notify(target.textContent, false);

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      if (request.type == 'search') {
        var textArray = [];
        findElements(document.body, textArray);
        if (textArray.join(' ').indexOf(request.value.toLowerCase()) >= 0) {
          sendResponse({ found: true, index: request.index });
        }
      }
    });
  }

  function findElements(element, textArray) {
    for (var i = 0; i < element.childNodes.length; i++) {
      var child = element.childNodes[i];
      if (child.nodeType == 3) {
        if (child.nodeValue.length > 0 && child.nodeValue[0] != '<') {
          textArray.push(child.nodeValue.trim().toLowerCase());
        }
      }
      else {
        var tagName = child.nodeName.toLowerCase();
        if (tagName != 'script' && tagName != 'style' && tagName != 'meta') {
          findElements(child, textArray);
        }
      }
    }
  }
  function notify(title, changed) {
    try {
      chrome.runtime.sendMessage({ 'title': title });
    } catch (e) {
      observer.disconnect();
    }
  }
}
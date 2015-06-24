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
  }
  function notify(title, changed) {
    try {
      chrome.runtime.sendMessage({ 'title': title });
    } catch (e) {
      observer.disconnect();
    }
  }
}
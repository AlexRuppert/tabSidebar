'use strict';

function startupInject() {
  chrome.tabs.query(
    {},
    function (tabs) {
      for (var i in tabs) {
        if (!chrome.runtime.lastError) {
          if (tabs[i].url.indexOf('http') == 0 && tabs[i].url.indexOf('addons.opera.com') == -1) {
            if (!chrome.runtime.lastError) {
              chrome.tabs.executeScript(tabs[i].id, { file: "app/logic/observer.js" });
              if (!chrome.runtime.lastError) {
                true;
              }
            }
          }
        }
      }
    }
  );
}
startupInject();
'use strict';

console = chrome.extension.getBackgroundPage().console;

var Main = require('./Main.jsx');
document.body.onmousedown = function (e) {
  if (e.which == 2) {
    e.preventDefault();
  }
};

setTimeout(function () {
  Persistency.init();
  TabManager.init();
  GroupManager.init();
  
  Persistency.loadState(function () {
    if (Persistency.getState().iconSettings.gray) {
      opr.sidebarAction.setIcon({
        path: {
          '19': 'media/icons/tabSidebar_19_gray.png',
          '38': 'media/icons/tabSidebar_48_gray.png'
        }
      });
    }
    else {
      opr.sidebarAction.setIcon({
        path: {
          '19': 'media/icons/tabSidebar_19.png',
          '38': 'media/icons/tabSidebar_48.png'
        }
      });
    }
    React.render(
       React.createElement(Main, null),
       document.getElementById('main')
     );
  });
}, 0);

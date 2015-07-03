'use strict';

console = chrome.extension.getBackgroundPage().console;

var Main = require('./Main.jsx');
var Constants = require('../util/Constants.js');
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
    Persistency.loadGroups(function () {
      var state = Persistency.getState();
      if (state.iconSettings.gray) {
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

      if (state.firstRun) {
        chrome.tabs.create({ url: Constants.paths.INFO });
        Persistency.updateState({ firstRun: false });
        Persistency.updateState({ version: Persistency.defaultState.version });
      }
      else if (Persistency.defaultState.version != state.version) {
        chrome.tabs.create({ url: Constants.paths.INFO_NEW });
        Persistency.updateState({ version: Persistency.defaultState.version });
      }
      React.render(
         React.createElement(Main, null),
         document.getElementById('main')
       );
    });
  });
}, 0);

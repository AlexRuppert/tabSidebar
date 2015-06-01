'use strict';

console = chrome.extension.getBackgroundPage().console;

var Main = require('./Main.jsx');

Persistency.init();
TabManager.init();
GroupManager.init();
Persistency.loadState(function () {
  
  React.render(
    React.createElement(Main, null),
    document.getElementById('main')
  );
});
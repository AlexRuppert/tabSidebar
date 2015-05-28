'use strict';

console = chrome.extension.getBackgroundPage().console;

var Main = require('./Main.jsx');
var Persistency = require('./Persistency.js');


Persistency.init();
Persistency.loadState(function () {
  
  React.render(
    React.createElement(Main, null),
    document.getElementById('main')
  );
});
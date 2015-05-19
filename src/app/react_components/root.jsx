/** @jsx React.DOM */
"use strict";
console=chrome.extension.getBackgroundPage().console;
var Main = require('./Main.jsx');

React.render(
  React.createElement(Main, null),
  document.getElementById('main')
);

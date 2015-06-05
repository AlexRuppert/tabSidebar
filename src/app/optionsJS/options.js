"use strict";

var Strings = require('../react_components/util/Strings.js');
var Constants = require('../react_components/util/Constants.js');

function update(updateObject) {
  Persistency.updateState(updateObject);
  var tabs = chrome.extension.getViews();
  var panel = null;
  for (var i = 0; i < tabs.length; i++) {
    if (tabs[i].location.href.indexOf('panel.html') >= 0) {
      panel = tabs[i];
      break;
    }
  }
  if (panel) {
    panel.location.reload();
  }
}
function setCheckbox(id, property) {
  var node = document.getElementById(id);
  node.checked = Persistency.getState()[property];
  node.addEventListener('click', function () {
    var value = document.getElementById(id).checked;
    var obj = {};
    obj[property] = value;
    update(obj);
  });
}
function initControls() {
  setCheckbox('show-close-on-tabs', 'showCloseButtons');
  setCheckbox('show-groups', 'showGroups');
  setCheckbox('show-new-on-tabs', 'showNewOnTabs');
  document.getElementById('reset-settings').addEventListener('click', function () {
    Persistency.reset();
    init();
  });
}

function init() {
  Persistency.init();
  Persistency.loadState(function () {
    initControls();
  });
}

init();
"use strict";

var Persistency = require('../logic/Persistency.js');

function setCheckbox(id, property) {
  var node = document.getElementById(id);
  node.checked = Persistency.getState()[property];
  node.addEventListener('click', function () {
    var value = document.getElementById(id).checked;
    var obj = {};
    obj[property] = value;
    Persistency.updateState(obj);
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
  Persistency.loadState(function () {
    initControls();
  });
}

init();
"use strict";

function getProperty(obj, prop) {
  var parts = prop.split('.'),
      last = parts.pop(),
      l = parts.length,
      i = 1;

  var current = prop;
  if (l > 0) {
    current = parts[0];
  }
  else {
    return obj[prop];
  }

  while ((obj = obj[current]) && i < l) {
    current = parts[i];
    i++;
  }

  if (obj) {
    return obj[last];
  }
}

function setProperty(obj, prop, value) {
  var parts = prop.split('.'),
      last = parts.pop(),
      l = parts.length,
      i = 1;

  var current = prop;

  if (l > 0) {
    current = parts[0];
  }
  else {
    obj[prop] = value;
    return;
  }

  while ((obj = obj[current]) && i < l) {
    current = parts[i];
    i++;
  }

  if (obj) {
    obj[last] = value;
  }
}
function translate() {
  document.title = chrome.i18n.getMessage('SETTINGS_TAB_SIDEBAR_TITLE');
  var els = document.querySelectorAll(".trans");
  for (var i = 0; i < els.length; i++) {
    els[i].innerText = chrome.i18n.getMessage(els[i].innerText.trim());
  }

  var els = document.querySelectorAll("div");
  for (var i = 0; i < els.length; i++) {
    if (els[i].title.length > 0) {
      els[i].title = chrome.i18n.getMessage(els[i].title.trim());
    }
  }
}

function setControls() {
  var els = document.getElementsByTagName('input');
  for (var i = 0; i < els.length; i++) {
    var property = els[i].dataset.property;
    if (property) {
      switch (els[i].type) {
        case 'checkbox':
          setCheckbox(els[i], property);
          break;
        case 'range':
          setRange(els[i], property);
          break;
        case 'file':
          setFile(els[i], property);
          break;
        case 'radio':
          setRadio(els[i], property);
          break;
        case 'text':
          setText(els[i], property);
          break;
        default:
          break;
      }
    }
  }
}

function reloadPanel() {
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
function update(updateObject) {
  if (typeof updateObject !== 'undefined') {
    Persistency.updateState(updateObject);
  }
  else {
    Persistency.saveState();
  }
  reloadPanel();
}
function setCheckbox(node, property) {
  var state = Persistency.getState();
  node.checked = getProperty(state, property);
  node.addEventListener('click', function (event) {
    var value = event.target.checked;
    setProperty(state, property, value);
    update();
  });
}

function setText(node, property) {
  var img = node.parentNode.getElementsByTagName('img')[0];
  if (!img)
    return;
  var state = Persistency.getState();
  img.src = getProperty(state, property);
  node.value = getProperty(state, property);
  node.addEventListener('change', function (event) {
    var value = event.target.value;
    img.src = value;
    setProperty(state, property, value);
    update();
  });
}

function setFile(node, property) {
  var img = node.parentNode.getElementsByTagName('img')[0];
  if (!img)
    return;
  var state = Persistency.getState();
  img.src = getProperty(state, property);
  node.addEventListener('change', function (event) {
    var reader = new FileReader();
    reader.onload = function (e) {
      img.src = reader.result;
      setProperty(state, property, reader.result);
      update();
    }
    if (event.target.files[0]) {
      reader.readAsDataURL(event.target.files[0]);
    }
  });
}

function setRadio(node, property) {
  var state = Persistency.getState();

  var checkedValue = getProperty(state, property);
  if (node.value == checkedValue) {
    node.checked = 'true';
  }
  node.addEventListener('change', function (event) {
    if (event.target.checked) {
      setProperty(state, property, event.target.value);
      update();
    }
  });
}

function setRange(node, property) {
  var state = Persistency.getState();

  node.value = getProperty(state, property);
  var label = node.parentNode.getElementsByTagName('label')[0];
  if (!label)
    return;

  label.innerHTML = node.value;
  node.addEventListener('input', function (event) {
    label.innerHTML = event.target.value;
  });
  node.addEventListener('change', function (event) {
    var value = event.target.value;
    setProperty(state, property, value);
    label.innerHTML = value;
    update();
  });
}

function initControls() {
  setControls();

  document.getElementById('reset-settings').addEventListener('click', function () {
    Persistency.reset();
    init();
    reloadPanel();
  });
  document.getElementById('reset-background-image').addEventListener('click', function () {
    var state = Persistency.getState();
    setProperty(state, 'background.image', '');
    initControls();
    update();
  });
  document.getElementById('gray-icon').addEventListener('click', function () {
    var state = Persistency.getState();
    setProperty(state, 'iconSettings.gray', true);
    update();
  });
  document.getElementById('colored-icon').addEventListener('click', function () {
    var state = Persistency.getState();
    setProperty(state, 'iconSettings.gray', false);
    update();
  });
}

function init() {
  Persistency.init();
  Persistency.loadState(function () {
    translate();
    initControls();
  });
}

init();
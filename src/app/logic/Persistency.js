'use strict';

window.Persistency = {
  currentState: {},
  initialized: false,
  defaultState: {
    background: {
      show: true,
      image: 'http://i.imgur.com/8rSgyBO.jpg',
      offset: 65,
      blur: 4,
      opacity: 70,
      grayscale: 0,
      tabOpacity: 75
    },
    groups: [],
    column: 'single',
    showCloseButtons: true,
    showGroups: true,
    showNewOnTabs: true,
    tabIds: [],
    twoGroupColumns: false,
    viewState: 'normalview'
  },
  loaded: false,
  storage: chrome.storage.local,

  init: function () {
    if (!this.initialized) {
      var persistency = 'persistency';
      if (!chrome.extension.getBackgroundPage().hasOwnProperty(persistency)) {
        chrome.extension.getBackgroundPage()[persistency] = this;
        this.mergeDefault(this.currentState, this.defaultState);
      } else {
        var saved = chrome.extension.getBackgroundPage()[persistency];
        this.currentState = saved.currentState;
        this.loaded = saved.loaded;
      }
      this.inialized = true;
    }
  },
  getState: function () {
    return this.currentState;
  },
  loadState: function (callback) {
    if (this.loaded) {
      callback();
      return;
    }
    var self = this;

    this.storage.get(null, function (result) {
      self.currentState = result;

      //save directly, if there is something new in default, i.e. after extension updates
      if (self.mergeDefault(self.currentState, self.defaultState)) {
        self.saveState();
      }
      self.loaded = true;
      callback();
    });
  },
  mergeDefault: function (target, source) {
    var changed = false;
    for (var property in source) {
      if (source.hasOwnProperty(property)) {// only if target has property not set
        var sourceProperty = source[property];
        changed = true;
        if (typeof sourceProperty === 'object') { // for nested objects
          if (!target.hasOwnProperty(property)) {
            target[property] = {};
          }
          var tempResult = this.mergeDefault(target[property], sourceProperty);
          if (tempResult) {
            changed = tempResult
          }
        }
        else if (!target.hasOwnProperty(property)) {
          target[property] = sourceProperty;
        }
        
      }
    }
    return changed;
  },
  reset: function () {
    this.currentState = {};
    self.mergeDefault(self.currentState, self.defaultState);
    this.storage.clear();
  },
  saveState: function () {
    this.storage.set(this.currentState);
  },
  updateState: function (object) {
    for (var property in object) {
      if (object.hasOwnProperty(property)) {
        this.currentState[property] = object[property];
      }
    }
    this.storage.set(object);
  }
}
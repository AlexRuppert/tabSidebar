"use strict";

module.exports = {
  storage: chrome.storage.local,
  
  defaultState: {
    viewState: 'normalview',
    multiColumn: false,
    showCloseButtons: true,
    showGroups: true,
    showNewOnTabs: true,
    groups: [],
    tabIds: []
    
  },
  currentState: {},
  init: function () {
    if (!chrome.extension.getBackgroundPage().persistency) {
      chrome.extension.getBackgroundPage().persistency = this;
      
    }
  },
  mergeDefault: function (target, source) {
    var changed = false;
    for (var property in source) {
      if (source.hasOwnProperty(property)// only if target has property not set
        && !target.hasOwnProperty(property)) {
        var sourceProperty = source[property];
        changed = true;
        if (typeof sourceProperty === 'object') { // for nested objects
          var tempResult = this.mergeDefault(target[property], sourceProperty);
          if (tempResult) {
            changed = tempResult
          }
        }

        target[property] = sourceProperty;
      }
    }
    return changed;
  },

  
  getState: function () {
    return this.currentState;
  },
  saveState: function () {
    this.storage.set(this.currentState);
  },
  loadState: function (callback) {
    var self = this;
    this.storage.get(null, function (result) {
      self.currentState = result;

      //save directly if there is something new in default
      if (self.mergeDefault(self.currentState, self.defaultState)) {
        self.saveState();
      }

      callback();
    });
  },

  updateState: function (object) {
    for (var property in object) {
      if (object.hasOwnProperty(property)) {
        this.currentState[property] = object[property];
      }
    }

    this.storage.set(object);
  },
  reset: function () {
    this.currentState = this.defaultState;
    this.storage.clear();
  }
}
"use strict";

module.exports = {
  storage: chrome.storage.local,
  currentState: {},
  defaultState: {
    viewState: 'normalview',
    multiColumn: false,
    showCloseButtons: true,
    showGroups: true,
    showNewOnTabs: true
  },
  mergeDefault: function (target, source) {
    for (var property in source) {
      if (source.hasOwnProperty(property)// only if target has property not set
        && !target.hasOwnProperty(property)) {
        var sourceProperty = source[property];

        if (typeof sourceProperty === 'object') { // for nested objects
          this.merge(target[property], sourceProperty);
          continue;
        }

        target[property] = sourceProperty;
      }
    }
  },
  loadState: function (callback) {
    var self = this;
    this.storage.get(null, function (result) {
      self.currentState = result;
      self.mergeDefault(self.currentState, self.defaultState);
      callback();
    });
  },
  getState: function(){
    return this.currentState;
  },
  saveState: function () {
    this.storage.set(currentState);
  },
  updateState: function (object) {
    for (var property in object) {
      if (object.hasOwnProperty(property)){
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
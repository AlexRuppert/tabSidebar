'use strict';
var Constants = require('../util/Constants.js');
var Helpers = require('../util/Helpers.js');
module.exports = {
  currentState: {},
  defaultState: {
    groups: [],
    multiColumn: false,
    showCloseButtons: true,
    showGroups: true,
    showNewOnTabs: true,
    tabIds: [],
    viewState: Constants.viewStates.NORMAL_VIEW
  },
  loaded: false,
  storage: chrome.storage.local,

  init: function () {
    var persistency = Constants.globalProperties.PERSISTENCY;
    if (!chrome.extension.getBackgroundPage().hasOwnProperty(persistency)) {
      chrome.extension.getBackgroundPage()[persistency] = this;
      this.mergeDefault(this.currentState, this.defaultState);
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
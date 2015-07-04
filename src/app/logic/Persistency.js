'use strict';

window.Persistency = {
  currentState: {},
  initialized: false,
  defaultState: {
    background: {
      show: false,
      useFilter: false,
      image: '',
      offset: 0,
      blur: 4,
      opacity: 100,
      grayscale: 0,
      tabOpacity: 100
    },

    groupSettings: {
      createNewTabs: 'next',
      showBarBackground: true,
      showGroups: true,
      twoGroupColumns: false
    },
    iconSettings: {
      gray: false
    },
    previewArea: {
      show: false
    },
    tabSettings: {
      animated: false,
      column: 'single',
      showCloseButtons: true,
      showNewOnTabs: true,
      viewState: 'normalview'
    },
    scrollBar: 'default',
    tabIds: [],
    treeSettings: {
      showTreesInFilters: false,
      closeChildren: 'never',
      maxLevel: 2
    },
    firstRun: true,
    version: 1
  },
  groups: [],
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
        this.groups = saved.groups;
        this.loaded = saved.loaded;
      }
      this.inialized = true;
    }
  },
  getState: function () {
    return this.currentState;
  },

  loadGroups: function (callback) {
    var self = this;
    if (this.groups.length > 0) {
      callback();
      return;
    }
    this.storage.get('groups', function (result) {
      if (result.groups) {
        self.groups = JSON.parse(result.groups);
        
        var test = result.groups.match(/"tabs":\[(\d|,)*/g);
        if (test) {
          for (var i = 0; i < test.length; i++) {

            if (test[i]) { //some weird bug, that clears the tabs array on parsing... therefore manual id extraction
              var values = test[i].substr(8);

              if (values.trim().length > 0) {
                var ids = values.trim().split(',');

                for (var j = 0; j < ids.length; j++) {
                  if (self.groups[i].tabs.indexOf(+ids[j]) < 0) {
                    self.groups[i].tabs.push(+ids[j])
                  }
                }
              }


            }
            else {
              self.groups[i].tabs = [];
            }
          }
        }
        else {
          self.groups = [];
        }
      }
      else {
        self.groups = [];
      }

      callback();
    });
  },

  saveGroups: function (groups) {
    this.groups = groups;

    chrome.extension.getBackgroundPage()['persistency'].groups = this.groups;
    this.storage.set({ groups: JSON.stringify(groups) });
    
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
        if (typeof sourceProperty === 'object'
        && Object.prototype.toString.call(sourceProperty) !== '[object Array]') { // for nested objects
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
    chrome.extension.getBackgroundPage()['persistency'].currentState = {};
    chrome.extension.getBackgroundPage()['persistency'].loaded = false;
    this.mergeDefault(this.currentState, this.defaultState);
    this.storage.clear();
    this.storage.clear();
    this.saveState();
  },
  saveState: function () {
    this.storage.set(this.currentState);
  },
  updateStateRecursive: function (stateObj, updateObj) {
    for (var property in updateObj) {
      if (updateObj.hasOwnProperty(property)) {
        var updateProperty = updateObj[property];
        if (typeof updateProperty === 'object'
          && Object.prototype.toString.call(updateProperty) !== '[object Array]'
          && typeof stateObj[property] === 'object') {
          this.updateStateRecursive(stateObj[property], updateProperty);
        }
        else {
          stateObj[property] = updateProperty;
        }
      }
    }
  },
  updateState: function (object) {
    var obj = {};
    this.updateStateRecursive(this.currentState, object);
    for (var property in object) {
      if (object.hasOwnProperty(property)) {
        obj[property] = this.currentState[property]
      }
    }
    chrome.extension.getBackgroundPage()['persistency'].currentState = this.currentState;
    this.storage.set(obj);
  }
}
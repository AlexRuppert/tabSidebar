'use strict';

window.GroupManager = {
  initialized: false,
  activeGroupId: 0,
  windowList: [],
  groups: [],
  groupIdChangedListeners: {},
  groupsChangedListeners: {},
  groupManagerName: 'groupManager',
  init: function () {
    if (!this.initialized) {
      var self = this;

      if (!chrome.extension.getBackgroundPage().hasOwnProperty(this.groupManagerName)) {
        chrome.extension.getBackgroundPage()[this.groupManagerName] = this;
      }
      else {
        var manager = chrome.extension.getBackgroundPage()[this.groupManagerName];
        this.groups = manager.groups;

        this.currentWindow = manager.currentWindow;
        this.activeGroupId = manager.activeGroupId;
        this.windowList = manager.windowList;
        this.groupIdChangedListeners = manager.groupIdChangedListeners;
        this.groupsChangedListeners = manager.groupsChangedListeners;
      }
      chrome.windows.onFocusChanged.addListener(function (windowId) {
        //console.log('windows');
        //console.log(self.windowList);
        if (self.windowList.indexOf(windowId) < 0) {
          self.windowList.push(windowId);
          chrome.extension.getBackgroundPage()[self.groupManagerName].windowList = self.windowList;
          //window.location.reload();
        }
      });
      this.initialized = true;
    }
  },
  getActiveGroupId: function () {
    return this.activeGroupId;
  },
  setActiveGroupId: function (id) {
    this.activeGroupId = id;
    chrome.extension.getBackgroundPage()[this.groupManagerName].activeGroupId = id;
    this.onActiveGroupIdChanged();
  },
  getGroups: function () {
    return this.groups;
  },
  setGroups: function (groups) {
    this.groups = groups;
    chrome.extension.getBackgroundPage()[this.groupManagerName].groups = groups;
    this.onGroupsChanged();
  },
  onActiveGroupIdChanged: function () {
    for (var key in this.groupIdChangedListeners) {
      if (this.groupIdChangedListeners.hasOwnProperty(key)) {
        if (typeof this.groupIdChangedListeners[key] === 'function') {
          self.groupIdChangedListeners[key](self.activeGroupId);
        }
      }
    }
  },
  addActiveGroupIdChangedListener: function (windowId, key, callback) {
    if (this.windowList.indexOf(windowId) < 0) {
      this.windowList.push(windowId);
    }
    this.groupIdChangedListeners[key] = callback;
    chrome.extension.getBackgroundPage()[this.groupManagerName].windowList = this.windowList;
  },
  removeActiveGroupIdChangedListener: function (key) {
    if (this.groupIdChangedListeners.hasOwnProperty(key)) {
      delete this.groupIdChangedListeners[key];
    }
  },
  onGroupsChanged: function () {
    for (var key in this.groupsChangedListeners) {
      if (this.groupsChangedListeners.hasOwnProperty(key)) {
        if (typeof this.groupsChangedListeners[key] === 'function') {
          this.groupsChangedListeners[key]();
        }
      }
    }
  },
  addGroupsChangedListener: function (key, callback) {
    this.groupsChangedListeners[key] = callback;
  },
  removeGroupsChangedListener: function (key) {
    if (this.groupsChangedListeners.hasOwnProperty(key)) {
      delete this.groupsChangedListeners[key];
    }
  },
  updateGroups: function () {
    this.onGroupsChanged();
  }
}
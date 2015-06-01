'use strict';

window.GroupManager = {
  initialized: false,
  activeGroupId: 0,
  groups: [],
  groupIdChangedListeners: {},
  groupsChangedListeners: {},
  init: function () {
    if (!this.initialized) {
      var groupManager = 'groupManager';
      if (!chrome.extension.getBackgroundPage().hasOwnProperty(groupManager)) {
        chrome.extension.getBackgroundPage()[groupManager] = this;
      }
      else {
        var manager = chrome.extension.getBackgroundPage()[groupManager];
        this.groups = manager.groups;
        this.activeGroupId = manager.activeGroupId;
        this.groupIdChangedListeners = manager.groupIdChangedListeners;
        this.groupsChangedListeners = manager.groupsChangedListeners;
      }
      this.initialized = true;
    }
  },
  getActiveGroupId: function () {
    return this.activeGroupId;
  },
  setActiveGroupId: function (id) {
    this.activeGroupId = id;
    this.onActiveGroupIdChanged();
  },
  getGroups: function () {
    return this.groups;
  },
  setGroups: function (groups) {
    this.groups = groups;
    this.onGroupsChanged();
  },
  onActiveGroupIdChanged: function () {
    for (var key in this.groupIdChangedListeners) {
      if (this.groupIdChangedListeners.hasOwnProperty(key)) {
        if (typeof this.groupIdChangedListeners[key] === 'function') {
          this.groupIdChangedListeners[key](this.activeGroupId);
        }
      }
    }
  },
  addActiveGroupIdChangedListener: function (key, callback) {
    this.groupIdChangedListeners[key] = callback;
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
  }
}
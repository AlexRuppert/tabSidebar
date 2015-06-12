'use strict';

window.TabManager = {
  initialized: false,
  activeTabId: 0,
  tabs: [],
  init: function () {
    if (!this.initialized) {
      var tabManager = 'tabManager';
      if (!chrome.extension.getBackgroundPage().hasOwnProperty(tabManager)) {
        chrome.extension.getBackgroundPage()[tabManager] = this;
      }
      else {
        var manager = chrome.extension.getBackgroundPage()[tabManager];
        this.tabs = manager.tabs;
       
        this.activeTabId = manager.activeTabId;
      }
      this.initialized = true;
    }
  },
  getActiveTabId: function () {
    return this.activeTabId;
  },
  setActiveTabId: function (id) {
    this.activeTabId = id;
  },
  getTabs: function () {
    return this.tabs;
  },
  setTabs: function (tabs) {
    this.tabs = tabs;
    chrome.extension.getBackgroundPage()['tabManager'].tabs = this.tabs;
  }
}
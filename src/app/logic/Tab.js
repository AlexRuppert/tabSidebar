"use strict";
var ThumbnailCache = require('./ThumbnailCache.js');
module.exports = {  
  getTabs: function (tabList) {
    var self = this;
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      for (var i = 0; i < tabs.length; i++) {
        tabs[i].favicon = self.getFavIcon(tabs[i].url, tabs[i].favIconUrl);
        tabs[i].thumbnail = ThumbnailCache.loadFromCache(tabs[i]);
      }
      tabList.setState({ tabs: tabs });
    });
  },
  setToCurrentTab: function (tabList) {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      if (tabs.length > 0) {
        tabList.setState({ activeTab: tabs[0].id });
        if (tabList.refs[tabs[0].id]) {
          tabList.refs[tabs[0].id].setState({ isActive: true });
        }
      }
    });
  },
  getFavIcon: function (url, favicon) {
    var result = chrome.runtime.getURL('app/media/fav/default.png');
    if (!url.startsWith('opera://')) {
      result = favicon || chrome.runtime.getURL('app/media/fav/default.png');
    }
    else {
      if (url === 'opera://settings/') result = chrome.runtime.getURL('app/media/fav/settings.png');
      else if (url === 'opera://startpage/#speeddial') result = chrome.runtime.getURL('app/media/fav/newtab.png');
      else if (url === 'opera://history/') result = chrome.runtime.getURL('app/media/fav/history.png');
      else if (url === 'opera://themes/') result = chrome.runtime.getURL('app/media/fav/themes.png');
      else if (url === 'opera://downloads/') result = chrome.runtime.getURL('app/media/fav/downloads.png');
      else if (url === 'opera://bookmarks/') result = chrome.runtime.getURL('app/media/fav/bookmarks.png');
      else if (url === 'opera://startpage/#discover') result = chrome.runtime.getURL('app/media/fav/discover.png');
      else if (url === 'opera://extensions/') result = chrome.runtime.getURL('app/media/fav/extensions.png');
      else if (url === 'opera://plugins/') result = chrome.runtime.getURL('app/media/fav/plugins.png');
      else if (url === 'opera://flags/') result = chrome.runtime.getURL('app/media/fav/flags.png');
      else result = chrome.runtime.getURL('app/media/fav/default.png');
    }
    return result;
  },
  setUpEventListeners: function (tabList) {
    var self = this;
    chrome.tabs.onActivated.addListener(function (activeInfo) {
      if (activeInfo.tabId) {
        tabList.setState({ activeTab: activeInfo.tabId });

        for (var i = 0; i < tabList.state.tabs.length; i++) {
          var tabRef = tabList.state.tabs[i].id;
          if (tabRef != activeInfo.tabId
            && tabList.refs[tabRef] && tabList.refs[tabRef].state.isActive) {
            tabList.refs[tabRef].setState({ isActive: false });
            
          }
        }
        if (tabList.refs[activeInfo.tabId]) {
          tabList.refs[activeInfo.tabId].setState({ isActive: true });
        }
        else {

        }
      }
    });

    chrome.tabs.onCreated.addListener(function (tab) {
      if (!tab.url.startsWith('chrome-devtools://')) {
        var tabs = tabList.state.tabs;
        tab.favicon = self.getFavIcon(tab.url, tab.favIconUrl);
        tab.newlyCreated = true;
        tabs.splice(tab.index, 0, tab)
        tabList.setState({ tabs: tabs });
        tabList.forceUpdate();
      }
    });

    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
      if (tab.url.startsWith('chrome-devtools://'))
        return;

      var tabs = tabList.state.tabs;
      var index = tabList.getTabIndex(tabId);

      if (index < 0)
        return;

      var changeObject = {};
      var pinnedChanged = tabs[index].pinned != tab.pinned;

      if (changeInfo.state != 'loading' && (typeof tab.favIconUrl !== 'undefined') &&
        (tabList.refs[tabId].state.favicon.length <= 0
        || tabs[index].faviconUrl != tab.favIconUrl)) {
        tabs[index].faviconUrl = tab.faviconUrl;

        changeObject.favicon = self.getFavIcon(tab.url, tab.favIconUrl);
        tabs[index].favicon = changeObject.favicon;
      }

      var newlyCreated = tabs[index].newlyCreated;
      var hasThumbnail = tabs[index].hasThumbnail;
      var oldTitle = tabs[index].title;
      
      tabs[index] = tab;
      tabs[index].newlyCreated = newlyCreated;
      tabs[index].hasThumbnail = hasThumbnail;

      if (changeInfo.status) {
        changeObject.isLoading = (changeInfo.status == 'loading');
      }

      if (oldTitle != tab.title) {
        changeObject.title = tab.title;
      }
      //console.log(tab.favIconUrl);
      //console.log(changeObject);
      
      if (pinnedChanged) {
        tabList.forceUpdate();
      }
      tabList.refs[tabId].setState(changeObject);
      //tabList.setState({ tabs: tabs });
    });

    chrome.tabs.onMoved.addListener(function (tabId, moveInfo) {
      var tabs = tabList.state.tabs;
      tabs.splice(moveInfo.toIndex, 0, tabs.splice(moveInfo.fromIndex, 1)[0]);
      tabList.setState({ tabs: tabs });
      tabList.forceUpdate();
    });

    chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
      var tabs = tabList.state.tabs;
      var index = tabList.getTabIndex(tabId);
      if (index > -1) {
        tabs.splice(index, 1);
      }
      tabList.setState({ tabs: tabs });
      tabList.forceUpdate();
    });

    
  }
}
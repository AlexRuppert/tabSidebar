'use strict';

var Constants = require('../util/Constants.js');
var GroupLogic = require('../groups/Group.js');
var Helpers = require('../util/Helpers.js');
var ThumbnailCache = require('./ThumbnailCache.js');

module.exports = {
  clearSelectedTabs: function (tabList) {
    if (tabList.selectedTabs.length > 0) {
      for (var i = 0; i < tabList.selectedTabs.length; i++) {
        var tabRef = tabList.selectedTabs[i];

        if (tabList.refs[tabRef]) {
          tabList.refs[tabRef].setState({ isSelected: false });
        }
      }
      tabList.selectedTabs = [];
    }
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
  getTabIndex: function (tabId) {
    var tabs = TabManager.getTabs();
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].id == tabId) {
        return i;
      }
    }
    return -1;
  },
  getTabs: function (tabList, callback) {
    var self = this;
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      for (var i = 0; i < tabs.length; i++) {
        tabs[i].favicon = self.getFavIcon(tabs[i].url, tabs[i].favIconUrl);
        tabs[i].thumbnail = ThumbnailCache.loadFromCache(tabs[i]);
      }
      self.setTabsAndUpdate(tabList, tabs, false);
      callback();
    });
  },
  getTabsToShow: function (tabList) {
    var tabs = TabManager.getTabs();
    var activeGroupId = GroupManager.getActiveGroupId();

    var tabsToShow = [];
    if ((activeGroupId == Constants.groups.ALL_GROUP_ID
      || (!GroupLogic.getActiveGroup(activeGroupId)))) {
      if (!tabList.isSearchingTabs()) {
        tabsToShow = tabs;
      }
      else {
        for (var i = 0; i < tabs.length; i++) {
          if (tabs[i].title.toLowerCase().indexOf(tabList.state.searchTabsQuery) >= 0) {
            tabsToShow.push(tabs[i]);
          }
        }
      }
    } else {
      var activeGroup = GroupLogic.getActiveGroup(activeGroupId);

      if (activeGroup) {
        if (!activeGroup.filter) {
          var usedTabIds = [];
          for (var i = 0; i < activeGroup.tabs.length; i++) {
            var tabIndex = this.getTabIndex(activeGroup.tabs[i]);
            if (tabIndex >= 0 && tabIndex < tabs.length) {
              usedTabIds.push(activeGroup.tabs[i]);
              tabsToShow.push(tabs[tabIndex]);
            }
          }
          //delete non-present tabs to save memory
          if (activeGroup.tabs.length != usedTabIds.length) {
            activeGroup.tabs = usedTabIds;

            GroupLogic.saveGroups();
          }
        }
        else { //filter groups
          tabsToShow = tabs.slice(0);
          if (activeGroup.filterValue.length > 0) {
            var filterFunc = {};
            var filterValueLower = activeGroup.filterValue.toLowerCase();

            var filterValueRegex = new RegExp(Helpers.escapeRegExp(filterValueLower));
            switch (activeGroup.filterBy) {
              case Constants.groupCreator.TITLE_CONTAINS:
                filterFunc = function (obj) {
                  return filterValueRegex.test(obj.title.toLowerCase());
                }
                break;
              case Constants.groupCreator.URL_CONTAINS:
                filterFunc = function (obj) {
                  return filterValueRegex.test(obj.url.toLowerCase());
                }
                break;
              case Constants.groupCreator.LAST_VISITED_GREATER:
                break;
              case Constants.groupCreator.LAST_VISITED_LOWER:
                break;
              case Constants.groupCreator.OPENED_GREATER:
                break;
              case Constants.groupCreator.OPENED_LOWER:
                break;
              default:
                filterFunc = function (obj) {
                  return true;
                }
            }
            tabsToShow = tabsToShow.filter(filterFunc);
          }
          var sortFunc = {}
          var ascending = activeGroup.sortDirection == Constants.groupCreator.ASCENDING;
          switch (activeGroup.sortBy) {
            case Constants.groupCreator.TITLE:
              sortFunc = Helpers.sortBy('title', ascending);
              break;
            case Constants.groupCreator.URL:
              sortFunc = Helpers.sortBy('url', ascending);
              break;
            case Constants.groupCreator.LAST_VISITED:
              break;
            case Constants.groupCreator.OPENED:
              break;
            default:
          }
          tabsToShow.sort(sortFunc);
        }
      }
    }
    return tabsToShow;
  },
  handleTabClicked: function (tabList, id, event) {
    event = event.nativeEvent;

    if (event.which == 1) {
      //select multiple tabs
      if (event.ctrlKey) {
        if (tabList.refs[id]) {
          if (!tabList.refs[id].state.isSelected) {
            tabList.refs[id].setState({ isSelected: true });
            if (tabList.selectedTabs.indexOf(id) < 0) {
              tabList.selectedTabs.push(id);
            }
          }
          else {
            tabList.refs[id].setState({ isSelected: false });
            var selectedIndex = tabList.selectedTabs.indexOf(id)
            if (selectedIndex >= 0) {
              tabList.selectedTabs.splice(selectedIndex, 1);
            }
          }
        }
      }
      else {
        this.clearSelectedTabs(tabList);
        var oldId = TabManager.getActiveTabId();
        if (oldId == id) {
          return 0;
        }
        //create thumbnail on leaving tab
        ThumbnailCache.updateThumbnail(tabList, this.getTabIndex(oldId), oldId);

        chrome.tabs.update(id, { active: true });

        var tab = tabList.refs[id];
        var self = this;
        if (tabList.refs[id] && typeof tab.state.thumbnail !== 'undefined'
          && tab.state.thumbnail.length <= 1) {
          setTimeout(function () {
            ThumbnailCache.updateThumbnail(tabList, self.getTabIndex(id), id);
          }, 100);
        }
      }
    }
    else if (event.which == 2) {
      this.handleTabClosed(id);
    }
  },
  handleTabClosed: function (id) {
    chrome.tabs.remove(id);
  },
  init: function () {
    
  },
  setTabsAndUpdate: function (tabList, tabs, redraw) {
    this.updateTabIds(tabs);
    TabManager.setTabs(tabs);
    if (redraw)
      tabList.forceUpdate();
  },
  setToCurrentTab: function (tabList) {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      if (tabs.length > 0) {
        TabManager.setActiveTabId(tabs[0].id);
        if (tabList.refs[tabs[0].id]) {
          tabList.refs[tabs[0].id].setState({ isActive: true });
        }
      }
    });
  },
  setUpEventListeners: function (tabList) {
    var self = this;
    var tabs = TabManager.getTabs();

    chrome.tabs.onActivated.addListener(function (activeInfo) {
      if (activeInfo.tabId) {
        for (var i = 0; i < tabs.length; i++) {
          var tabRef = tabs[i].id;
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
        TabManager.setActiveTabId(activeInfo.tabId);
      }
    });
    chrome.tabs.onCreated.addListener(function (tab) {
      if (!tab.url.startsWith('chrome-devtools://')) {
        
        tab.favicon = self.getFavIcon(tab.url, tab.favIconUrl);
        tab.newlyCreated = true;
        tabs.splice(tab.index, 0, tab);
        self.setTabsAndUpdate(tabList, tabs, true);
        //if we are currently in a group, add tab to group
        if (!GroupLogic.isAllGroupActive()) {
          var groups = GroupManager.getGroups();
          var activeGroupId = GroupManager.getActiveGroupId();

          var groupIndex = GroupLogic.getGroupIndex(activeGroupId);
          if (groupIndex >= 0) {
            groups[groupIndex].tabs.push(tab.id);
            GroupLogic.setGroupsAndSave(groups);
          }
        }
      }
    });
    chrome.tabs.onMoved.addListener(function (tabId, moveInfo) {
      tabs.splice(moveInfo.toIndex, 0, tabs.splice(moveInfo.fromIndex, 1)[0]);
      self.setTabsAndUpdate(tabList, tabs, true);
    });

    chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {      
      var index = self.getTabIndex(tabId);
      if (index > -1) {
        tabs.splice(index, 1);
      }
      self.setTabsAndUpdate(tabList, tabs, true);
    });
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
      if (tab.url.startsWith('chrome-devtools://'))
        return;

     
      var index = self.getTabIndex(tabList, tabId);

      if (index < 0)
        return;

      var changeObject = {};
      var changeObjectEmpty = true;
      var pinnedChanged = tabs[index].pinned != tab.pinned;

      if (changeInfo.state != 'loading' && (typeof tab.favIconUrl !== 'undefined') && tabList.refs[tabId] &&
        (tabList.refs[tabId].state.favicon.length <= 0
        || tabs[index].faviconUrl != tab.favIconUrl)) {
        tabs[index].faviconUrl = tab.faviconUrl;

        changeObject.favicon = self.getFavIcon(tab.url, tab.favIconUrl);
        changeObjectEmpty = false;
        tabs[index].favicon = changeObject.favicon;
      }

      var newlyCreated = tabs[index].newlyCreated;
      var hasThumbnail = tabs[index].hasThumbnail;
      var thumbnail = tabs[index].thumbnail;
      var favicon = tabs[index].favicon;
      var oldTitle = tabs[index].title;

      tabs[index] = tab;
      tabs[index].newlyCreated = newlyCreated;
      tabs[index].hasThumbnail = hasThumbnail;
      tabs[index].thumbnail = thumbnail;
      tabs[index].favicon = favicon;

      if (changeInfo.status) {
        changeObject.isLoading = (changeInfo.status == 'loading');
        changeObjectEmpty = false;
      }

      if (oldTitle != tab.title) {
        changeObject.title = tab.title;
        changeObjectEmpty = false;
      }

      if (pinnedChanged) {
        tabList.forceUpdate();
      }
      if (tabList.refs[tabId] && !changeObjectEmpty) {
        tabList.refs[tabId].setState(changeObject);
      }
      //tabList.setState({ tabs: tabs });
    });
    chrome.windows.onRemoved.addListener(function (windowId) {
      self.updateTabIds(tabs);
    });
  },
  tabDragStart: function (tabList, e) {
    tabList.tabDragged = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    tabList.tabOver = e.currentTarget;
  },
  tabDragOver: function (tabList, e) {
    e.preventDefault();
    if (tabList.groupOver) {
      tabList.groupOver.style.border = 'none';
    }
    tabList.groupOver = null;
    if (!tabList.tabDragged)
      return;
    if (tabList.isSearchingTabs()) {//no moving, when searching
      return;
    }
    //only 2 levels to keep it simple: check if we are over another tab
    if (!e.target.classList.contains('tab') && !e.target.classList.contains('tab-placeholder')) {
      e.target = e.target.parentNode;

      if (!e.target.classList.contains('tab') && !e.target.classList.contains('tab-placeholder')) {
        return;
      }
    }
    tabList.tabDragged.style.display = 'none';
    tabList.tabOver = e.target;
    // Inside the dragOver method

    var indexTabOver = -1;
    if (tabList.tabPlaceholder && tabList.props.multiColumn) {
      try {
        indexTabOver = Array.prototype.indexOf.call(
          tabList.tabOver.parentNode.children, tabList.tabOver);
      }
      catch (ex) { }
    }

    var relY = e.clientY - Constants.offsets.TAB_LIST_TOP - tabList.pinOffset - 1;
    var parent = e.target.parentNode;
    var isFirstChild = indexTabOver == 0;

    var up = relY < tabList.lastTabDragY;
    tabList.lastTabDragY = relY;

    if (up || isFirstChild) {
      parent.insertBefore(tabList.tabPlaceholder, e.target);
    }
    else {
      parent.insertBefore(tabList.tabPlaceholder, e.target.nextSibling);
    }
  },
  tabDragEnd: function (tabList, e) {
    var tabs = TabManager.getTabs();
    var groups = GroupManager.getGroups();
    var activeGroupId = GroupManager.getActiveGroupId();

    if (!tabList.groupDragged && tabList.groupOver && tabList.tabDragged)//when tab is dragged into a group
    {
      var groupId = tabList.groupOver.getAttribute('data-reactid').split('$')[1];
      var tabId = tabList.tabDragged.getAttribute('data-reactid').split('$')[1];

     
     

      var target = GroupLogic.getGroupIndex(groupId);
      var current = GroupLogic.getGroupIndex(activeGroupId)
      var tab = tabs[this.getTabIndex(tabId)];

      var tabsToMove = [tabId].concat(tabList.selectedTabs);
      this.clearSelectedTabs(tabList);
      if (target >= 0) {
        for (var i = 0; i < tabsToMove.length; i++) {
          if (GroupLogic.getTabIndexInGroup(groups[target], tabsToMove[i]) < 0) {
            groups[target].tabs.push(tabsToMove[i]);
          }
        }
      }
      if (target >= 0 || groupId == Constants.groups.ALL_GROUP_ID) {
        if (!GroupLogic.isAllGroupActive() && current >= 0) {
          for (var i = 0; i < tabsToMove.length; i++) {
            var tabIndexInGroup = GroupLogic.getTabIndexInGroup(groups[current], tabsToMove[i]);
            if (tabIndexInGroup >= 0) {
              groups[current].tabs.splice(+tabIndexInGroup, 1);
            }
          }
          GroupLogic.setGroupsAndSave(groups);
        }
      }
      tabList.tabDragged.style.display = 'block';
      tabList.tabDragged.parentNode.removeChild(tabList.tabPlaceholder);
    } else {
      tabList.tabDragged.style.display = 'block';
      if (tabList.isSearchingTabs()) {//no moving, when searching
        return;
      }
      var index = 0;
      try {
        index = Array.prototype.indexOf.call(tabList.tabDragged.parentNode.children, tabList.tabPlaceholder);
        tabList.tabDragged.parentNode.removeChild(tabList.tabPlaceholder);
      }
      catch (ex) { }
      // Update state
      
      var draggedIndex = Array.prototype.indexOf.call(tabList.tabDragged.parentNode.children, tabList.tabDragged);

      var from = draggedIndex;
      var to = index;//Number(this.tabOver.dataset.id);

      if (!GroupLogic.isAllGroupActive()) {//if tab is dragged around inside a group
        var groupIndex = GroupLogic.getGroupIndex(tabList.state.activeGroup);
        var tabIndex = groups[groupIndex].tabs[from];

        //console.log(groupIndex+' '+tabIndex+' '+to);
        if (from == to) return;
        if (from < to) to--;

        
        if (groupIndex >= 0 && tabIndex >= 0) {
          var temp = groups[groupIndex].tabs[to];
          groups[groupIndex].tabs.splice(to, 0, groups[groupIndex].tabs.splice(from, 1)[0]);
          GroupLogic.setGroupsAndSave(groups);
        }
        return;
      }
      if (from == to) return;
      if (from < to) to--;

      //count pinned tabs
      var pinnedCount = 0;
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].pinned) {
          pinnedCount++;
        }
      }
      tabList.tabDragged = null;
      chrome.tabs.move(tabs[draggedIndex + pinnedCount].id, { index: to + pinnedCount });
    }
    if (tabList.groupOver) {
      tabList.groupOver.style.border = 'none';
    }
  },
  updateTabIds: function (tabs) {
    var ids = [];
    for (var i = 0; i < tabs.length; i++) {
      var length = Math.min(tabs[i].url.length, Constants.groups.TAB_URL_LENGTH);
      var url = tabs[i].url.substring(0, length);
      ids.push({ id: tabs[i].id, url: tabs[i].url });
    }
    Persistency.updateState({ tabIds: ids });
  }
}
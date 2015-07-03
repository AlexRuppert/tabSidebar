'use strict';

var Constants = require('../util/Constants.js');
var GroupLogic = require('../groups/Group.js');
var Helpers = require('../util/Helpers.js');
var ThumbnailCache = require('./ThumbnailCache.js');

module.exports = {
  tabSortHelper: {},
  tabsToShow: [],
  lastTabIdsShown: [],
  maxLevel: 10,
  searchQuery: '',
  buildTree: function (tree, tabSortHelper, children, nodes, level, visible, cutoff) {
    children = children.sort(function (a, b) {
      if (tabSortHelper[a] < tabSortHelper[b]) {
        return -1;
      }
      else if (tabSortHelper[a] > tabSortHelper[b]) {
        return 1;
      }
      return 0;
    });

    for (var i = 0; i < children.length; i++) {
      var id = children[i];
      var tab = TabManager.getTabs()[this.getTabIndex(+id)];
      tab.level = level;
      if (level > 0 && cutoff < 2 && i == 0) {
        tab.firstNode = true;
      }

      tab.visible = visible && tab.visible;

      tree.push(tab);
      var subChildren = nodes[id].children;
      if (subChildren.length > 0) {
        tab.parentNode = cutoff == 0;

        var nextVisible = !tab.collapsed && visible;
        var nextLevel = level + (tab.pinned ? 0 : 1);
        var nextCutOff = cutoff;
        if (nextLevel >= this.maxLevel) {
          nextCutOff++;
          nextLevel = this.maxLevel;
        }
        this.buildTree(tree, tabSortHelper, subChildren, nodes, nextLevel, nextVisible, nextCutOff);
      }
    }
  },
  changeTabCollapse: function (tabList, collapse) {
    var tabs = TabManager.getTabs();
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].collapsed = collapse;
    }
    this.setTabsAndUpdate(tabList, tabs, true);
  },
  checkTimedGroupFilters: function (tabList) {
    var group = GroupLogic.getActiveGroup();
    if (group && group.filter) {
      if (group.filterBy == Constants.groupCreator.LAST_VISITED_GREATER
        || group.filterBy == Constants.groupCreator.LAST_VISITED_LOWER
        || group.filterBy == Constants.groupCreator.OPENED_GREATER
        || group.filterBy == Constants.groupCreator.OPENED_LOWER
        || group.sortBy == Constants.groupCreator.OPENED
        || group.sortBy == Constants.groupCreator.LAST_VISITED) {
        tabList.rerenderIfNeeded();
      }
    }
  },
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
  closeOtherTabs: function (tabList, id) {
    var tabsToRemove = tabList.selectedTabs;
    if (tabsToRemove.indexOf(id) < 0) {
      tabsToRemove.push(id);
    }

    var tabsToClose = [];
    var index = this.getTabIndex(id);
    var tabs = TabManager.getTabs();

    if (index < 0 || index >= tabs.length) {
      return;
    }
    var self = this;
    var groupId = GroupManager.getActiveGroupId();
    this.getTabsToShow(groupId, function (tabsShown) {
      for (var i = 0; i < tabsShown.length; i++) {
        tabsToClose.push(+tabsShown[i].id);
      }

      tabsToClose = tabsToClose.filter(function (obj) {
        var found = false;
        for (var i = 0; i < tabsToRemove.length; i++) {
          if (obj == tabsToRemove[i]) {
            found = true;
            break;
          }
        }
        return !found;
      });

      selfm.clearSelectedTabs(tabList);
      if (tabsToClose.length > 0) {
        chrome.tabs.remove(tabsToClose);
      }
    });
  },
  closeTabsBelow: function (id) {
    var tabsToClose = [];
    var index = this.getTabIndex(id);
    var tabs = TabManager.getTabs();

    if (index < 0 || index >= tabs.length) {
      return;
    }

    var groupId = GroupManager.getActiveGroupId();
    this.getTabsToShow(groupId, function (tabsShown) {
      var indexFound = false;
      for (var i = 0; i < tabsShown.length; i++) {
        if (indexFound) {
          tabsToClose.push(+tabsShown[i].id);
        }
        else if (!indexFound && tabsShown[i].id == id) {
          indexFound = true;
        }
      }

      if (tabsToClose.length > 0) {
        chrome.tabs.remove(tabsToClose);
      }
    });
  },
  createTabTree: function (tabArray) {
    var activeGroup = GroupLogic.getActiveGroup();

    this.tabSortHelper = {}
    var nodes = {};
    this.tabsToShow = [];

    //first create a flat lookup object
    for (var i = 0; i < tabArray.length; i++) {
      var tab = tabArray[i];
      this.tabSortHelper[tab.id] = i;
      tab.firstNode = false;
      tab.parentNode = false;

      if (!tab.hasOwnProperty('openerTabId')) {
        nodes[tab.id] = { parent: null, children: [], level: 0 };
      }
      else {
        nodes[tab.id] = { parent: tab.openerTabId, children: [], level: 0 };
      }
    }
    //then create a tree structure
    var root = [];
    for (var key in nodes) {
      if (nodes.hasOwnProperty(key)) {
        if (!nodes[key].parent) {
          root.push(key);
        }
        else if (nodes[nodes[key].parent]) {
          nodes[nodes[key].parent].children.push(key);
        }
        else {
          root.push(key);
        }
      }
    }
    this.maxLevel = Persistency.getState().treeSettings.maxLevel;

    this.buildTree(this.tabsToShow, this.tabSortHelper, root, nodes, 0, true, 0);
    return this.tabsToShow;
  },
  collapseTabs: function (tabList) {
    this.changeTabCollapse(tabList, true);
  },

  expandTabs: function (tabList) {
    this.changeTabCollapse(tabList, false);
  },
  getFavIcon: function (url, favicon) {
    var result = chrome.runtime.getURL('app/media/fav/default.png');
    var browser = Constants.browser.OPERA;
    if (!url.startsWith(browser)) {
      result = browser+'://favicon/' + url || favicon || chrome.runtime.getURL('app/media/fav/default.png');
    }
    else {

      switch (url) {
        case browser + '://settings/':
          result = chrome.runtime.getURL('app/media/fav/settings.png');
          break;
        case browser + '://startpage/#speeddial':
          result = chrome.runtime.getURL('app/media/fav/newtab.png');
          break;
        case browser + '://history/':
          result = chrome.runtime.getURL('app/media/fav/history.png');
          break;
        case browser + '://themes/':
          result = chrome.runtime.getURL('app/media/fav/themes.png');
          break;
        case browser + ':://downloads/':
          result = chrome.runtime.getURL('app/media/fav/downloads.png');
          break;
        case browser + '://bookmarks/':
          result = chrome.runtime.getURL('app/media/fav/bookmarks.png');
          break;
        case browser + '://startpage/#discover':
          result = chrome.runtime.getURL('app/media/fav/discover.png');
          break;
        case browser + ':://extensions/':
          result = chrome.runtime.getURL('app/media/fav/extensions.png');
          break;
        case browser + '://plugins/':
          result = chrome.runtime.getURL('app/media/fav/plugins.png');
          break;
        case browser + '://flags/':
          result = chrome.runtime.getURL('app/media/fav/flags.png');
          break;
        default:
          result = chrome.runtime.getURL('app/media/fav/default.png');
      }
     
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

    chrome.tabs.query({}, function (tabs) {
      var originalTabs = TabManager.getTabs();
      var forceUpdateTabs = [];
      for (var i = 0; i < tabs.length; i++) {
        var index = self.getTabIndex(tabs[i].id);
        if (index >= 0) {
          var oldTitle = originalTabs[index].title;
          var oldUrl = originalTabs[index].url;
          tabs[i] = self.preserveTabProperties(originalTabs[index], tabs[i]);
          /*chrome.tabs.sendMessage(tabs[i].id, { type: 'search', value: 'batman' }, function (response) {
            if (response && response.found) {
              console.log('found');
            }
          });*/
          var changed = false;
          if (tabs[i].url != oldUrl) {
            tabs[i].favicon = self.getFavIcon(tabs[i].url, tabs[i].favIconUrl);
            changed = true;
          }
          if (tabs[i].title != oldTitle) {
            changed = true;
          }
          if (changed) {
            forceUpdateTabs.push({ id: tabs[i].id, title: tabs[i].title, favicon: tabs[i].favicon });
          }
        }
        else {
          self.initNewTab(tabs[i]);
        }
      }
      self.setTabsAndUpdate(tabList, tabs, false);

      callback(forceUpdateTabs);
    });
  },

  getTabsToShow: function (groupId, callback) {
    var currentWindowIds = [];
    var self = this;

    var tabs = TabManager.getTabs();

    var query = self.searchQuery;

    var tabsToShow = [];

    var group = GroupLogic.getGroup(groupId);

    if (!group) {
      if (groupId == Constants.groups.ALL_GROUP_ID) {
        tabsToShow = tabs.slice(0);
      }
      else if (groupId == Constants.groups.UNGROUPED_ID) {
        var tabsInGroups = {};
        var groups = GroupManager.getGroups();
        for (var i = 0; i < groups.length; i++) {
          if (!groups[i].filter) {
            for (var j = 0; j < groups[i].tabs.length; j++) {
              tabsInGroups[groups[i].tabs[j]] = true;
            }
          }
        }

        for (var i = 0; i < tabs.length; i++) {
          if (!tabsInGroups[tabs[i].id]) {
            tabsToShow.push(tabs[i]);
          }
        }
      }
    }
    else {
      if (!group.filter) {
        var usedTabIds = [];
        for (var i = 0; i < group.tabs.length; i++) {
          var tabIndex = self.getTabIndex(group.tabs[i]);
          if (tabIndex >= 0 && tabIndex < tabs.length) {
            usedTabIds.push(group.tabs[i]);
            tabsToShow.push(tabs[tabIndex]);
          }
        }
        //delete non-present tabs to save memory
        if (group.tabs.length != usedTabIds.length) {
          group.tabs = usedTabIds;

          GroupLogic.saveGroups();
        }
      }
      else { //filter groups
        tabsToShow = tabs.slice(0);
        if (group.filterValue.length > 0) {
          var filterFunc = {};
          var filterValueLower = group.filterValue.toLowerCase();

          var numVal = 0;
          var now = Date.now();
          if (Helpers.isInt(filterValueLower.trim())) {
            numVal = +filterValueLower.trim() * 60 * 1000;//min -> ms
          }
          //TODO
          var filterValueRegex = group.useRegex ? new RegExp(group.filterValue) : new RegExp(Helpers.escapeRegExp(filterValueLower));

          switch (group.filterBy) {
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
              filterFunc = function (obj) {
                return now - obj.visitedTime >= numVal;
              }
              break;
            case Constants.groupCreator.LAST_VISITED_LOWER:
              filterFunc = function (obj) {
                return now - obj.visitedTime <= numVal;
              }
              break;
            case Constants.groupCreator.OPENED_GREATER:
              filterFunc = function (obj) {
                return now - obj.openedTime >= numVal;
              }
              break;
            case Constants.groupCreator.OPENED_LOWER:
              filterFunc = function (obj) {
                return now - obj.openedTime <= numVal;
              }
              break;
            default:
              filterFunc = function (obj) {
                return true;
              }
          }
          tabsToShow = tabsToShow.filter(filterFunc);
        }
        var sortFunc = null;
        var ascending = group.sortDirection == Constants.groupCreator.ASCENDING;
        switch (group.sortBy) {
          case Constants.groupCreator.TITLE:
            sortFunc = Helpers.sortBy('title', 'string', ascending);
            break;
          case Constants.groupCreator.URL:
            sortFunc = Helpers.sortBy('url', 'string', ascending);
            break;
          case Constants.groupCreator.LAST_VISITED:
            sortFunc = Helpers.sortBy('visitedTime', '', !ascending);
            break;
          case Constants.groupCreator.OPENED:
            sortFunc = Helpers.sortBy('openedTime', '', !ascending);
            break;
          default:
        }
        if (sortFunc) {
          tabsToShow.sort(sortFunc);
        }
      }
    }

    for (var i = 0; i < tabsToShow.length; i++) {
      tabsToShow[i].visible = true; //currentWindowIds.indexOf(tabsToShow[i].id) >= 0;
    }
    if (self.searchQuery.length > 0) {
      if (self.searchQuery[0] != '.') { //search tabs only
        tabsToShow = tabsToShow.filter(function (obj) {
          return obj.title.toLowerCase().indexOf(query) >= 0;
        });
        self.tabsToShow = tabsToShow;
        callback(tabsToShow);
      }
      else if (self.searchQuery.length >= Constants.search.MIN_QUERY_LENGTH + 1) { //search tab contents
        var query = self.searchQuery.substring(1);
        var tabsCopy = tabsToShow.slice(0);
        tabsToShow = [];

        for (var i = 0; i < tabsCopy.length; i++) {
          chrome.tabs.sendMessage(tabsCopy[i].id, { type: 'search', value: query, index: i }, function (response) {
            if (response && response.found && response.index) {
              tabsToShow.push(tabsCopy[response.index]);
            }
          });
        }
        if (!window.tabContentSearchTimeout) {
          window.tabContentSearchTimeout = setTimeout(function () {
            self.tabsToShow = tabsToShow;
            window.tabContentSearchTimeout = false;
            callback(tabsToShow);
          }, 100);
        }
      }
    } else {
      self.tabsToShow = tabsToShow;
      callback(tabsToShow);
    }
  },
  handleTabMouseUp: function (tabList, id, event) {
    if (event.which == 1) {
      if (!event.ctrlKey) {
        this.clearSelectedTabs(tabList);
      }
    }
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
    var state = Persistency.getState();
    var treeClose = state.treeSettings.closeChildren;
    //if in treeView children can be closed together with parent
    if (state.tabSettings.column == Constants.menus.menuBar.viewActions.TREE_VIEW
      && treeClose != Constants.treeView.closeChildren.NEVER) {
      var index = -1;

      for (var i = 0; i < this.tabsToShow.length; i++) {
        if (this.tabsToShow[i].id == id) {
          index = i;
          break;
        }
      }

      if (index >= 0) {
        var tab = this.tabsToShow[index];
        var onlyCollapsed = treeClose == Constants.treeView.closeChildren.COLLAPSED;
        if (!onlyCollapsed || tab.collapsed) {
          var tabsToRemove = [id];
          for (var i = index + 1; i < this.tabsToShow.length; i++) {
            if (this.tabsToShow[i].level > tab.level) {
              tabsToRemove.push(this.tabsToShow[i].id);
            }
            else {
              break;
            }
          }

          chrome.tabs.remove(tabsToRemove);
          return;
        }
      }
    }
    chrome.tabs.remove(id);
  },
  handleTabCollapsed: function (tabList, id) {
    var index = this.getTabIndex(id);
    var tab = TabManager.getTabs()[index];
    tab.collapsed = !tab.collapsed;
    TabManager.setTabs(TabManager.getTabs());
    tabList.rerenderIfNeeded();
  },
  init: function () {
  },
  initNewTab: function (tab) {
    tab.favicon = this.getFavIcon(tab.url, tab.favIconUrl);
    //tab.thumbnail = ThumbnailCache.loadFromCache(tab);

    tab.collapsed = false;
    tab.level = 0;
    tab.visible = true;
    tab.openedTime = Date.now();
    tab.visitedTime = 0;
  },
  preserveTabProperties: function (target, source) {
    var properties = [
      'newlyCreated',
      'favicon', 'level', 'collapsed', 'visitedTime', 'openedTime', 'visible'];
    var obj = {};
    for (var i = 0; i < properties.length; i++) {
      obj[properties[i]] = target[properties[i]];
    }

    target = source;

    for (var i = 0; i < properties.length; i++) {
      target[properties[i]] = obj[properties[i]];
    }

    return target;
  },
  removeTabsFromGroup: function (tabList, id) {
    var tabsToRemove = tabList.selectedTabs;
    if (tabsToRemove.indexOf(id) < 0) {
      tabsToRemove.push(id);
    }
    var groupId = GroupManager.getActiveGroupId();
    if (GroupLogic.isSpecialGroup(groupId)) {
      return;
    }
    else {
      var group = GroupLogic.getGroup(groupId);
      if (group && !group.filter) {
        group.tabs = group.tabs.filter(function (obj) {
          var found = false;
          for (var i = 0; i < tabsToRemove.length; i++) {
            if (obj == tabsToRemove[i]) {
              found = true;
              break;
            }
          }
          return !found;
        });
      }
      this.clearSelectedTabs(tabList);
      GroupManager.updateGroups();
      GroupLogic.saveGroups();
      tabList.rerenderIfNeeded();
    }
  },
  searchTabs: function (tabList, query) {
    query = query.toLowerCase();
    if (query != this.searchQuery) {
      this.searchQuery = query;
      tabList.rerenderIfNeeded();
    }
  },
  selectAllTabs: function (tabList, id) {
    this.clearSelectedTabs(tabList);
    var groupId = GroupManager.getActiveGroupId();
    this.getTabsToShow(groupId, function (tabsShown) {
      for (var i = 0; i < tabsShown.length; i++) {
        var tabRef = tabsShown[i].id;
        if (!tabsShown[i].pinned && tabList.refs[tabRef]) {
          tabList.refs[tabRef].setState({ isSelected: true });
        }
        tabList.selectedTabs.push(tabsShown[i].id);
      }
    });
  },
  setTabsAndUpdate: function (tabList, tabs, redraw) {
    this.updateTabIds(tabs);
    TabManager.setTabs(tabs);

    if (redraw)
      tabList.rerenderIfNeeded();
  },
  setToCurrentTab: function (tabList) {
    chrome.tabs.query({ /*currentWindow: true,*/ active: true }, function (tabs) {
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

    setInterval(function () {
      self.checkTimedGroupFilters(tabList);
    }, 2000);

    chrome.tabs.onActivated.addListener(function (activeInfo) {
      var tabs = TabManager.getTabs();
      if (activeInfo.tabId) {
        for (var i = 0; i < tabs.length; i++) {
          var tabRef = tabs[i].id;
          if (tabRef != activeInfo.tabId
            && tabList.refs[tabRef] && tabList.refs[tabRef].state.isActive) {
            tabList.refs[tabRef].setState({ isActive: false });
          }
        }
        var index = self.getTabIndex(activeInfo.tabId);
        if (index >= 0) {
          tabs[index].visitedTime = Date.now();
          tabs[index].newlyCreated = false;
          var group = GroupLogic.getActiveGroup();
          if (group && group.filter) {
            self.checkTimedGroupFilters(tabList);
          }
        }

        if (tabList.refs[activeInfo.tabId]) {
          tabList.refs[activeInfo.tabId].setState({ isActive: true });
        }

        TabManager.setActiveTabId(activeInfo.tabId);
      }
    });
    chrome.tabs.onCreated.addListener(function (tab) {
      var tabs = TabManager.getTabs();
      if (!tab.url.startsWith('chrome-devtools://')) {
        self.initNewTab(tab);
        tab.newlyCreated = true;
        tabs.splice(tab.index, 0, tab);

        //if we are currently in a group, add tab to group

        var groups = GroupManager.getGroups();
        var activeGroupId = GroupManager.getActiveGroupId();
        self.setTabsAndUpdate(tabList, tabs, true);
        var groupIndex = GroupLogic.getGroupIndex(activeGroupId);
        if (groupIndex >= 0) {
          if (!groups[groupIndex].filter) {
            if (Persistency.getState().groupSettings.createNewTabs == Constants.groups.newTabs.BOTTOM) {
              groups[groupIndex].tabs.push(tab.id);
            }
            else {
              var index = -1;
              var currentTab = TabManager.getActiveTabId();

              for (var i = 0; i < groups[groupIndex].tabs.length; i++) {
                if (groups[groupIndex].tabs[i] == currentTab) {
                  index = i;
                  break;
                }
              }

              if (index >= 0) {
                groups[groupIndex].tabs.splice(index + 1, 0, +tab.id);
              }
              else {
                groups[groupIndex].tabs.push(+tab.id);
              }
            }
            GroupLogic.setGroupsAndSave(groups);
          }
        }

        tabList.rerenderIfNeeded();
        tabList.props.handleStatisticsUpdate();
      }
    });

    chrome.tabs.onDetached.addListener(function (tabId, detachInfo) {
      self.updateTabs(tabList);
      tabList.rerenderIfNeeded();
    });

    chrome.tabs.onAttached.addListener(function (tabId, detachInfo) {
      self.updateTabs(tabList);
      tabList.rerenderIfNeeded();
    });
    chrome.tabs.onMoved.addListener(function (tabId, moveInfo) {
      //tabs.splice(moveInfo.toIndex, 0, tabs.splice(moveInfo.fromIndex, 1)[0]);
      self.updateTabs(tabList);
    });

    chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
      self.updateTabs(tabList);
    });
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
      var tabs = TabManager.getTabs();
      if (tab.url.startsWith('chrome-devtools://'))
        return;

      var index = self.getTabIndex(tabId);

      if (index < 0)
        return;

      var changeObject = {};
      var changeObjectEmpty = true;
      var tabs = TabManager.getTabs();
      var pinnedChanged = tabs[index].pinned != tab.pinned;

      if ((typeof tab.favIconUrl !== 'undefined') &&
        (tabs[index].favicon.length <= 0
        || tabs[index].faviconUrl != tab.favIconUrl)) {
        tabs[index].faviconUrl = tab.faviconUrl;

        changeObject.favicon = self.getFavIcon(tab.url, tab.favIconUrl);
        changeObjectEmpty = false;
        tabs[index].favicon = changeObject.favicon;
      }

      var oldTitle = tabs[index].title;
      tabs[index] = self.preserveTabProperties(tabs[index], tab);

      if (changeInfo.status) {
        changeObject.isLoading = (changeInfo.status == 'loading');
        changeObjectEmpty = false;
      }

      if (oldTitle != tab.title) {
        changeObject.title = tab.title;
        changeObjectEmpty = false;
      }

      if (pinnedChanged) {
        tabList.rerenderIfNeeded();
      }

      if (!changeObjectEmpty) {
        if (tabList.refs[tabId]) {
          tabList.refs[tabId].setState(changeObject);
        }

        if (!changeObject.isLoading) {
          var group = GroupLogic.getActiveGroup();

          //update if we are in a filter group
          if (group && group.filter) {
            tabList.rerenderIfNeeded();
          }
        }
      }
      tabList.props.handleStatisticsUpdate();
      //tabList.setState({ tabs: tabs });
    });
    chrome.windows.onRemoved.addListener(function (windowId) {
      var tabs = TabManager.getTabs();
      self.updateTabIds(tabs);
    });
  },
  sortTabs: function (tabList, sort) {
    var sortFunc = null;
    var desc = false;
    switch (sort) {
      case Constants.sortModes.TITLE_ASC:
        sortFunc = Helpers.sortBy('title', 'string', true);
        desc = true;
        break;
      case Constants.sortModes.URL_ASC:
        sortFunc = Helpers.sortBy('url', 'string', true);
        desc = true;
        break;
      case Constants.sortModes.VISITED_ASC:
        sortFunc = Helpers.sortBy('visitedTime', '', false);

        break;
      case Constants.sortModes.OPENED_ASC:
        sortFunc = Helpers.sortBy('openedTime', '', false);

        break;
      case Constants.sortModes.TITLE_DESC:
        sortFunc = Helpers.sortBy('title', 'string', false);
        break;
      case Constants.sortModes.URL_DESC:
        sortFunc = Helpers.sortBy('url', 'string', false);
        break;
      case Constants.sortModes.VISITED_DESC:
        sortFunc = Helpers.sortBy('visitedTime', '', true);
        desc = true;
        break;
      case Constants.sortModes.OPENED_DESC:
        sortFunc = Helpers.sortBy('openedTime', '', true);
        desc = true;
        break;
    }
    var tabsToShow = TabManager.getTabs().slice(0);
    if (sortFunc) {
      tabsToShow.sort(sortFunc);
    }

    if (GroupLogic.isSpecialGroup(GroupManager.getActiveGroupId())) {
      var windowCounter = {};
      if (!desc) {
        chrome.windows.getAll({ populate: true }, function (windows) {
          var windowTabsCount = {};
          for (var i = 0; i < windows.length; i++) {
            windowTabsCount[windows[i].id] = windows[i].tabs.length;
          }
          for (var i = tabsToShow.length - 1; i >= 0; i--) {
            var winId = tabsToShow[i].windowId;
            if (!windowCounter.hasOwnProperty(winId)) {
              windowCounter[winId] = windowTabsCount[winId] - 1;
            }
            else {
              windowCounter[winId] -= 1;
            }
            chrome.tabs.move(tabsToShow[i].id, { windowId: winId, index: windowCounter[winId] });
          }
        });
      }
      else {
        for (var i = 0; i < tabsToShow.length; i++) {
          var winId = tabsToShow[i].windowId;
          if (!windowCounter.hasOwnProperty(winId)) {
            windowCounter[winId] = 0;
          }
          else {
            windowCounter[winId] += 1;
          }

          chrome.tabs.move(tabsToShow[i].id, { windowId: winId, index: windowCounter[winId] });
        }
      }
    }
    else {
      var group = GroupLogic.getActiveGroup();
      if (group && !group.filter && sortFunc) {
        var newGroupTabs = [];
        for (var i = 0; i < tabsToShow.length; i++) {
          if (group.tabs.indexOf(tabsToShow[i].id) >= 0) {
            newGroupTabs.push(tabsToShow[i].id);
          }
        }
        group.tabs = newGroupTabs;
        GroupLogic.saveGroups();
        tabList.rerenderIfNeeded();
      }
    }
  },
  tabDragStart: function (tabList, e) {
    tabList.tabDragged = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    tabList.tabOver = e.currentTarget;
  },
  tabDragOver: function (tabList, e) {
    e.preventDefault();
    if (e.dataTransfer.types.length > 0) {
      return;
    }
    tabList.groupOver = null;
    if (!tabList.tabDragged)
      return;
    if (this.searchQuery.length > 0) {//no moving, when searching
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
    var tabs = [];
    if (tabList.refs[Constants.refs.TAB_GROUP_LIST]) {
      tabList.refs[Constants.refs.TAB_GROUP_LIST].updateGroupHeights();
    }

    if (tabList.groupOver) {
      tabList.groupOver.style.boxShadow = '';
    }
    if (tabList.props.column == Constants.menus.menuBar.viewActions.TREE_VIEW) {
      tabs = this.tabsToShow;
    }
    else {
      tabs = TabManager.getTabs();
    }
    var groups = GroupManager.getGroups();
    var activeGroupId = GroupManager.getActiveGroupId();
    var tabId = -1;
    if (tabList.tabDragged) {
      tabId = tabList.tabDragged.getAttribute('data-reactid').split('$')[1];
    }
    if (!tabList.groupDragged && tabList.groupOver && tabList.tabDragged) {//when tab is dragged into a group
      var groupId = tabList.groupOver.getAttribute('data-reactid').split('$')[1];

      var target = GroupLogic.getGroupIndex(groupId);
      var current = GroupLogic.getGroupIndex(activeGroupId)

      var tab = tabs[this.getTabIndex(tabId)];

      var tabsToMove = [tabId].concat(tabList.selectedTabs);
      this.clearSelectedTabs(tabList);

      if (target >= 0) {
        //filter groups do not get any tabs manually
        if (!groups[target].filter) {
          for (var i = 0; i < tabsToMove.length; i++) {
            if (GroupLogic.getTabIndexInGroup(groups[target], tabsToMove[i]) < 0) {
              groups[target].tabs.push(+tabsToMove[i]);
            }
          }
        }
      }

      if (!GroupLogic.isSpecialGroup(GroupManager.getActiveGroupId()) && current >= 0 &&
        (GroupLogic.isSpecialGroup(groupId) || (target >= 0 && current != target && !groups[target].filter))) {
        for (var i = 0; i < tabsToMove.length; i++) {
          var tabIndexInGroup = GroupLogic.getTabIndexInGroup(groups[current], tabsToMove[i]);
          if (tabIndexInGroup >= 0) {
            groups[current].tabs.splice(+tabIndexInGroup, 1);
          }
        }
      }
      tabList.rerenderIfNeeded();
      GroupLogic.setGroupsAndSave(groups);

      tabList.tabDragged.style.display = 'block';
      tabList.tabDragged.parentNode.removeChild(tabList.tabPlaceholder);
    } else {
      tabList.tabDragged.style.display = 'block';
      if (this.searchQuery.length > 0) {//no moving, when searching
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

      if (!GroupLogic.isSpecialGroup(GroupManager.getActiveGroupId())) {//if tab is dragged around inside a group
        var groupIndex = GroupLogic.getGroupIndex(GroupManager.getActiveGroupId());
        var tabIndex = groups[groupIndex].tabs[from];
        if (groups[groupIndex].filter) {
          return;
        }

        if (from == to) return;
        if (from < to) to--;

        if (groupIndex >= 0 && tabIndex >= 0) {
          var temp = groups[groupIndex].tabs[to];
          groups[groupIndex].tabs.splice(to, 0, groups[groupIndex].tabs.splice(from, 1)[0]);
          GroupLogic.setGroupsAndSave(groups);
          tabList.rerenderIfNeeded();
        }
        return;
      }
      if (from == to) return;
      if (from < to) to--;

      var tabNodes = tabList.tabDragged.parentNode;
      tabList.tabDragged = null;

      //for tree tabs
      if (tabList.props.column == Constants.menus.menuBar.viewActions.TREE_VIEW
        && this.tabsToShow[to]) {
        to = this.tabSortHelper[this.tabsToShow[to].id];
      }

      //count pinned tabs

      var oldTo = to;
      var groupedTabs = {};
      if (activeGroupId == Constants.groups.UNGROUPED_ID) { //if in 'grouped' special group we have to consider the missing tabs, that are not shown...
        for (var i = 0; i < groups.length; i++) {
          for (var j = 0; j < groups[i].tabs.length; j++) {
            groupedTabs[groups[i].tabs[j]] = true;
          }
        }
      }
      var self = this;
      //supports multiple windows
      chrome.tabs.query({}, function (tabs) {
        var pinnedCount = {};
        var foreignTabs = 0;
        var shownPinned = 0;
        var pinnedTabs = [];
        var unpinnedTabs = [];
        var ungroupedOffsets = {};
        var ungroupedOffsetCount = 0;
        for (var i = 0; i < tabs.length; i++) {
          if (tabs[i].pinned) {
            shownPinned += 1;
            pinnedTabs.push(tabs[i]);
            if (!pinnedCount.hasOwnProperty(tabs[i].windowId)) {
              pinnedCount[tabs[i].windowId] = 1;
            }
            else {
              pinnedCount[tabs[i].windowId] += 1;
            }
          }
          else {
            if (!pinnedCount.hasOwnProperty(tabs[i].windowId)) {
              pinnedCount[tabs[i].windowId] = 0;
            }
            unpinnedTabs.push(tabs[i]);
          }

          if (groupedTabs.hasOwnProperty(tabs[i].id)) {//tab is in a group
            ungroupedOffsets[tabs[i].id] = ungroupedOffsetCount;
            ungroupedOffsetCount++;
          }
          else {
            ungroupedOffsets[tabs[i].id] = ungroupedOffsetCount;
          }
        }

        tabs = pinnedTabs.concat(unpinnedTabs);

        pinnedTabs = null;
        unpinnedTabs = null;

        from = self.getTabIndex(tabId);
        var tabObj = tabs[from];
        var winId = tabObj.windowId;

        to += pinnedCount[winId];

        var savedTabs = TabManager.getTabs();
        for (var i = 0; i <= to + (shownPinned - pinnedCount[winId]) ; i++) {
          if (tabs[i].windowId != winId) {
            foreignTabs++;
          }
        }

        to -= (foreignTabs - (shownPinned - pinnedCount[winId]));
        if (to < 0)
          to = 0;

        if (activeGroupId == Constants.groups.UNGROUPED_ID) {
          if (ungroupedOffsets.hasOwnProperty(tabs[to].id)) {
            to += ungroupedOffsets[tabs[to].id];
          }
        }

        if (tabList.props.column == Constants.menus.menuBar.viewActions.TREE_VIEW) {
          if (tabNodes.children[index]) {
            var targetId = tabNodes.children[index].getAttribute('data-reactid').split('$')[1];

            to = self.getTabIndex(targetId);
            if (from < to) {
              to--;
            }
          }
          else {
            to = -1;
          }
        }
        //console.log(winId + " " + foreignTabs + " " + oldTo + " "+ to);

        chrome.tabs.move(tabObj.id, { windowId: winId, index: to });
      });
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
  },
  updateTabs: function (tabList) {
    var self = this;
    chrome.tabs.query({}, function (tabs) {
      var originalTabs = TabManager.getTabs();
      for (var i = 0; i < tabs.length; i++) {
        var index = self.getTabIndex(tabs[i].id);
        if (index >= 0) {
          tabs[i] = self.preserveTabProperties(originalTabs[index], tabs[i]);
        }
        else {
          self.initNewTab(tabs[i]);
        }
      }
      self.setTabsAndUpdate(tabList, tabs, true);
      tabList.props.handleStatisticsUpdate();
    });
  }
}
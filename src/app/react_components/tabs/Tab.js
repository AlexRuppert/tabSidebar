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

      tab.visible = visible;

      tree.push(tab);
      var subChildren = nodes[id].children;
      if (subChildren.length > 0) {
        tab.parentNode = cutoff == 0;

        var nextVisible = !tab.collapsed && visible;
        var nextLevel = level + (tab.pinned?0:1);
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
      var originalTabs = TabManager.getTabs();
      var forceUpdateTabs = [];
      for (var i = 0; i < tabs.length; i++) {
        var index = self.getTabIndex(tabs[i].id);
        if (index >= 0) {
          var oldTitle = originalTabs[index].title;
          var oldUrl = originalTabs[index].url;
          tabs[i] = self.preserveTabProperties(originalTabs[index], tabs[i]);
          
          var changed = false;
          if (tabs[i].url != oldUrl) {
            tabs[i].favicon = this.getFavIcon(tabs[i].url, tabs[i].favIconUrl);
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
  getTabsToShow: function (groupId) {
    var tabs = TabManager.getTabs();

    var query = this.searchQuery;

    var tabsToShow = [];

    var group = GroupLogic.getGroup(groupId);

    if (!group) {
      tabsToShow = tabs.slice(0);
    }
    else {
      if (!group.filter) {
        var usedTabIds = [];
        for (var i = 0; i < group.tabs.length; i++) {
          var tabIndex = this.getTabIndex(group.tabs[i]);
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

          var filterValueRegex = new RegExp(Helpers.escapeRegExp(filterValueLower));
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
        var sortFunc = {}
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
        tabsToShow.sort(sortFunc);
      }
    }

    for (var i = 0; i < tabsToShow.length; i++) {
      tabsToShow[i].visible = true;
    }
    if (this.searchQuery.length > 0) {
      tabsToShow = tabsToShow.filter(function (obj) {
        return obj.title.toLowerCase().indexOf(query) >= 0;
      });
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
    tab.thumbnail = '';
    tab.collapsed = false;
    tab.level = 0;
    tab.visible = true;
    tab.openedTime = Date.now();
    tab.visitedTime = 0;
  },
  preserveTabProperties: function (target, source) {
    var properties = [
      'newlyCreated', 'hasThumbnail', 'thumbnail',
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
  searchTabs: function (tabList, query) {
    query = query.toLowerCase();
    if (query != this.searchQuery) {
      this.searchQuery = query;
      tabList.rerenderIfNeeded();
    }
  },
  setTabsAndUpdate: function (tabList, tabs, redraw) {
    this.updateTabIds(tabs);
    TabManager.setTabs(tabs);

    if (redraw)
      tabList.rerenderIfNeeded();
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
    setInterval(function () {
      self.checkTimedGroupFilters(tabList);
    }, 1000);

    chrome.tabs.onActivated.addListener(function (activeInfo) {
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
                groups[groupIndex].tabs.splice(index+1, 0, tab.id);
              }
              else {
                groups[groupIndex].tabs.push(tab.id);
              }
            }
            GroupLogic.setGroupsAndSave(groups);
            tabList.rerenderIfNeeded();
          }
          else {
            tabList.rerenderIfNeeded();
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

    if (tabList.props.column == Constants.menus.menuBar.viewActions.TREE_VIEW) {
      tabs = this.tabsToShow;
    }
    else {
      tabs = TabManager.getTabs();
    }
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
        //filter groups do not get any tabs manually
        if (!groups[target].filter) {
          for (var i = 0; i < tabsToMove.length; i++) {
            if (GroupLogic.getTabIndexInGroup(groups[target], tabsToMove[i]) < 0) {
              groups[target].tabs.push(tabsToMove[i]);
            }
          }
        }
      }

      if (!GroupLogic.isAllGroupActive() && current >= 0 &&
        (groupId == Constants.groups.ALL_GROUP_ID || (target >= 0 && current != target && !groups[target].filter))) {
        for (var i = 0; i < tabsToMove.length; i++) {
          var tabIndexInGroup = GroupLogic.getTabIndexInGroup(groups[current], tabsToMove[i]);
          if (tabIndexInGroup >= 0) {
            groups[current].tabs.splice(+tabIndexInGroup, 1);
          }
        }
        tabList.rerenderIfNeeded();
       
      }
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

      if (!GroupLogic.isAllGroupActive()) {//if tab is dragged around inside a group
        var groupIndex = GroupLogic.getGroupIndex(GroupManager.getActiveGroupId());
        var tabIndex = groups[groupIndex].tabs[from];
        if (groups[groupIndex].filter) {
          return;
        }
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
      //for tree tabs
      if (tabList.props.column == Constants.menus.menuBar.viewActions.TREE_VIEW) {
        to = this.tabSortHelper[this.tabsToShow[to].id];
      }
      chrome.tabs.move(tabs[draggedIndex + pinnedCount].id, { index: to + pinnedCount });
    }
    if (tabList.groupOver) {
      tabList.groupOver.style.boxShadow = '';
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
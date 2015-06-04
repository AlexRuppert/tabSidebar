'use strict';

var Colors = require('../util/Colors.js');
var Constants = require('../util/Constants.js')
var Helpers = require('../util/Helpers.js')
var Strings = require('../util/Strings.js')

module.exports = {
  cloneGroup: function (groupList, id) {
    var tabs = TabManager.getTabs();
    var title = Strings.groups.ALL_GROUP_CLONE;
    var newId = this.getNewGroupId();
    var groups = GroupManager.getGroups();
    var cloneTabs = [];

    if (id == Constants.groups.ALL_GROUP_ID) {
      for (var i = 0; i < tabs.length; i++) {
        cloneTabs.push(tabs[i].id);
      }
    }
    else {
      var index = this.getGroupIndex(id);
      if (index >= 0) {
        var groupSource = groups[index];
        title = groupSource.title;
        for (var i = 0; i < groupSource.tabs.length; i++) {
          cloneTabs.push(groupSource.tabs[i]);
        }
      }
      else {
        return;
      }
    }
    groups.push({ title: title, id: newId, tabs: cloneTabs, color: Colors.getColorByHash(Colors.backgroundColors, newId) });
    this.setGroupsAndSave(groups);
  },
  createNewGroup: function (groupList, name, color, filter) {
    var groups = GroupManager.getGroups();
    var newGroup = {};
    if (typeof filter === 'undefined') {
      newGroup = { title: name, id: this.getNewGroupId(), tabs: [], color: color };
    }
    else {
      newGroup = {
        title: name,
        id: this.getNewGroupId(),
        tabs: [], color: color,
        filter: true,
        filterBy: filter.filterBy,
        filterValue: filter.filterValue,
        sortBy: filter.sortBy,
        sortDirection: filter.sortDirection
      };
    }
    groups.push(newGroup);
    this.setGroupsAndSave(groups);
  },
  getActiveGroup: function () {
    var groups = GroupManager.getGroups();
    var index = this.getGroupIndex(GroupManager.getActiveGroupId());
    if (index >= 0) {
      return groups[index];
    }
    return null;
  },
  getBestIdMapping: function (older, newer) {
    if (older.length === 0) return [];
    if (newer.length === 0) return [];

    var mapping = {};
    var matrix = [];

    // increment along the first column of each row
    var i;
    for (i = 0; i <= newer.length; i++) {
      matrix[i] = [i];
    }

    // increment each column in the first row
    var j;
    for (j = 0; j <= older.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (i = 1; i <= newer.length; i++) {
      for (j = 1; j <= older.length; j++) {
        if (newer[i - 1].url == older[j - 1].url) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                                  Math.min(matrix[i][j - 1] + 1, // insertion
                                           matrix[i - 1][j] + 1)); // deletion
        }
      }
    }

    //traverse matrix backwards to find path
    var row = newer.length;
    var column = older.length;
    for (var i = 0; i < newer.length + older.length; i++) {
      if (row == 0 && column == 0) {
        break;
      }
      var substitution = 900000;
      var insertion = 900000;
      var deletion = 900000;
      if (row > 0 && column > 0) {
        substitution = matrix[row - 1][column - 1];
      }
      if (column > 0) {
        insertion = matrix[row][column - 1];
      }
      if (row > 0) {
        deletion = matrix[row - 1][column];
      }

      if (substitution <= insertion && substitution <= deletion) {
        row--;
        column--;
        mapping[older[column].id] = newer[row].id;
      }
      else if (insertion <= substitution && insertion <= deletion) {
        column--;
      }
      else //deletion smallest
      {
        row--;
      }
    }
    return mapping;
  },
  getGroupIndex: function (id) {
    var groups = GroupManager.getGroups();
    for (var i = 0; i < groups.length; i++) {
      if (groups[i].id == id) {
        return i;
      }
    }
    return -1;
  },
  getNewGroupId: function () {
    return 'g' + Math.random().toString(36).substr(2, 9);
  },
  getTabIndexInGroup: function (group, tabId) {
    for (var i = 0; i < group.tabs.length; i++) {
      if (group.tabs[i] == tabId) {
        return i;
      }
    }
    return -1;
  },
  groupDragStart: function (tabList, e) {
    tabList.groupDragged = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    tabList.groupOver = e.currentTarget;
  },
  groupDragOver: function (groupList, tabList, e) {
    e.preventDefault();

    //only 2 levels to keep it simple: check if we are over another tab
    if (!e.target.classList.contains('tab-group') && !e.target.classList.contains('group-placeholder')) {
      e.target = e.target.parentNode;

      if (!e.target.classList.contains('tab-group') && !e.target.classList.contains('group-placeholder')) {
        return;
      }
    }

    if (!tabList.groupDragged && tabList.tabDragged) {
      if (e.target)
        if (tabList.groupOver) {
          tabList.groupOver.style.border = 'none';
        }
      tabList.groupOver = e.target;

      tabList.groupOver.style.border = '1px dashed #eee';
      return;
    }

    tabList.groupDragged.style.display = 'none';
    tabList.groupOver = e.target;
    // Inside the dragOver method

    var indexGroupOver = -1;
    if (groupList.groupPlaceholder && true) {
      try {
        indexGroupOver = Array.prototype.indexOf.call(
          tabList.groupOver.parentNode.children, tabList.groupOver);
      }
      catch (ex) { }
    }

    var relY = e.clientY - Constants.offsets.TAB_LIST_TOP;
    var parent = e.target.parentNode;
    var isFirstChild = indexGroupOver == 0;

    var up = relY < tabList.lastTabDragY;
    tabList.lastTabDragY = relY;

    if (up || isFirstChild) {
      parent.insertBefore(groupList.groupPlaceholder, e.target);
    }
    else {
      parent.insertBefore(groupList.groupPlaceholder, e.target.nextSibling);
    }
    
      groupList.updateGroupHeights(50);
    
    /*
    var relY = e.clientY - tabList.groupOver.offsetTop - Constants.offsets.TAB_LIST_TOP;
    var height = tabList.groupOver.offsetHeight / 2;
    var parent = e.target.parentNode;
    if (relY > height) {
      parent.insertBefore(groupList.groupPlaceholder, e.target.nextElementSibling);
    }
    else {
      parent.insertBefore(groupList.groupPlaceholder, e.target);
    }*/
  },
  groupDragEnd: function (groupList, tabList, e) {
    tabList.groupDragged.style.display = 'block';
    var index = 0;
    try {
      index = Array.prototype.indexOf.call(tabList.groupDragged.parentNode.children, groupList.groupPlaceholder);
      tabList.groupDragged.parentNode.removeChild(groupList.groupPlaceholder);
    }
    catch (ex) { }
    // Update state
    var groups = GroupManager.getGroups();
    var draggedIndex = Array.prototype.indexOf.call(tabList.groupDragged.parentNode.children, tabList.groupDragged);

    var from = draggedIndex - 1;
    //var from = this.getGroupIndex(this.groupDragged.dataset.id)-1;
    var to = index - 1;//Number(this.tabOver.dataset.id);
    if (from == to) return;
    if (from < to) to--;
    //  if(this.tabNodePlacement == "after") to++;

    groups.splice(to, 0, groups.splice(from, 1)[0]);
    tabList.groupDragged = null;
    this.setGroupsAndSave(groups);
  },
  handleEditTabGroup: function (groupList, id) {
    if (id == Constants.groups.ALL_GROUP_ID)
      return;
    var groups = GroupManager.getGroups();
    var index = this.getGroupIndex(groupList, id);
    var self = this;
    if (index >= 0) {
      groupList.props.handleEditTabGroup(groups[index], function (title, color) {
        groups[index].title = title;
        groups[index].color = color;

        self.setGroupsAndSave(groups);
      });
    }
  },
  handleGroupClicked: function (groupList, id, event) {
    event = event.nativeEvent;
    if (event.which == 1) {
      var activeGroup = GroupManager.getActiveGroupId();
      if (activeGroup != id) {
        if (groupList.refs[activeGroup]) {
          groupList.refs[activeGroup].setState({ isActive: false });
        }
        GroupManager.setActiveGroupId(id);
      }
    }
    else if (event.which == 2) {
      this.handleGroupClosed(groupList, id);
    }
  },
  handleGroupClosed: function (groupList, id) {
    if (id == Constants.groups.ALL_GROUP_ID)
      return;
    var groups = GroupManager.getGroups();
    var newGroups = groups.filter(function (obj) {
      return obj.id != id;
    });
    var activeGroup = GroupManager.getActiveGroupId();
    var newActiveGroup =
      (id == activeGroup ? Constants.groups.ALL_GROUP_ID : activeGroup);

    GroupManager.setActiveGroupId(newActiveGroup);
    this.setGroupsAndSave(newGroups);
  },
  init: function () {
  },
  isAllGroupActive: function () {
    var activeGroup = GroupManager.getActiveGroupId();
    return activeGroup == Constants.groups.ALL_GROUP_ID;
  },
  loadGroups: function () {
    this.init();
    var tabs = TabManager.getTabs();
    var groups = Persistency.getState().groups;

    var sameSession = true;
    if (!chrome.extension.getBackgroundPage().hasOwnProperty(Constants.globalProperties.SAME_SESSION)) {
      chrome.extension.getBackgroundPage()[Constants.globalProperties.SAME_SESSION] = true;
      sameSession = false;
    }

    var ids = [];
    for (var i = 0; i < tabs.length; i++) {
      var id = tabs[i].id;
      var url = tabs[i].url;
      var length = Math.min(url.length, Constants.groups.TAB_URL_LENGTH);
      url = url.substring(0, length);
      ids.push({ id: id, url: url });
    }

    if (!sameSession) {
      var oldIds = Persistency.getState().tabIds;

      var mapping = this.getBestIdMapping(oldIds, ids);

      for (var i = 0; i < groups.length; i++) {
        //clear any mistakently saved tabs in group
        if (groups[i].filter && groups[i].tabs.length > 0) {
          groups[i].tabs = [];
        }
        for (var j = 0; j < groups[i].tabs.length; j++) {
          if (mapping.hasOwnProperty(groups[i].tabs[j])) {
            groups[i].tabs[j] = mapping[groups[i].tabs[j]];
          }
        }
      }
    }

    var changed = false;
    for (var i = 0; i < groups.length; i++) {
      var newTabs = [];

      for (var j = 0; j < groups[i].tabs.length; j++) {
        for (var k = 0; k < ids.length; k++) {
          if (ids[k].id == groups[i].tabs[j]) {
            newTabs.push(groups[i].tabs[j]);
            break;
          }
        }
      }

      if (newTabs.length != groups[i].tabs.length) {
        changed = true;
        groups[i].tabs = newTabs;
      }
    }

    GroupManager.setGroups(groups);
    if (changed || !sameSession) {
      this.saveGroups();
    }
  },
  saveGroups: function () {
    Persistency.updateState({ groups: GroupManager.getGroups() });
  },
  setGroupsAndSave: function (groups) {
    GroupManager.setGroups(groups);
    this.saveGroups();
  }
}
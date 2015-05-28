'use strict';

var Colors = require('../util/Colors.js');
var Constants = require('../util/Constants.js')
var Helpers = require('../util/Helpers.js')
var Strings = require('../util/Strings.js')

module.exports = {
  Persistency: null,

  cloneGroup: function (tabList, id) {
    var title = Strings.groups.ALL_GROUP_CLONE;
    var newId = this.getNewGroupId();
    var groups = tabList.state.groups;
    var cloneTabs = [];

    if (id == Constants.groups.ALL_GROUP_ID) {
      for (var i = 0; i < tabList.state.tabs.length; i++) {
        cloneTabs.push(tabList.state.tabs[i].id);
      }
    }
    else {
      var index = this.getGroupIndex(tabList, id);
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
    this.setGroupsAndUpdate(tabList, groups, true);
  },
  createNewGroup: function (tabList, name, color) {
    var groups = tabList.state.groups;
    groups.push({ title: name, id: this.getNewGroupId(), tabs: [], color: color })
    this.setGroupsAndUpdate(tabList, groups, true);
  },
  getActiveGroup: function (tabList) {
    var index = this.getGroupIndex(tabList, tabList.state.activeGroup);
    if (index >= 0) {
      return tabList.state.groups[index];
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
  getGroupIndex: function (tabList, id) {
    for (var i = 0; i < tabList.state.groups.length; i++) {
      if (tabList.state.groups[i].id == id) {
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
  groupDragOver: function (tabList, e) {
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

    var relY = e.clientY - tabList.groupOver.offsetTop - Constants.offsets.TAB_LIST_TOP;
    var height = tabList.groupOver.offsetHeight / 2;
    var parent = e.target.parentNode;
    if (relY > height) {
      parent.insertBefore(tabList.groupPlaceholder, e.target.nextElementSibling);
    }
    else {
      parent.insertBefore(tabList.groupPlaceholder, e.target);
    }
  },
  groupDragEnd: function (tabList, e) {
    tabList.groupDragged.style.display = 'block';
    var index = 0;
    try {
      index = Array.prototype.indexOf.call(tabList.groupDragged.parentNode.children, tabList.groupPlaceholder);
      tabList.groupDragged.parentNode.removeChild(tabList.groupPlaceholder);
    }
    catch (ex) { }
    // Update state
    var groups = tabList.state.groups;
    var draggedIndex = Array.prototype.indexOf.call(tabList.groupDragged.parentNode.children, tabList.groupDragged);

    var from = draggedIndex - 1;
    //var from = this.getGroupIndex(this.groupDragged.dataset.id)-1;
    var to = index - 1;//Number(this.tabOver.dataset.id);
    if (from == to) return;
    if (from < to) to--;
    //  if(this.tabNodePlacement == "after") to++;

    groups.splice(to, 0, groups.splice(from, 1)[0]);
    tabList.groupDragged = null;
    this.setGroupsAndUpdate(tabList, groups, true);
  },
  handleEditTabGroup: function (tabList, id) {
    if (id == Constants.groups.ALL_GROUP_ID)
      return;
    var index = this.getGroupIndex(tabList, id);
    var self = this;
    if (index >= 0) {
      tabList.props.handleEditTabGroup(tabList.state.groups[index], function (title, color) {
        tabList.state.groups[index].title = title;
        tabList.state.groups[index].color = color;

        self.setGroupsAndUpdate(tabList, tabList.state.groups, true);
      });
    }
  },
  handleGroupClicked: function (tabList, id, event) {
    event = event.nativeEvent;
    if (event.which == 1) {
      var activeGroup = tabList.state.activeGroup;
      if (activeGroup != id) {
        if (tabList.refs[activeGroup]) {
          tabList.refs[activeGroup].setState({ isActive: false });
        }

        tabList.setState({ activeGroup: id });
      }
    }
    else if (event.which == 2) {
      this.handleGroupClosed(tabList, id);
    }
  },
  handleGroupClosed: function (tabList, id) {
    if (id == Constants.groups.ALL_GROUP_ID)
      return;
    var newGroups = tabList.state.groups.filter(function (obj) {
      return obj.id != id;
    });
    var newActiveGroup =
      (id == tabList.state.activeGroup ? Constants.groups.ALL_GROUP_ID : tabList.state.activeGroup);

    tabList.setState({ activeGroup: newActiveGroup });
    this.setGroupsAndUpdate(tabList, newGroups, true);
  },
  init: function () {
    this.Persistency = chrome.extension.getBackgroundPage()[Constants.globalProperties.PERSISTENCY];
  },
  isAllGroupActive: function (tabList) {
    return tabList.state.activeGroup == Constants.groups.ALL_GROUP_ID;
  },
  loadGroups: function (tabList) {
    this.init();
    var groups = this.Persistency.getState().groups;

    var sameSession = true;
    if (!chrome.extension.getBackgroundPage().hasOwnProperty(Constants.globalProperties.SAME_SESSION)) {
      chrome.extension.getBackgroundPage()[Constants.globalProperties.SAME_SESSION] = true;
      sameSession = false;
    }
    
    var ids = [];
    for (var i = 0; i < tabList.state.tabs.length; i++) {
      var id = tabList.state.tabs[i].id;
      var url = tabList.state.tabs[i].url;
      var length = Math.min(url.length, Constants.groups.TAB_URL_LENGTH);
      url = url.substring(0, length);
      ids.push({ id: id, url: url });
    }

    if (!sameSession) {
      var oldIds = this.Persistency.getState().tabIds;

      var mapping = this.getBestIdMapping(oldIds, ids);

      for (var i = 0; i < groups.length; i++) {
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
    if (changed || !sameSession) {
      this.saveGroups(groups);
    }

    tabList.setState({ groups: groups });
    //console.log(this.Persistency.getState().groups);
    
  },
  loadLastActiveGroup: function () {
    if (chrome.extension.getBackgroundPage()[Constants.globalProperties.LAST_ACTIVE_GROUP])
      return chrome.extension.getBackgroundPage()[Constants.globalProperties.LAST_ACTIVE_GROUP];

    return Constants.groups.ALL_GROUP_ID;
  },
  saveGroups: function (groups) {   
    this.Persistency.updateState({ groups: groups });
  },
  saveLastActiveGroup: function (lastActiveGroup) {
    chrome.extension.getBackgroundPage()[Constants.globalProperties.LAST_ACTIVE_GROUP] = lastActiveGroup;
  },
  setGroupsAndUpdate: function (tabList, groups, redraw) {
    tabList.setState({ groups: groups });
    this.saveGroups(groups);
    if (redraw)
      tabList.forceUpdate();
  }
}
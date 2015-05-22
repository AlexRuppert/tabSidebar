"use strict";

module.exports = {
  Persistency: null,
  allGroupId: 'allGroup',
  init: function () {
    this.Persistency = chrome.extension.getBackgroundPage().persistency;
  },
  loadLastActiveGroup: function () {
    if (chrome.extension.getBackgroundPage().lastActiveGroup)
      return chrome.extension.getBackgroundPage().lastActiveGroup;

    return this.allGroupId;
  },
  saveLastActiveGroup: function (lastActiveGroup) {
    chrome.extension.getBackgroundPage().lastActiveGroup = lastActiveGroup;
  },

  loadGroups: function (tabList) {
    this.init();
    var groups = this.Persistency.getState().groups;

    var ids = [];
    for (var i = 0; i < tabList.state.tabs.length; i++) {
      var id = tabList.state.tabs[i].id;
      ids.push(id);
    }
    console.log(ids);
    var changed = false;
    for (var i = 0; i < groups.length; i++) {
      var newTabs = groups[i].tabs.filter(function (obj) {
        return ids.indexOf(obj) >= 0;
      });

      if (newTabs.length != groups[i].tabs.length) {
        console.log("deleted!");
        changed = true;
        groups[i].tabs = newTabs;
      }
    }
    if (changed) {
      this.saveGroups(groups);
    }

    tabList.setState({ groups: groups });
    //console.log(this.Persistency.getState().groups);
    tabList.forceUpdate();
  },
  saveGroups: function (groups) {
    this.Persistency.updateState({ groups: groups });
  }
}
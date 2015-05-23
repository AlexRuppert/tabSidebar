"use strict";

module.exports = {
  Persistency: null,
  allGroupId: 'allGroup',
  init: function () {
    this.Persistency = chrome.extension.getBackgroundPage().persistency;
  },
  getNewGroupId: function(){
    return 'g'+ Math.random().toString(36).substr(2,9);
  },
  loadLastActiveGroup: function () {
    if (chrome.extension.getBackgroundPage().lastActiveGroup)
      return chrome.extension.getBackgroundPage().lastActiveGroup;

    return this.allGroupId;
  },
  saveLastActiveGroup: function (lastActiveGroup) {
    chrome.extension.getBackgroundPage().lastActiveGroup = lastActiveGroup;
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
  loadGroups: function (tabList) {
    this.init();
    var groups = this.Persistency.getState().groups;

    var sameSession = true;
    if (!chrome.extension.getBackgroundPage().sameSession) {
      chrome.extension.getBackgroundPage().sameSession = true;
      sameSession = false;
    }

    var ids = [];
    for (var i = 0; i < tabList.state.tabs.length; i++) {
      var id = tabList.state.tabs[i].id;
      var url = tabList.state.tabs[i].url;
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
    tabList.forceUpdate();
  },
  saveGroups: function (groups, tabs) {
   
    this.Persistency.updateState({ groups: groups });
  }
}
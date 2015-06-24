/** @jsx React.DOM */
'use strict';


var Constants = require('../util/Constants.js');
var ContextMenu = require('../menus/ContextMenu.jsx');
var GroupContextMenu = require('../menus/GroupContextMenu.js');
var GroupLogic = require('../groups/Group.js');
var Strings = require('../util/Strings.js');
var TabGroup = require('../groups/TabGroup.jsx');

module.exports = React.createClass({
  groupPlaceholder: document.createElement('div'),
  lastHeightsUpdate: 0,
  hasUngrouped: false,
  createNewGroup: function (name, color, filter) {
    GroupLogic.createNewGroup(this, name, color, filter);
  },  
  groupsChanged: function () {
    this.forceUpdate();
    this.props.parent.props.handleStatisticsUpdate();
  },

  updateGroupHeights: function (fixed) {
    
    if (!this.state.isVisible) {
      return;
    }
    var isFixed = typeof fixed !== 'undefined';
    if (isFixed) {
      var now = Date.now();
      if (this.lastHeightsUpdate + 100 >= now){
        return;
      }
      this.lastHeightsUpdate = now;
    } 
    

    var parent = React.findDOMNode(this.refs[Constants.refs.TAB_GROUP_CONTAINER]);
    if (!parent) {
      return;
    }
    
    var children = parent.children;
    for (var i = 0; i < children.length; i++) {
      if (!isFixed) {
        children[i].style.height = '';
      }
    }
    var self = this;
   
    for (var i = 0; i < children.length-1; i+=2) {
      if (isFixed) {
        if (children[i].clientHeight != fixed)
          children[i].style.height = fixed + 'px';
        if (children[i+1].clientHeight != fixed)
          children[i+1].style.height = fixed + 'px';
      }
      else {
        if (this.props.twoColumns) {
          var selfHeight = children[i].clientHeight;
          var neighborHeight = children[i+1].clientHeight;
        
          if (selfHeight < neighborHeight) {

            children[i].style.height = neighborHeight+2 + 'px';
            children[i+1].style.height = neighborHeight+2 + 'px';
          }
          else if (neighborHeight < selfHeight) {
            children[i].style.height = selfHeight +2+ 'px';
            children[i+1].style.height = selfHeight +2+ 'px';
          }
        }
      }
      
    }    
   
    
  },
  getInitialState: function () {
    this.groupPlaceholder.className = 'group-placeholder';
    //GroupManager.addGroupsChangedListener(Constants.refs.TAB_GROUP_LIST, this.groupsChanged);
    return {
      isVisible: this.props.isVisible || false
    };
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    
    if (this.state.isVisible != nextState.isVisible)
      return true;
    if (this.props.twoColumns != nextProps.twoColumns)
      return true;
    return false;
  },
  componentDidMount: function () {
    var self = this;

    chrome.windows.onFocusChanged.addListener(function (windowId) {
      if(windowId >= 0){
        self.groupsChanged();
      }
    });

    setTimeout(function(){
      self.groupsChanged();
    },200);
    //update group heights
    this.updateGroupHeights();
  },
  componentDidUpdate: function (prevProps, prevState) {
    //update group heights
    this.updateGroupHeights();
  },
  handleGroupClicked: function (id, event) {
    GroupLogic.handleGroupClicked(this, id, event);
  },
  handleGroupClosed: function (id) {
    GroupLogic.handleGroupClosed(this, id);
  },
  handleEditTabGroup: function (id) {
      GroupLogic.handleEditTabGroup(this, id);
  },
  groupDragStart: function (e) {
    GroupLogic.groupDragStart(this.props.parent, e);
  },
  groupDragEnter: function (e) {
    GroupLogic.groupDragEnter(e);
  },
  groupDragLeave: function (e) {
    GroupLogic.groupDragLeave(e);
  },
  groupDragOver: function (e) {
    GroupLogic.groupDragOver(this, this.props.parent, e);
  },
  groupDragEnd: function (e) {
    GroupLogic.groupDragEnd(this, this.props.parent, e);
  },
  handleGroupContextMenuOpen: function (props, event) {
    this.refs[Constants.refs.GROUP_CONTEXT_MENU].handleContextMenu(props, event);
  },
  handleGroupContextMenuSelect: function (id, action) {
    var index = GroupLogic.getGroupIndex(id);
    switch (action) {
      case Constants.menus.contextMenu.groupActions.NEW_GROUP:
        this.props.handleNewTabGroup();
        break;
      case Constants.menus.contextMenu.groupActions.CLONE_GROUP:
        GroupLogic.cloneGroup(this, id);
        break;
      case Constants.menus.contextMenu.groupActions.CLONE_AS_NORMAL:
        GroupLogic.cloneAsNormalGroup(this, id);
        break;
      case Constants.menus.contextMenu.groupActions.CLOSE_TABS:
        GroupLogic.closeTabs(this, id);
        break;
      case Constants.menus.contextMenu.groupActions.EDIT_GROUP:
        this.handleEditTabGroup(id);
        break;
      case Constants.menus.contextMenu.groupActions.CLOSE_GROUP:
        this.handleGroupClosed(id);
        break;
      case Constants.menus.contextMenu.groupActions.CLOSE_OTHER_GROUPS:
        var groups = [];
        if (!GroupLogic.isSpecialGroup(id)) {
          var group = GroupManager.getGroups()[index];
          groups.push(group);
        }
        GroupLogic.setStateAndUpdate(this, groups, true);
        break;
    }
  },
  render: function () {
    
    var groupListClasses = classNames({
      'tab-group-list': true,
      'no-background':!Persistency.getState().groupSettings.showBarBackground,
      'two-columns': this.props.twoColumns,
      'hidden': !this.state.isVisible
    });
    var groupBarClasses = classNames({
      'tab-group-bar': true,
      'two-columns': this.props.twoColumns,
      'hidden': !this.state.isVisible || !Persistency.getState().groupSettings.showBarBackground
    });

    var groupsToShow = [];
    var groupNodes = [];
    
    if (this.state.isVisible) {
      groupsToShow.push({
        id: Constants.groups.ALL_GROUP_ID,
        title: Strings.groups.ALL_GROUP,
        color: Constants.groups.ALL_GROUP_COLOR
      });
      var groups = GroupManager.getGroups();
      this.hasUngrouped = false;
      for (var i = 0; i < groups.length; i++) {
        if(!groups[i].filter){
          this.hasUngrouped = true;
          groupsToShow.push({
            id: Constants.groups.UNGROUPED_ID,
            title: Strings.groups.UNGROUPED,
            color: Constants.groups.UNGROUPED_COLOR
          });
          break;
        }
      }
      
      if(groups.length > 0) {
        groupsToShow = groupsToShow.concat(groups);
      }
      var activeGroupId = GroupManager.getActiveGroupId();
      
      groupNodes = groupsToShow.map(function (group, i) {
        return (
          <TabGroup
            ref = { group.id }
            id = { group.id }
            index = { i }
            key = { group.id }
            title = { group.title }
            color = { group.color }
            isActive = { activeGroupId == group.id}
            isFilter = { group.filter }
            onContextMenu = { this.handleGroupContextMenuOpen }
            onDragEnd = { this.groupDragEnd }
            onDragStart = { this.groupDragStart }
            onDragEnter = { this.groupDragEnter }
            onDragLeave = { this.groupDragLeave }
            onGroupClicked = { this.handleGroupClicked }
            onGroupClosed = { this.handleGroupClosed }
          />
        );
      }, this);
    }
     
    return (
      <div className = "tab-group-list-container">
        <ContextMenu
          ref = { Constants.refs.GROUP_CONTEXT_MENU }
          items = { GroupContextMenu }
          handleSelect = { this.handleGroupContextMenuSelect }/>

        <div
          ref = { Constants.refs.TAB_GROUP_CONTAINER }
          className = { groupListClasses }
          onDragOver = { this.groupDragOver }>
          { groupNodes }
        </div>
        <div
          className = { groupBarClasses }/>
      </div>
    );
  }
});

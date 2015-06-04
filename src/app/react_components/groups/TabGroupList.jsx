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
  createNewGroup: function (name, color, filter) {
    GroupLogic.createNewGroup(this, name, color, filter);
  },  
  groupsChanged: function () {    
    this.forceUpdate();
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
    
    for (var i = 0; i < children.length-1; i+=2) {
      
      if (isFixed) {
        if (selfHeight != fixed)
          children[i].style.height = fixed + 'px';
        if (neighborHeight != fixed)
          children[i+1].style.height = fixed + 'px';
      }
      else {
        children[i].style.height = '';
        children[i+1].style.height = '';
        
        if (this.props.twoColumns) {
          var selfHeight = children[i].clientHeight;
          var neighborHeight = children[i+1].clientHeight;
        
          if (selfHeight < neighborHeight) {

            children[i].style.height = neighborHeight + 'px';
            children[i+1].style.height = neighborHeight + 'px';
          }
          else if (neighborHeight < selfHeight) {
            children[i].style.height = selfHeight + 'px';
            children[i+1].style.height = selfHeight + 'px';
          }
        }
      }
      if(children.length % 2 == 1) {
        children[children.length-1].style.height = '';
      }
    }    
  },
  getInitialState: function () {
    this.groupPlaceholder.className = 'group-placeholder';
    GroupManager.addGroupsChangedListener(Constants.refs.TAB_GROUP_LIST, this.groupsChanged);
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
      case Constants.menus.contextMenu.groupActions.EDIT_GROUP:
        this.handleEditTabGroup(id);
        break;
      case Constants.menus.contextMenu.groupActions.CLOSE_GROUP:
        this.handleGroupClosed(id);
        break;
      case Constants.menus.contextMenu.groupActions.CLOSE_OTHER_GROUPS:
        if (id != Constants.groups.ALL_GROUP_ID) {
          var group = GroupManager.getGroups()[index];
          var groups = [];
          groups.push(group);
          GroupLogic.setStateAndUpdate(this, groups, true);
        }
        break;
    }
  },
  render: function () {
    
    var groupListClasses = classNames({
      'tab-group-list': true,
      'two-columns': this.props.twoColumns,
      'hidden': !this.state.isVisible
    });
    var groupBarClasses = classNames({
      'tab-group-bar': true,
      'two-columns': this.props.twoColumns,
      'hidden': !this.state.isVisible
    });

    var groupsToShow = [];
    var groupNodes = [];
    
    if (this.state.isVisible) {
      groupsToShow.push({
        id: Constants.groups.ALL_GROUP_ID,
        title: Strings.groups.ALL_GROUP,
        color: Constants.groups.ALL_GROUP_COLOR
      });
      groupsToShow = groupsToShow.concat(GroupManager.getGroups());
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
            isActive = { activeGroupId == group.id }
            isFilter = { group.filter }
            onContextMenu = { this.handleGroupContextMenuOpen }
            onDragEnd = { this.groupDragEnd }
            onDragStart = { this.groupDragStart }
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

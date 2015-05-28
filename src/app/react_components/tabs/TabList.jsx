/** @jsx React.DOM */
'use strict';

var Constants = require('../util/Constants.js');
var ContextMenu = require('../menus/ContextMenu.jsx');
var GroupContextMenu = require('../menus/GroupContextMenu.js');
var GroupLogic = require('../groups/Group.js');
var Strings = require('../util/Strings.js');
var Tab = require('./Tab.jsx');
var TabContextMenu = require('../menus/TabContextMenu.js');
var TabGroup = require('../groups/TabGroup.jsx');
var TabLogic = require('./Tab.js');
var ThumbnailCache = require('./ThumbnailCache.js');

module.exports = React.createClass({  
  groupPlaceholder: document.createElement('div'),
  lastTabDragY: 0,
  pinOffset: 0,
  selectedTabs: [],
  tabPlaceholder: document.createElement('li'),
  createNewGroup: function (name, color) {
    GroupLogic.createNewGroup(this, name, color);
  },
  isSearchingTabs: function () {
    return this.state.searchTabsQuery.length > 0
  },
  searchTabs: function (query) {
    if (typeof query === 'string') {
      if (query != this.state.searchTabsQuery) {
        this.setState({ searchTabsQuery: query.toLowerCase() });
      }
    }
  },
  getInitialState: function () {
    return {
      activeGroup: GroupLogic.loadLastActiveGroup(),
      activeTab: 0,
      groups: [],
      searchTabsQuery: '',
      tabs: []
    };
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    
    if (this.props.viewState != nextProps.viewState)
      return true;
    if (this.props.multiColumn != nextProps.multiColumn)
      return true;
    if (this.props.showCloseButtons != nextProps.showCloseButtons)
      return true;
    if (this.props.showGroups != nextProps.showGroups)
      return true;
    if (this.props.showNewOnTabs != nextProps.showNewOnTabs)
      return true;
    if (this.state.activeGroup != nextState.activeGroup) {
      GroupLogic.saveLastActiveGroup(nextState.activeGroup);
      return true;
    }
    if (this.state.searchTabsQuery != nextState.searchTabsQuery)
      return true;

    return false;
  },
  componentWillMount: function () {
    var self = this;
    ThumbnailCache.init();
    TabLogic.init();
    
    TabLogic.getTabs(this, function(){
      TabLogic.setToCurrentTab(self);
      ThumbnailCache.scheduleCleanup(self);
      GroupLogic.loadGroups(self);
      TabLogic.setUpEventListeners(self);
      self.forceUpdate();
    });
    
  },
  componentDidUpdate: function (prevProps, prevState) {
    if (this.thereArePinnedNodes) {
      this.pinOffset = React.findDOMNode(this.refs.pinList).offsetHeight;
    }
  },
  handleGroupClicked: function (id, event) {
    GroupLogic.handleGroupClicked(this, id, event);
  },
  handleTabClicked: function (id, event) {
    TabLogic.handleTabClicked(this, id, event);
  },
  handleGroupClosed: function (id) {
    GroupLogic.handleGroupClosed(this, id);
  },
  handleTabClosed: function (id) {
    TabLogic.handleTabClosed(this, id);
  },
  handleEditTabGroup: function (id) {
    GroupLogic.handleEditTabGroup(this, id);
  },
  groupDragStart: function (e) {
    GroupLogic.groupDragStart(this, e);
  },
  groupDragOver: function (e) {
    GroupLogic.groupDragOver(this, e);
  },
  groupDragEnd: function (e) {
    GroupLogic.groupDragEnd(this, e);
  },
  tabDragStart: function (e) {
    TabLogic.tabDragStart(this, e);
  },
  tabDragOver: function (e) {
    TabLogic.tabDragOver(this, e);
  },
  tabDragEnd: function (e) {
    TabLogic.tabDragEnd(this, e);
  },
  handleTabContextMenuOpen: function (props, event) {
    this.refs.TabContextMenu.handleContextMenu(props, event);
  },
  handleTabContextMenuSelect: function (id, action) {
    switch (action) {
      case Constants.menus.contextMenu.tabActions.NEW_TAB:
        chrome.tabs.create({});
        break;
      case Constants.menus.contextMenu.tabActions.CLONE_TAB:
        chrome.tabs.duplicate(id);
        break;
      case Constants.menus.contextMenu.tabActions.PIN_TAB:
        chrome.tabs.update(id, { pinned: true });
        break;
      case Constants.menus.contextMenu.tabActions.UNPIN_TAB:
        chrome.tabs.update(id, { pinned: false });
        break;
      case Constants.menus.contextMenu.tabActions.RELOAD_TAB:
        chrome.tabs.reload(id);
        break;
      case Constants.menus.contextMenu.tabActions.CLOSE_TAB:
        chrome.tabs.remove(id);
        break;
      case Constants.menus.contextMenu.tabActions.CLOSE_OTHER_TABS:
        break;
    }
  },
  handleGroupContextMenuOpen: function (props, event) {
    this.refs.GroupContextMenu.handleContextMenu(props, event);
  },
  handleGroupContextMenuSelect: function (id, action) {
    var index = GroupLogic.getGroupIndex(this, id);
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
        if (id != GroupLogic.allGroupId) {
          var group = this.state.groups[index];
          var groups = [];
          groups.push(group);
          GroupLogic.setStateAndUpdate(this, groups);
        }
        break;
    }
  },

  render: function () {
    
    var tabPlaceholderClasses = classNames({
      'tab-placeholder': true,
      'multi-column': this.props.multiColumn,
      'thumbnail': this.props.viewState == Constants.viewStates.THUMBNAIL_VIEW,
      'small': this.props.viewState == Constants.viewStates.SMALL_VIEW
    });

    this.tabPlaceholder.className = tabPlaceholderClasses;
    this.groupPlaceholder.className = 'group-placeholder';

    var tabsToShow = TabLogic.getTabsToShow(this);

    var tabNodes = tabsToShow.map(function (tab, i) {
      if (!tab.pinned) {
        return (
          <Tab
            ref = { tab.id }
            id = { tab.id }
            index = { i }
            key = { tab.id }
            title = { tab.title || tab.url }

            onContextMenu = { this.handleTabContextMenuOpen }
            onDragEnd = { this.tabDragEnd }
            onDragStart = { this.tabDragStart }
            onTabClicked = { this.handleTabClicked }
            onTabClosed = { this.handleTabClosed }
            favicon = { tab.favicon }
            isLoading = { tab.status == 'loading' }
            multiColumn = { this.props.multiColumn }
            newlyCreated = { tab.newlyCreated }
            showClose = { this.props.showCloseButtons }
            showNewOnTabs = { this.props.showNewOnTabs }
            thumbnail = { tab.thumbnail }
            viewState = { this.props.viewState }
          />

        );
      }
    }, this);
    this.thereArePinnedNodes = false;
    var pinNodes = this.state.tabs.map(function (tab, i) {
      if (tab.pinned) {
        this.thereArePinnedNodes = true;

        return (
          <Tab
            ref = { tab.id }
            id = { tab.id }
            index = { i }
            key = { tab.id }
            title = { tab.title }

            onContextMenu = { this.handleTabContextMenuOpen }
            onDragEnd = { this.tabDragEnd }
            onDragStart = { this.tabDragStart }
            onTabClicked = { this.handleTabClicked }
            onTabClosed = { this.handleTabClosed }
            favicon = { tab.favicon }
            isLoading = { tab.status == 'loading' }
            isPinned = { true }
            showClose = { false }
            showNewOnTabs = { this.props.showNewOnTabs }
          />
        );
      }
    }, this);

    var groups = [];
    var groupNodes = [];
    if (this.props.showGroups) {
      groups.push({ 
        id: Constants.groups.ALL_GROUP_ID,
        title: Strings.groups.ALL_GROUP,
        color: Constants.groups.ALL_GROUP_COLOR
      });
      groups = groups.concat(this.state.groups)
      groupNodes = groups.map(function (group, i) {
        return (
          <TabGroup
            ref = { group.id }
            id = { group.id }
            index = { i }
            key = { group.id }
            title = { group.title }
            color = { group.color }
            isActive = { this.state.activeGroup == group.id }
            onContextMenu = { this.handleGroupContextMenuOpen }
            onDragEnd = { this.groupDragEnd }
            onDragStart = { this.groupDragStart }
            onGroupClicked = { this.handleGroupClicked }
            onGroupClosed = { this.handleGroupClosed }
          />
        );
      }, this);
    }
    var pinNodesClasses = classNames({
      'tab-pin-list': true,
      'hidden': !this.thereArePinnedNodes
    });

    var groupListClasses = classNames({
      'tab-group-list': true,
      'hidden': !this.props.showGroups
    });

    return (
      <div
        className = "tab-container">
        <div
          className = "tab-list-container">
          <ContextMenu
            ref = "TabContextMenu"
            items = { TabContextMenu }
            handleSelect = { this.handleTabContextMenuSelect }/>
          <ContextMenu
            ref = "GroupContextMenu"
            items = { GroupContextMenu }
            handleSelect = { this.handleGroupContextMenuSelect }/>
          <div
            className = { groupListClasses }
            onDragOver = { this.groupDragOver }>
            { groupNodes }
          </div>
          <div
            className = "tab-group-bar"/>
          <div
            className = "tab-list">
            <ul
              ref="pinList"
              className = { pinNodesClasses }>
              { pinNodes }
            </ul>
            <ul
              className = "unpinned-tabs"
              onDragOver = { this.tabDragOver }>
              { tabNodes }
            </ul>
          </div>
        </div>
      </div>
    );
  }
});

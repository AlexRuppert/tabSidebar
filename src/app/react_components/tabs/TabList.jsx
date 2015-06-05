/** @jsx React.DOM */
'use strict';

var Constants = require('../util/Constants.js');
var ContextMenu = require('../menus/ContextMenu.jsx');
var GroupLogic = require('../groups/Group.js');
var Strings = require('../util/Strings.js');
var Tab = require('./Tab.jsx');
var TabContextMenu = require('../menus/TabContextMenu.js');

var TabGroupList = require('../groups/TabGroupList.jsx');
var TabLogic = require('./Tab.js');
var ThumbnailCache = require('./ThumbnailCache.js');

module.exports = React.createClass({
 
  lastTabDragY: 0,
  pinOffset: 0,
  ready: false,
  selectedTabs: [],
  tabPlaceholder: document.createElement('li'),
  lastTabsToShowIds: [],
  activeGroupChanged: function(id){
    this.rerenderIfNeeded();
  },
  collapseTabs: function () {
    TabLogic.collapseTabs(this);
  },
  createNewGroup: function (name, color, filter) {
    this.refs[Constants.refs.TAB_GROUP_LIST].createNewGroup(name, color, filter);
  },
  expandTabs: function () {
    TabLogic.expandTabs(this);
  },
  isSearchingTabs: function () {
    return this.state.searchTabsQuery.length > 0
  },
  getGroupList: function() {
    return this.refs[Constants.refs.TAB_GROUP_LIST];
  },
  rerenderIfNeeded: function(){
    this.tabsToShow = TabLogic.getTabsToShow(this);
    //trees
    if (this.props.column == Constants.menus.menuBar.viewActions.TREE_VIEW) {
      this.tabsToShow  = TabLogic.createTabTree(this.tabsToShow);
    }
    var same = true;
    if (this.lastTabsToShowIds.length != this.tabsToShow.length){
      same = false;
    }
    else {
      for (var i = 0; i < this.lastTabsToShowIds.length; i++) {
        if(this.tabsToShow[i].id != this.lastTabsToShowIds[i]) {
          same = false;
          break;
        }
      }
    }

    if (!same){
      this.lastTabsToShowIds = [];
      for (var i = 0; i < this.tabsToShow.length; i++) {
        this.lastTabsToShowIds.push(this.tabsToShow[i].id);
      }
      this.forceUpdate();
    }
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
      
      isVisible: true,
      searchTabsQuery: ''
      
    };
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    if (this.state.isVisible != nextState.isVisible)
      return true;
    if (this.props.viewState != nextProps.viewState)
      return true;
    if (this.props.column != nextProps.column)
      return true;
    if (this.props.showCloseButtons != nextProps.showCloseButtons)
      return true;
    if (this.props.showGroups != nextProps.showGroups)
      return true;
    if (this.props.twoGroupColumns != nextProps.twoGroupColumns)
      return true;
    if (this.props.showNewOnTabs != nextProps.showNewOnTabs)
      return true;
    if (this.state.searchTabsQuery != nextState.searchTabsQuery)
      return true;

    return false;
  },
  componentDidMount: function () {
    var self = this;
    ThumbnailCache.init();
    TabLogic.init();
    GroupManager.addActiveGroupIdChangedListener(Constants.refs.TAB_LIST, this.activeGroupChanged);
    TabLogic.getTabs(this, function(forceUpdateTabs){
      TabLogic.setToCurrentTab(self);
     // ThumbnailCache.scheduleCleanup(self);
      GroupLogic.loadGroups();
      
      TabLogic.setUpEventListeners(self);
      self.ready = true;
      self.rerenderIfNeeded();
      for (var i = 0; i < forceUpdateTabs.length; i++) {
        if(self.refs[forceUpdateTabs[i].id]){
          self.refs[forceUpdateTabs[i].id].setState({
            title: forceUpdateTabs[i].title,
            favicon: forceUpdateTabs[i].favicon,
          });
        }
      }
    });

  },
  componentDidUpdate: function (prevProps, prevState) {
    if (this.thereArePinnedNodes) {
      this.pinOffset = React.findDOMNode(this.refs[Constants.refs.PIN_LIST]).offsetHeight;
    }
  },
  handleTabClicked: function (id, event) {
    TabLogic.handleTabClicked(this, id, event);
  },
  handleTabClosed: function (id) {
    TabLogic.handleTabClosed(id);
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
  handleEditTabGroup: function (group, callback){
    this.props.handleEditTabGroup(group, callback);
  },
  handleTabContextMenuOpen: function (props, event) {
    this.refs[Constants.refs.TAB_CONTEXT_MENU].handleContextMenu(props, event);
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


  

  handleTabCollapsed: function (id){
    TabLogic.handleTabCollapsed(this, id);
  },
  render: function () {
    
    if(!this.ready){
      return (
        <div>
        </div>
        );
      }
    
    console.log('TabList updated ' + Date.now());
    var tabPlaceholderClasses = classNames({
      'tab-placeholder': true,
      'multi-column': this.props.column == Constants.menus.menuBar.viewActions.DOUBLE_COLUMN,
      'thumbnail': this.props.viewState == Constants.viewStates.THUMBNAIL_VIEW,
      'small': this.props.viewState == Constants.viewStates.SMALL_VIEW
    });

    var backgroundInfo = Persistency.getState().background;
    var backgroundStyle = {};
    var tabOpacity = 100;
    if(backgroundInfo.show){
      tabOpacity = backgroundInfo.tabOpacity;
      backgroundStyle = {
        backgroundImage: 'url(' + (backgroundInfo.image) + ')',
        backgroundPositionX: backgroundInfo.offset + '%',
        WebkitFilter: 'blur(' + backgroundInfo.blur + 
          'px) opacity(' + backgroundInfo.opacity + 
          '%) grayscale(' + backgroundInfo.grayscale + '%)'
      };
    }
    this.tabPlaceholder.className = tabPlaceholderClasses;

   

  

    var tabNodes = this.tabsToShow.map(function (tab, i) {
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
            column = { this.props.column }
            favicon = { tab.favicon }
            isLoading = { tab.status == 'loading' }

            level = { tab.level }
            firstNode = { tab.firstNode }
            parentNode = { tab.parentNode }
            collapsed = { tab.collapsed }
            onTabCollapsed = { this.handleTabCollapsed }

            newlyCreated = { tab.newlyCreated }
            opacity = { tabOpacity }
            showClose = { this.props.showCloseButtons }
            showNewOnTabs = { this.props.showNewOnTabs }
            thumbnail = { tab.thumbnail }
            viewState = { this.props.viewState }

          />

        );
      }
    }, this);
    this.thereArePinnedNodes = false;
    
    var pinNodes = TabManager.getTabs().map(function (tab, i) {
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
            opacity = { tabOpacity }
            showClose = { false }
            showNewOnTabs = { this.props.showNewOnTabs }
          />
        );
      }
    }, this);

    var pinNodesClasses = classNames({
      'tab-pin-list': true,
      'hidden': !this.thereArePinnedNodes
    });
    var tabContainerClasses = classNames({
      'tab-container': true,
      'slim-bar': Persistency.getState().scrollBar == Constants.scrollBar.SLIM,
      'hidden-bar': Persistency.getState().scrollBar == Constants.scrollBar.HIDDEN,
      'hidden': !this.state.isVisible
    });
    
   
    return (
      <div
        className = { tabContainerClasses }>
        <div
          className = "tab-list-container">
          <div 
            className = { 'tab-list-background' } 
            style = { backgroundStyle }/>
          <ContextMenu
            ref = { Constants.refs.TAB_CONTEXT_MENU }
            items = { TabContextMenu }
            handleSelect = { this.handleTabContextMenuSelect }/>
          
          <TabGroupList
            ref = { Constants.refs.TAB_GROUP_LIST }
            isVisible = { this.props.showGroups }
            parent = {this}
            handleEditTabGroup = { this.handleEditTabGroup }
            twoColumns = {this.props.twoGroupColumns}/>
          <div
            className = "tab-list">
            <ul
              ref= { Constants.refs.PIN_LIST }
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

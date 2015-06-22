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
  backgroundStyle: {},
  selectedTabs: [],
  suppressTreeView: false,
  tabPlaceholder: document.createElement('li'),
  lastTabsToShow: [],
  activeGroupChanged: function(id) {
    this.rerenderIfNeeded(id);
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
  
  getGroupList: function() {
    return this.refs[Constants.refs.TAB_GROUP_LIST];
  },
  getTabsOfGroup: function (groupId, callback){
    TabLogic.getTabsToShow(groupId, callback);
  },
  rerenderIfNeeded: function(groupId, onlyFetchTabs, column){
    
    if(typeof groupId === 'undefined' || groupId == null) {
      groupId = GroupManager.getActiveGroupId();
    }
    this.suppressTreeView = false;
    var self = this;
    TabLogic.getTabsToShow(groupId, function (tabsToShow) {
      
      var noTree = false;
      //trees
      var activeGroup = GroupLogic.getActiveGroup();
   
      if (!(activeGroup && activeGroup.filter && !Persistency.getState().treeSettings.showTreesInFilters)) {
        if(typeof column !== 'undefined') {
          if (column == Constants.menus.menuBar.viewActions.TREE_VIEW) {
            tabsToShow  = TabLogic.createTabTree(tabsToShow);
          }
        }
        else {
          if (self.props.column == Constants.menus.menuBar.viewActions.TREE_VIEW) {
            tabsToShow  = TabLogic.createTabTree(tabsToShow);
          }
        }
      }
      else {
        self.suppressTreeView = true;
      }

      

      var same = true;
      var mismatchIndex = 0;
      if (self.lastTabsToShow.length != tabsToShow.length){
        same = false;
      }
      else {
        if (self.lastTabsToShow.length == 0) {
          same = false;
        }
        for (var i = 0; i < self.lastTabsToShow.length; i++) {
          if(tabsToShow[i].id != self.lastTabsToShow[i].id
            || tabsToShow[i].visible != self.lastTabsToShow[i].visible
            || tabsToShow[i].pinned != self.lastTabsToShow[i].pinned) {
            same = false;
            mismatchIndex = i;
            break;
          }
        }
      }
    
      self.tabsToShow = tabsToShow;
      if (!same){
        self.lastTabsToShow = self.lastTabsToShow.slice(0, mismatchIndex);
        for (var i = mismatchIndex; i < tabsToShow.length; i++) {
          self.lastTabsToShow.push({ id: tabsToShow[i].id, pinned: tabsToShow[i].pinned, visible: tabsToShow[i].visible });
        }
        if(!onlyFetchTabs) {
          self.forceUpdate();
        }
      }

    });
   
  },
  searchTabs: function (query) {
    if (typeof query === 'string') {
      TabLogic.searchTabs(this, query);
    }
  },
  sortTabs: function (sort) {
    TabLogic.sortTabs(this, sort);
  },
  getInitialState: function () {
    return {
      
      isVisible: true,
     
      
    };
  },
  shouldComponentUpdate: function (nextProps, nextState) {
   
    if (this.state.isVisible != nextState.isVisible){
      this.rerenderIfNeeded(null, true);
      return true;
    }
    if (this.props.viewState != nextProps.viewState){
      this.rerenderIfNeeded(null, true);
      return true;
    }
    if (this.props.column != nextProps.column) {
     
      this.rerenderIfNeeded(null, true, nextProps.column);
      return true;
    }
     
    if (this.props.showCloseButtons != nextProps.showCloseButtons)
      return true;
    if (this.props.showGroups != nextProps.showGroups)
      return true;
    if (this.props.twoGroupColumns != nextProps.twoGroupColumns)
      return true;
    if (this.props.showNewOnTabs != nextProps.showNewOnTabs)
      return true;
    

    return false;
  },
  componentDidMount: function () {
    
    var self = this;
    ThumbnailCache.init();
    TabLogic.init();
    /*chrome.windows.onFocusChanged.addListener(function (windowId) {
      
      if(windowId >= 0){
        
        self.rerenderIfNeeded();
      }
    });*/
    
    TabLogic.getTabs(this, function(forceUpdateTabs){
      TabLogic.setToCurrentTab(self);
     // ThumbnailCache.scheduleCleanup(self);
      GroupLogic.loadGroups();
      
      TabLogic.setUpEventListeners(self);
      self.ready = true;
      self.rerenderIfNeeded(null);
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
        TabLogic.closeOtherTabs(this, id)
        break;
      case Constants.menus.contextMenu.tabActions.REMOVE_TAB_FROM_GROUP:
        TabLogic.removeTabsFromGroup(this, id);
        break;
      case Constants.menus.contextMenu.tabActions.CLOSE_TABS_BELOW:
        TabLogic.closeTabsBelow(id);
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
    
    
    var tabPlaceholderClasses = classNames({
      'tab-placeholder': true,
      'multi-column': this.props.column == Constants.menus.menuBar.viewActions.DOUBLE_COLUMN,
      'thumbnail': this.props.viewState == Constants.viewStates.THUMBNAIL_VIEW,
      'small': this.props.viewState == Constants.viewStates.SMALL_VIEW
    });

    var backgroundInfo = Persistency.getState().background;
    
    var tabOpacity = 100;
    if(backgroundInfo.show) {
      tabOpacity = backgroundInfo.tabOpacity;
      var opacity =  backgroundInfo.opacity/100;     
      var imageValue ='url(' + (backgroundInfo.image) + ')';
      var positionValue = backgroundInfo.offset + '%';
      var filterValue = 'blur(' + backgroundInfo.blur +
        'px) grayscale(' + backgroundInfo.grayscale + '%)';



      this.backgroundStyle.backgroundImage = imageValue;
      this.backgroundStyle.opacity = opacity;
      this.backgroundStyle.backgroundPositionX = positionValue;
      if(backgroundInfo.useFilter) {
        this.backgroundStyle.WebkitFilter = filterValue;
      }
    }
    else {
      this.backgroundStyle.backgroundImage = '';
      this.backgroundStyle.backgroundPositionX = '';
      this.backgroundStyle.WebkitFilter = '';
    }
    

    this.tabPlaceholder.className = tabPlaceholderClasses;

   

  
    var activeTabId = TabManager.getActiveTabId();
    
    var column = this.suppressTreeView?Constants.menus.menuBar.viewActions.SINGLE_COLUMN:this.props.column;
    var tabNodes = this.tabsToShow.map(function (tab, i) {
      if (!tab.pinned && tab.visible) {
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
            column = { column }
            favicon = { tab.favicon }
            isLoading = { tab.status == 'loading' }
            isActive = { false}
            

            
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

            isActive = { tab.id == activeTabId }
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
      'animated': Persistency.getState().tabSettings.animated,
      'hidden': !this.state.isVisible
    });
    
   
    return (
      <div
        className = { tabContainerClasses }>
        <div
          className = "tab-list-container">
          <div 
            className = { 'tab-list-background' } 
            style = { this.backgroundStyle }/>
          <ContextMenu
            ref = { Constants.refs.TAB_CONTEXT_MENU }
            items = { TabContextMenu }
            handleSelect = { this.handleTabContextMenuSelect }/>
          
          <TabGroupList
            ref = { Constants.refs.TAB_GROUP_LIST }
            isVisible = { this.props.showGroups }
            parent = {this}
            handleNewTabGroup = { this.props.handleNewTabGroup }
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

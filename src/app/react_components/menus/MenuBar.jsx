/** @jsx React.DOM */
'use strict';

var Constants = require('../util/Constants.js');
var MenuBarMenu = require('./MenuBarMenu.jsx');
var Strings = require('../util/Strings.js');
var ViewMenu = require('./ViewMenu.js');

module.exports = React.createClass({
  getInitialState: function () {
    return {
      openedMenu: Constants.menus.menuBar.openStates.NONE,
      showingRecentTabs: false
    }
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    if (this.state.openedMenu != nextState.openedMenu)
      return true;
    if (this.state.showingRecentTabs != nextState.showingRecentTabs)
      return true;
    return false;
  },
  handleMenuOpen: function (menu) {
    this.setState({ openedMenu: menu });
  },
  handleMenuSelect: function (action) {
    this.setState({ openedMenu: Constants.menus.menuBar.openStates.NONE });
    
    switch (action) {
      case Constants.viewStates.NORMAL_VIEW:
      case Constants.viewStates.SMALL_VIEW:
      case Constants.viewStates.COMPACT_VIEW:
      case Constants.viewStates.THUMBNAIL_VIEW:
        this.props.handleViewChange(action);
        break;
      case Constants.menus.menuBar.viewActions.SINGLE_COLUMN:
      case Constants.menus.menuBar.viewActions.DOUBLE_COLUMN:
      case Constants.menus.menuBar.viewActions.TREE_VIEW:
        this.props.handleColumnChange(action);
        break;
      case Constants.menus.menuBar.viewActions.SINGLE_COLUMN_GROUP:
      case Constants.menus.menuBar.viewActions.DOUBLE_COLUMN_GROUP:
        this.props.handleGroupColumnChange(action);
        break;
      default:
        break;
    }
  },
  handleNewTab: function () {
    chrome.tabs.create({});
  },
  handleNewTabGroup: function () {
    this.props.handleNewTabGroup();
  },  
  handleShowRecentTabs: function () {
    if(this.state.showingRecentTabs) {
      this.props.showRecentTabs(false);
      this.setState({ showingRecentTabs: false });
    }
    else{
      this.props.showRecentTabs(true);
      this.setState({ showingRecentTabs: true });
    }
  },
  render: function () {
    var self = this;
    var tabGroupClasses = classNames({
      'hidden': !this.props.showGroups
    });
    var showRecentClasses = classNames({
      'fa fa-trash': !this.state.showingRecentTabs,
      'fa fa-navicon': this.state.showingRecentTabs
    });
    var showRecentButtonClasses = classNames({
      'selected': this.state.showingRecentTabs
    });
     return (
       <div
         className = "menu-bar">
         <button
           title = { Strings.menuBar.NEW_TAB }
           onClick = { this.handleNewTab }>
           <i
             className = "fa fa-plus"/>
         </button>
         <button
           className = { tabGroupClasses }
           title = { Strings.menuBar.NEW_TAB_GROUP }
           onClick = { this.handleNewTabGroup }>
           <i
             className = "fa fa-plus-square"/>
         </button>
         <button
           title = { Strings.menuBar.VIEW_MENU }
           onClick = { function(){self.handleMenuOpen(Constants.menus.menuBar.openStates.VIEW)} }>
           <i
             className = "fa fa-paint-brush"/>
         </button>
         <MenuBarMenu
           items = { ViewMenu }
           handleSelect = { this.handleMenuSelect }
           notchOffset = { this.props.showGroups?60:45 }
           isVisible = { this.state.openedMenu == Constants.menus.menuBar.openStates.VIEW }/>
         <button
           className = { showRecentButtonClasses }
           title = { this.state.showingRecentTabs?Strings.menuBar.TABS:Strings.menuBar.CLOSED_TABS }
           onClick = { this.handleShowRecentTabs }>
           <i
           className = { showRecentClasses }/>
         </button>
       </div>
     );
  }
});

/** @jsx React.DOM */
'use strict';

var Constants = require('../util/Constants.js');
var MenuBarMenu = require('./MenuBarMenu.jsx');
var Strings = require('../util/Strings.js');
var ViewMenu = require('./ViewMenu.js');

module.exports = React.createClass({
  getInitialState: function () {
    return {
      openedMenu: Constants.menus.menuBar.openStates.NONE
    }
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    if (this.state.openedMenu != nextState.openedMenu)
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
        this.props.handleColumnChange(false);
        break;
      case Constants.menus.menuBar.viewActions.DOUBLE_COLUMN:
        this.props.handleColumnChange(true);
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
  handleOpenSettings: function () {
    chrome.tabs.create({ url: Constants.paths.OPTIONS });
  },
  render: function () {
    var self = this;
    var tabGroupClasses = classNames({
      'hidden': !this.props.showGroups
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
           notchOffset = { this.props.showGroups?47:35 }
           isVisible = { this.state.openedMenu == Constants.menus.menuBar.openStates.VIEW }/>
         <button
           title = { Strings.menuBar.CLOSED_TABS }>
           <i
             className = "fa fa-trash"/>
         </button>
         <button
           title = { Strings.menuBar.SETTINGS }
           onClick = { this.handleOpenSettings }>
           <i
             className = "fa fa-cog"/>
         </button>
       </div>
     );
  }
});

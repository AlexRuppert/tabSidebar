'use strict';
var Constants = require('../util/Constants.js');
var Strings = require('../util/Strings.js');

module.exports = [
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.tabContextMenu.NEW_TAB,
    icon: 'fa-plus',
    action: Constants.menus.contextMenu.tabActions.NEW_TAB
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.tabContextMenu.CLONE_TAB,
    icon: 'fa-copy',
    action: Constants.menus.contextMenu.tabActions.CLONE_TAB
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.tabContextMenu.PIN_TAB,
    icon: 'fa-thumb-tack',
    action: Constants.menus.contextMenu.tabActions.PIN_TAB,
    condition: function (props) {
      return !props.isPinned;
    }
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.tabContextMenu.UNPIN_TAB,
    icon: 'fa-thumb-tack',
    action: Constants.menus.contextMenu.tabActions.UNPIN_TAB,
    condition: function (props) {
      return props.isPinned;
    }
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.tabContextMenu.RELOAD_TAB,
    icon: 'fa-refresh',
    action: Constants.menus.contextMenu.tabActions.RELOAD_TAB
  },
  {
    type: Constants.menus.menuTypes.DIVIDER
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.tabContextMenu.REMOVE_TAB_FROM_GROUP,
    icon: 'fa-mail-reply',
    action: Constants.menus.contextMenu.tabActions.REMOVE_TAB_FROM_GROUP,
    condition: function (props) {
      return !props.isPinned && GroupManager.getActiveGroupId() != Constants.groups.ALL_GROUP_ID;
    }
  },
  {
    type: Constants.menus.menuTypes.DIVIDER,
    condition: function (props) {
      return !props.isPinned && GroupManager.getActiveGroupId() != Constants.groups.ALL_GROUP_ID;
    }
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.tabContextMenu.CLOSE_TAB,
    icon: 'fa-close',
    action: Constants.menus.contextMenu.tabActions.CLOSE_TAB,
    condition: function (props) {
      return !props.isPinned;
    }
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.tabContextMenu.CLOSE_TABS_BELOW,
    icon: 'fa-arrow-down',
    action: Constants.menus.contextMenu.tabActions.CLOSE_TABS_BELOW,
    condition: function (props) {
      return !props.isPinned;
    }
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.tabContextMenu.CLOSE_OTHER_TABS,
    icon: 'fa-times-circle',
    action: Constants.menus.contextMenu.tabActions.CLOSE_OTHER_TABS
  }
];
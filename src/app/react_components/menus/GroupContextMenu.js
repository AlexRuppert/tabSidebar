'use strict';
var Constants = require('../util/Constants.js');
var Strings = require('../util/Strings.js');

module.exports = [
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.groupContextMenu.NEW_GROUP,
    icon: 'fa-plus-square',
    action: Constants.menus.contextMenu.groupActions.NEW_GROUP
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.groupContextMenu.CLONE_GROUP,
    icon: 'fa-copy',
    action: Constants.menus.contextMenu.groupActions.CLONE_GROUP
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.groupContextMenu.CLONE_AS_NORMAL,
    icon: 'fa-camera',
    action: Constants.menus.contextMenu.groupActions.CLONE_AS_NORMAL
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.groupContextMenu.EDIT_GROUP,
    icon: 'fa-edit',
    action: Constants.menus.contextMenu.groupActions.EDIT_GROUP,
    condition: function (props) {
      return props.id != Constants.groups.ALL_GROUP_ID;
    }
  },
  {
    type: Constants.menus.menuTypes.DIVIDER
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.groupContextMenu.CLOSE_TABS,
    icon: 'fa-close',
    action: Constants.menus.contextMenu.groupActions.CLOSE_TABS
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.groupContextMenu.CLOSE_GROUP,
    icon: 'fa-close',
    action: Constants.menus.contextMenu.groupActions.CLOSE_GROUP,
    condition: function (props) {
      return props.id != Constants.groups.ALL_GROUP_ID;
    }
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.groupContextMenu.CLOSE_OTHER_GROUPS,
    icon: 'fa-times-circle',
    action: Constants.menus.contextMenu.groupActions.CLOSE_OTHER_GROUPS
  }
];
'use strict';
var Constants = require('../util/Constants.js');
var Strings = require('../util/Strings.js');

module.exports = [
   {
     type: Constants.menus.menuTypes.ITEM,
     title: Strings.viewMenu.NORMAL_VIEW,
     icon: 'fa-bars',
     action: Constants.viewStates.NORMAL_VIEW
   },
    {
      type: Constants.menus.menuTypes.ITEM,
      title: Strings.viewMenu.SMALL_VIEW,
      icon: 'fa-minus',
      action: Constants.viewStates.SMALL_VIEW
    },
    {
      type: Constants.menus.menuTypes.ITEM,
      title: Strings.viewMenu.THUMBNAIL_VIEW,
      icon: 'fa-image',
      action: Constants.viewStates.THUMBNAIL_VIEW
    },
    {
      type: Constants.menus.menuTypes.ITEM,
      title: Strings.viewMenu.COMPACT_VIEW,
      icon: 'fa-tasks',
      action: Constants.viewStates.COMPACT_VIEW
    },
    {
      type: Constants.menus.menuTypes.DIVIDER,
    },
    {
      type: Constants.menus.menuTypes.ITEM,
      title: Strings.viewMenu.SINGLE_COLUMN,
      icon: 'fa-align-justify',
      action: Constants.menus.menuBar.viewActions.SINGLE_COLUMN
    },
    {
      type: Constants.menus.menuTypes.ITEM,
      title: Strings.viewMenu.DOUBLE_COLUMN,
      icon: 'fa-columns',
      action: Constants.menus.menuBar.viewActions.DOUBLE_COLUMN
    }
];
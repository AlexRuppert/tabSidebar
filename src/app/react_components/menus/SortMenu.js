'use strict';
var Constants = require('../util/Constants.js');
var Strings = require('../util/Strings.js');

module.exports = [
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.sortMenu.TITLE_ASC,
    icon: 'fa-newspaper-o',
    action: Constants.sortModes.TITLE_ASC
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.sortMenu.URL_ASC,
    icon: 'fa-globe',
    action: Constants.sortModes.URL_ASC
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.sortMenu.VISITED_ASC,
    icon: 'fa-hand-o-up',
    action: Constants.sortModes.VISITED_ASC
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.sortMenu.OPENED_ASC,
    icon: 'fa-clock-o',
    action: Constants.sortModes.OPENED_ASC
  },
  {
    type: Constants.menus.menuTypes.DIVIDER,
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.sortMenu.TITLE_DESC,
    icon: 'fa-newspaper-o',
    action: Constants.sortModes.TITLE_DESC
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.sortMenu.URL_DESC,
    icon: 'fa-globe',
    action: Constants.sortModes.URL_DESC
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.sortMenu.VISITED_DESC,
    icon: 'fa-hand-o-up',
    action: Constants.sortModes.VISITED_DESC
  },
  {
    type: Constants.menus.menuTypes.ITEM,
    title: Strings.sortMenu.OPENED_DESC,
    icon: 'fa-clock-o',
    action: Constants.sortModes.OPENED_DESC
  }
];
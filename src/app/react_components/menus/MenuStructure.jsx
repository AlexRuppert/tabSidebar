/** @jsx React.DOM */
'use strict';

var Constants = require('../util/Constants.js');
var Menu = require('rc-menu');
var MenuItem = Menu.Item;
var SubMenu = Menu.SubMenu;

module.exports = {
  getMenuStructure: function (items) {
    return items.map(function(item, i) {
      if(!item.hasOwnProperty('condition') || item.condition(this.state.targetProps)){
        switch(item.type){
          case Constants.menus.menuTypes.ITEM:
            return (
              <MenuItem
                key = { item.action }
                title = { item.title }>
                
                <i
                  className = { 'fa ' + item.icon }/>
                { item.title }
              </MenuItem>
            );
            break;
          case Constants.menus.menuTypes.SUBMENU:
            return (
              <SubMenu
                key = { i }
                title = { item.title }>
                { this.getMenuStructure(item.items) }
              </SubMenu>
            );
            break;
          default:
            return (
              <MenuItem
                key = { i }
                disabled
                className = { 'rc-menu-item-divider' } />
            );
        }
      }
      else {
        return (
          <div key = { i } />
        )
      }
    }, this);
  }
}

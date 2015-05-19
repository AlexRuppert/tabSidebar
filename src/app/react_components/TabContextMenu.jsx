/** @jsx React.DOM */
"use strict";

module.exports = [
  {
    type: 'item',
    title: 'New tab',
    icon: 'fa-plus',
    action: 'newtab'
  },
  {
    type: 'item',
    title: 'Clone tab',
    icon: 'fa-copy',
    action: 'clonetab'
  },
  {
    type: 'item',
    title: 'Pin tab',
    icon: 'fa-thumb-tack',
    action: 'pintab',
    condition: function(props){
      return !props.isPinned;      
    }
  },
  {
    type: 'item',
    title: 'Unpin tab',
    icon: 'fa-thumb-tack',
    action: 'unpintab',
    condition: function(props){
      return props.isPinned;
    }
  },
  {
    type: 'item',
    title: 'Reload tab',
    icon: 'fa-refresh',
    action: 'reloadtab'
  },
  {
    type: 'divider'
  },
  {
    type: 'item',
    title: 'Close tab',
    icon: 'fa-close',
    action: 'closetab'
  },
  {
    type: 'item',
    title: 'Close other tabs',
    icon: 'fa-times-circle',
    action: 'closeothertabs'
  }
];

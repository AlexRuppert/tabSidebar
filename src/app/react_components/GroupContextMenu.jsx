/** @jsx React.DOM */
"use strict";

module.exports = [
  {
    type: 'item',
    title: 'New Group',
    icon: 'fa-plus',
    action: 'newgroup'
  },
  {
    type: 'item',
    title: 'Clone Group',
    icon: 'fa-copy',
    action: 'clonegroup'
  },
  {
    type: 'item',
    title: 'Edit group',
    icon: 'fa-refresh',
    action: 'editgroup'
  },
  {
    type: 'divider'
  },
  {
    type: 'item',
    title: 'Close group',
    icon: 'fa-close',
    action: 'closegroup'
  },
  {
    type: 'item',
    title: 'Close other groups',
    icon: 'fa-times-circle',
    action: 'closeothergroups'
  }
];

/** @jsx React.DOM */
"use strict";

var Constants = require('../util/Constants.js');
var Menu = require('rc-menu');
var MenuStructure = require('./MenuStructure.jsx');
var MenuItem = Menu.Item;
var SubMenu = Menu.SubMenu;
module.exports = React.createClass({
  mixins: [MenuStructure],
  closeMenu: function () {
    if (this.state.isVisible) {
      this.setState({ isVisible: false });
    }
  },
  getInitialState: function () {
    return {
      isVisible: false,
      posX: 0,
      posY: 0,
      targetProps: {}
    };
  },
  componentDidMount: function () {
    var self = this;
    opr.sidebarAction.onBlur.addListener(function () {
      self.closeMenu();
    });
  },
  componentWillReceiveProps: function (nextProps) {
    this.setState({ isVisible: nextProps.isVisible });
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    return (this.state.isVisible != nextState.isVisible);
  },
  handleContextMenu: function (props, event) {
    var newX = event.nativeEvent.clientX;
    var newY = event.nativeEvent.clientY;
    var contextMenuWidth = this.props.items.length * Constants.menus.contextMenu.ITEM_HEIGHT;
    var contextMenuHeight = Constants.menus.contextMenu.MENU_WIDTH;
    var maxWidth = document.body.clientWidth;
    var maxHeight = document.body.clientHeight;

    if (newX + contextMenuWidth > maxWidth) {
      newX = Math.max(0, maxWidth - contextMenuWidth);
    }

    if (newY + contextMenuHeight > maxHeight) {
      newY = Math.max(0, maxHeight - contextMenuHeight);
    }
    this.setState({
      isVisible: true,
      posX: newX,
      posY: newY,
      targetProps: props
    });
  },
  handleContextMenuClose: function (event) {
    event.nativeEvent.preventDefault();
    this.closeMenu();
  },
  handleSelect: function (action) {
    this.props.handleSelect(this.state.targetProps.id, action);
  },
  render: function () {
    var classes = classNames({
      'close-area': true,
      'hidden': !this.state.isVisible
    });
    return (
      <div
        className = { classes }
        onClick = { this.handleContextMenuClose }
        onContextMenu = { this.handleContextMenuClose }>
        <div
          style = { {top: this.state.posY + 'px', left: this.state.posX + 'px',
            zIndex: 9001, position: 'fixed'} }>
          <Menu
            onSelect = {this.handleSelect}>
            { this.getMenuStructure(this.props.items) }
          </Menu>
        </div>
      </div>
    );
  }
});

/** @jsx React.DOM */
"use strict";
var Constants = require('../util/Constants.js');
var Menu = require('rc-menu');
var MenuStructure = require('./MenuStructure.jsx');

module.exports = React.createClass({
  mixins: [MenuStructure],
  closeMenu: function () {
    if (this.state.isVisible) {
      this.setState({ isVisible: false });
    }
    this.props.handleSelect(Constants.menus.menuBar.openStates.NONE);
  },
  getInitialState: function () {
    return {
      isVisible: false
    }
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    return (this.state.isVisible != nextState.isVisible);
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
  handleMenuClose: function (event) {
    event.nativeEvent.preventDefault();
    this.closeMenu();
  },
  handleSelect: function (action) {    
    this.setState({ isVisible: false });
    this.props.handleSelect(action);
  },
  render: function () {
    var classes = classNames({
      'hidden': !this.state.isVisible
    });
    return (
      <div
        className = { classes }>
        <div
          className = "close-area"
          onClick = { this.handleMenuClose }
          onContextMenu = { this.handleMenuClose }>
        </div>
        <div
          className = "menu-bar-menu">
          <div
            className = "notch border-notch"
            style = { {left: this.props.notchOffset + '%'} }/>
          <div
            className = "notch"
            style = { {left: this.props.notchOffset + '%'} }/>
          <Menu
            onSelect = { this.handleSelect }>
            { this.getMenuStructure(this.props.items) }
          </Menu>
        </div>
      </div>
    );
  }
});

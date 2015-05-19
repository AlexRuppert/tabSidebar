/** @jsx React.DOM */
"use strict";

var Menu = require('rc-menu');
var SubMenu = Menu.SubMenu;
var MenuItem = Menu.Item;

module.exports = React.createClass({
  shouldComponentUpdate: function(nextProps, nextState) {
    return (this.state.isVisible!=nextState.isVisible);
  },
  getInitialState: function() {
    return {
      isVisible:false
    }
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({isVisible: nextProps.isVisible});
  },
	getMenuStructure: function(items){
    return items.map(function(item, i) {
      switch(item.type){
        case 'item':
          return (
            <MenuItem key={item.action}><i className={'fa '+item.icon}/>{item.title}</MenuItem>
          );
          break;
        case 'submenu':
          return (
            <SubMenu title={item.title}>{this.getMenuStructure(item.items)}</SubMenu>
          );
          break;
        default:
          return (
            <MenuItem key={i} disabled className={'rc-menu-item-divider'} />
          );
      }

    }, this);
  },
  handleSelect: function(action){
    this.setState({isVisible: false});
    this.props.handleSelect(action);

  },
  handleMenuClose: function (event) {
    event.nativeEvent.preventDefault();
    if(this.state.isVisible){
      this.setState({isVisible:false});
    }
    this.props.handleSelect('none');
  },
  render: function () {
    var classes = classNames({
      'hidden': !this.state.isVisible
    });
    return (
      <div className={classes}>
        <div className="close-area" onClick={this.handleMenuClose} onContextMenu={this.handleMenuClose}>
        </div>
        <div className="menu-bar-menu">
          <div className="notch border-notch" style={{left:this.props.notchOffset+'%'}}/>
          <div className="notch" style={{left:this.props.notchOffset+'%'}}/>
          <Menu onSelect={this.handleSelect}>
            {this.getMenuStructure(this.props.items)}
          </Menu>
        </div>
      </div>
    );
  }
});

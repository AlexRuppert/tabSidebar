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
      isVisible:false,
      posX: 0,
      posY: 0,
      targetProps: {}
    };
  },
  closeMenu:function(){
    if(this.state.isVisible){
      this.setState({isVisible:false});
    }
  },
  componentDidMount:function(){
    var self=this;
    opr.sidebarAction.onBlur.addListener(function () {      
      self.closeMenu();
    });
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({isVisible: nextProps.isVisible});
  },
  handleContextMenuClose: function (event) {
    event.nativeEvent.preventDefault();
    this.closeMenu();
  },
  handleContextMenu: function(props, event){

    var newX = event.nativeEvent.clientX;
    var newY = event.nativeEvent.clientY;
    var contextMenuWidth = this.props.items.length*25;
    var contextMenuHeight = 150;
    var maxWidth = document.body.clientWidth;
    var maxHeight = document.body.clientHeight;

    if (newX + contextMenuWidth > maxWidth) {
      newX = Math.max(0, maxWidth - contextMenuWidth);
    }

    if (newY + contextMenuHeight > maxHeight) {
      newY = Math.max(0, maxHeight - contextMenuHeight);
    }
    this.setState({
      isVisible:true,
      posX: newX,
      posY: newY,
      targetProps: props
    });
  },
  getMenuStructure: function(items){

    return items.map(function(item, i) {
      if(!item.hasOwnProperty('condition') || item.condition(this.state.targetProps)){
        switch(item.type){
          case 'item':
            return (
              <MenuItem key={item.action}><i className={'fa '+item.icon}/>{item.title}</MenuItem>
            );
            break;
          case 'submenu':
            return (
              <SubMenu key={i} title={item.title}>{this.getMenuStructure(item.items)}</SubMenu>
            );
            break;
          default:
            return (
              <MenuItem key={i} disabled className={'rc-menu-item-divider'} />
            );
        }
      }
      else {
        return (
          <div key={i} />
        )
      }

    }, this);
  },
  handleSelect: function(action){
    this.props.handleSelect(this.state.targetProps.id,action);
  },
  render: function () {
    var classes = classNames({
      'close-area': true,
      'hidden': !this.state.isVisible
    });
    return (
      <div
        className={classes}
        onClick={this.handleContextMenuClose}
        onContextMenu={this.handleContextMenuClose} >
        <div style={{top: this.state.posY + 'px', left: this.state.posX + 'px', zIndex: 9001, position: 'fixed'}}>
          <Menu onSelect={this.handleSelect}>
            {this.getMenuStructure(this.props.items)}
          </Menu>
        </div>
      </div>
    );
  }
});

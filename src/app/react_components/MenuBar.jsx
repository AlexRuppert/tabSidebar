/** @jsx React.DOM */
"use strict";

var MenuBarMenu = require('./MenuBarMenu.jsx');

module.exports = React.createClass({

  viewMenu:[
    {
      type: 'item',
      title: 'Normal view',
      icon: 'fa-bars',
      action: 'normalview'
    },
    {
      type: 'item',
      title: 'Small tabs',
      icon: 'fa-minus',
      action: 'smalltabs'
    },
    {
      type: 'item',
      title: 'Thmubnail view',
      icon: 'fa-image',
      action: 'thumbnailview'
    },
    {
      type: 'item',
      title: 'Compact view',
      icon: 'fa-tasks',
      action: 'compactview'
    },
    {
      type: 'separator'
    },
    {
      type: 'item',
      title: 'Single column tabs',
      icon: 'fa-align-justify',
      action: 'singlecolumntabs'
    },
    {
      type: 'item',
      title: 'Double column tabs',
      icon: 'fa-columns',
      action: 'multicolumntabs'
    }

  ],

  shouldComponentUpdate: function(nextProps, nextState) {
    if (this.state.openedMenu!=nextState.openedMenu)
      return true;
    if (this.props.showGroups!=nextProps.showGroups)
      return true;

    return false;
  },
  getInitialState: function() {
    return {
      openedMenu:'none'
    }
  },
  handleMenuSelect: function(action){
    this.setState({openedMenu:'none'});
    switch(action){
      case 'normalview':
      case 'thumbnailview':
      case 'compactview':
      case 'smalltabs':
        this.props.handleViewChange(action);
        break;
      case 'singlecolumntabs':
        this.props.handleColumnChange(false);
        break;
      case 'multicolumntabs':
        this.props.handleColumnChange(true);
        break;

      default:
        break;
    }
  },
  handleMenuOpen: function(menu){
    this.setState({openedMenu:menu});
  },
  handleNewTabGroup: function (){
    this.props.handleNewTabGroup();
  },
  handleNewTab: function (){
    chrome.tabs.create({});
  },
  handleOpenSettings: function (){
    chrome.tabs.create({ url: 'app/options.html' });
  },
  render: function () {
    var self=this;
    var tabGroupClasses = classNames({
      'hidden': !this.props.showGroups
    });
    return (
      <div className="menu-bar">
        <button title="New tab"
          onClick={this.handleNewTab}>
          <i className="fa fa-plus"/>
        </button>
        <button className={tabGroupClasses}
          title="New tab group"
          onClick={this.handleNewTabGroup}>
          <i className='fa fa-plus-square'/>
        </button>
        <button title="View"
          onClick={function(){self.handleMenuOpen('view')}}>
          <i className="fa fa-paint-brush"/>
        </button>
        <MenuBarMenu items={this.viewMenu}
          handleSelect={this.handleMenuSelect}
          notchOffset={this.props.showGroups?47:35}
          isVisible={this.state.openedMenu=='view'}/>
        <button title="Closed tabs">
          <i className="fa fa-trash"/>
        </button>
        <button title="Settings"
          onClick={this.handleOpenSettings}>
          <i className="fa fa-cog"/>
        </button>
      </div>
    );
  }
});

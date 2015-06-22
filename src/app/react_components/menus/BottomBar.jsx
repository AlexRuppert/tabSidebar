/** @jsx React.DOM */
'use strict'

var Constants = require('../util/Constants.js');
var Strings = require('../util/Strings.js');
module.exports = React.createClass({
  handleCollapseTabs: function () {
    this.props.handleCollapseTabs();
  },  
  handleExpandTabs: function () {
    this.props.handleExpandTabs();
  },  
  handleOpenSettings: function () {
    chrome.tabs.create({ url: Constants.paths.OPTIONS });
  },
  handlePanic: function () {
    var background = chrome.extension.getBackgroundPage();
    
    for (var property in Constants.globalProperties) {
      if (background.hasOwnProperty(Constants.globalProperties[property])) {
        delete background[Constants.globalProperties[property]];
      }
    }
    window.location.reload();
  },
  handleScrollToTop: function () {
    this.props.handleScrollToTop();
  },
  render: function () {
    var collapseContainerClasses = classNames({
      'collapsed-container': true,
      'hidden': this.props.column != Constants.menus.menuBar.viewActions.TREE_VIEW
    });
    return (
      <div className = { "bottom-bar" }>
        <button
          title = { Strings.bottomBar.PANIC }
          onClick = { this.handlePanic }>
          <i
            className = "fa fa-bug"/>
        </button>
        <button
          title = { Strings.bottomBar.SETTINGS }
          onClick = { this.handleOpenSettings }>
          <i
            className = "fa fa-cog"/>
        </button>
        <div className = { collapseContainerClasses }>
          <button
            title = { Strings.bottomBar.EXPAND_TABS }
            onClick = { this.handleExpandTabs }>
            <i
            className = "fa fa-plus-square-o"/>
            </button>
          <button
            title = { Strings.bottomBar.COLLAPSE_TABS }
            onClick = { this.handleCollapseTabs }>
            <i
            className = "fa fa-minus-square-o"/>
          </button>
        </div>
        <button 
          title = { Strings.bottomBar.GO_TO_TOP }
          className = "flexible"
          onMouseDown = { this.handleScrollToTop } >
          <i className = "fa fa-level-up"/>
          <span className = "hspacer02"/>
          { Strings.bottomBar.GO_TO_TOP }
          </button>
      </div>
    );
}
});

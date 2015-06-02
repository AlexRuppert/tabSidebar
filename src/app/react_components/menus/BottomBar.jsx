/** @jsx React.DOM */
'use strict'

var Constants = require('../util/Constants.js');
var Strings = require('../util/Strings.js');

module.exports = React.createClass({
  handleOpenSettings: function () {
    chrome.tabs.create({ url: Constants.paths.OPTIONS });
  },
  handleScrollToTop: function () {
    this.props.handleScrollToTop();
  },  
  render: function () {
    return (
      <div className = { "bottom-bar" }>
        <button
          title = { Strings.bottomBar.SETTINGS }
          onClick = { this.handleOpenSettings }>
          <i
            className = "fa fa-cog"/>
        </button>
        <button
          title = { Strings.bottomBar.EXPAND_TABS }
          onClick = { this.handleOpenSettings }>
          <i
          className = "fa fa-plus-square-o"/>
          </button>
        <button
          title = { Strings.bottomBar.COLLAPSE_TABS }
          onClick = { this.handleOpenSettings }>
          <i
          className = "fa fa-minus-square-o"/>
        </button>
        <button 
          className = "flexible"
          onMouseDown = { this.handleScrollToTop } >
          <i className = "fa fa-level-up"/>
          <span className = "hspacer02"/>
          { Strings.tabList.GO_TO_TOP }
          </button>
      </div>
    );
}
});

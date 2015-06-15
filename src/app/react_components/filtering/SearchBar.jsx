/** @jsx React.DOM */
'use strict';
var Constants = require('../util/Constants.js');
var Strings = require('../util/Strings.js');
module.exports = React.createClass({
  search: function(){
    var query = React.findDOMNode(this.refs.searchBox).value.trim();
    this.props.onSearch(query);
  },
  getInitialState: function() {
    return {value:''};
  },
  handleClearSearch: function(e){
    React.findDOMNode(this.refs.searchBox).value='';
    this.props.onSearch('');
  },
  handleKeyUp:function(e){
    this.search();
  },
  render: function () {
    return (
      <div
        className = "search-bar">
        <input
          placeholder = { Strings.searchBar.INPUT_PLACEHOLDER }
          ref =  { Constants.refs.SEARCH_BOX }
          type = "text"
          onKeyUp = { this.handleKeyUp }/>
        <button
          className = "clear-margin-right"
          title = { Strings.searchBar.CLEAR_BUTTON_TITLE }
          onClick = { this.handleClearSearch }>
          <i
            className = "fa fa-times-circle"/>
        </button>
      </div>
    );
  }
});

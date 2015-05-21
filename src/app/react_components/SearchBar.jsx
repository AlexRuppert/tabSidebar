/** @jsx React.DOM */
"use strict";

module.exports = React.createClass({
  getInitialState: function() {
    return {value:''};
  },

  search: function(){
    var query = React.findDOMNode(this.refs.searchBox).value.trim();
    this.props.onSearch(query);
  },
  handleKeyUp:function(e){
    this.search();
  },
  handleClearSearch: function(e){
    React.findDOMNode(this.refs.searchBox).value='';
    this.props.onSearch('');
  },
  render: function () {

    return (
      <div className="search-bar">
        <input placeholder="Search tabs..." ref="searchBox" type="text" onKeyUp={this.handleKeyUp}/>
        <button className="clear-margin-right" title="Clear search" onClick={this.handleClearSearch}><i className="fa fa-times-circle"></i></button>
      </div>

    );
  }
});

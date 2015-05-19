/** @jsx React.DOM */
"use strict";

module.exports = React.createClass({ 
  getInitialState: function() {
    return {value:''};
  }, 
  
  search: function(){
    var query = React.findDOMNode(this.refs.searchBox).value.trim();
    
    console.log(query);
  },
  handleKeyDown:function(e){
    this.search();
  },
  render: function () {     
    
    return (
      <div className="search-bar">
        <input placeholder="Search tabs..." ref="searchBox" type="text" onKeyDown={this.handleKeyDown}/>
        
      </div>
        
    );
  }
});
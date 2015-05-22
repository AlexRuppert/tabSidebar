/** @jsx React.DOM */
"use strict";

var TabList = require('./TabList.jsx');
var SearchBar = require('./SearchBar.jsx');
var MenuBar = require('./MenuBar.jsx');
var GroupCreator = require('./GroupCreator.jsx');
var Persistency = require('../logic/Persistency.js');
Persistency.init();
module.exports = React.createClass({

  getInitialState: function(){

    return {
      viewState:'normalview',
      multiColumn: false,
      showCloseButtons: true,
      showGroups: true,
      showNewOnTabs: true
    };
  },
  componentDidMount : function(){
    var self=this;
    Persistency.loadState(function(){
      var state=Persistency.getState();
        self.setState({
          viewState:state.viewState,
          multiColumn: state.multiColumn,
          showCloseButtons: state.showCloseButtons,
          showGroups: state.showGroups,
          showNewOnTabs: state.showNewOnTabs
          });
          self.refs["tabList"].loadGroups();
          self.refs["tabList"].forceUpdate();
    });

  },
  handleViewChange: function(view){
    Persistency.updateState({viewState:view});
    this.setState({viewState:view});
  },
  handleColumnChange: function(multi){
    Persistency.updateState({multiColumn:multi});
    this.setState({multiColumn:multi});
  },
  handleNewTabGroup: function(){
    this.refs.groupCreator.showDialog();
  },
  handleNewTabGroupCreated: function(name, color){
    this.refs.tabList.createNewGroup(name,color);
  },
  handleSearch:function(query) {
    this.refs['tabList'].searchTabs(query);
  },
  render: function (){
    return (
      <div>
        <MenuBar
          handleViewChange={this.handleViewChange}
          handleColumnChange={this.handleColumnChange}
          handleNewTabGroup={this.handleNewTabGroup}
          showGroups={this.state.showGroups}/>
        <SearchBar onSearch={this.handleSearch}/>
        <GroupCreator
          ref="groupCreator"
          handleCreate={this.handleNewTabGroupCreated}/>
          <TabList
          ref="tabList"
          viewState={this.state.viewState}
          multiColumn={this.state.multiColumn}
          showCloseButtons={this.state.showCloseButtons}
          showGroups={this.state.showGroups}
          showNewOnTabs={this.state.showNewOnTabs}/>
      </div>
    );
  }
});

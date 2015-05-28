/** @jsx React.DOM */
'use strict';

var BottomBar = require('../menus/BottomBar.jsx');
var Constants = require('../util/Constants.js');
var GroupCreator = require('../groups/GroupCreator.jsx');
var Helpers = require('../util/Helpers.js');
var MenuBar = require('../menus/MenuBar.jsx');
var Persistency = {};
var SearchBar = require('../filtering/SearchBar.jsx');
var TabList = require('../tabs/TabList.jsx');

module.exports = React.createClass({
  getInitialState: function () {
    var persistency = Constants.globalProperties.PERSISTENCY;
    Persistency = chrome.extension.getBackgroundPage()[persistency];
    return {
      viewState: Constants.viewStates.NORMAL_VIEW,
      multiColumn: false,
      showCloseButtons: true,
      showGroups: true,
      showNewOnTabs: true
    };
  },
  componentWillMount: function () {
    var self = this;
    var state = Persistency.getState();
    self.setState({
      viewState: state.viewState,
      multiColumn: state.multiColumn,
      showCloseButtons: state.showCloseButtons,
      showGroups: state.showGroups,
      showNewOnTabs: state.showNewOnTabs
    });
    //self.refs[Constants.refs.TAB_LIST].loadGroups();
  },
  handleColumnChange: function (multi) {
    Persistency.updateState({ multiColumn: multi });
    this.setState({ multiColumn: multi });
  },
  handleEditTabGroup: function (group, callback) {
    this.refs[Constants.refs.GROUP_CREATOR].showDialog(group, callback);
  },
  handleNewTabGroup: function () {
    this.refs[Constants.refs.GROUP_CREATOR].showDialog();
  },
  handleNewTabGroupCreated: function (name, color) {
    this.refs[Constants.refs.TAB_LIST].createNewGroup(name, color);
  },
  handleScrollToTop: function () {
    Helpers.scrollTo(React.findDOMNode(this.refs[Constants.refs.TAB_LIST]), 0, 200);
    
  },
  handleSearch: function (query) {
    this.refs[Constants.refs.TAB_LIST].searchTabs(query);
  },
  handleViewChange: function (view) {
    Persistency.updateState({ viewState: view });
    this.setState({ viewState: view });    
  },
  render: function () {
    
    return (
      <div>
        <MenuBar
          handleColumnChange = { this.handleColumnChange }
          handleNewTabGroup = { this.handleNewTabGroup }
          handleViewChange = { this.handleViewChange }
          showGroups = { this.state.showGroups }/>
        <SearchBar 
          onSearch = { this.handleSearch }/>
        <GroupCreator
          ref = { Constants.refs.GROUP_CREATOR }
          handleCreate = { this.handleNewTabGroupCreated }/>
        <TabList
          ref = { Constants.refs.TAB_LIST }
          handleEditTabGroup = { this.handleEditTabGroup }
          handleNewTabGroup = { this.handleNewTabGroup }
          multiColumn = { this.state.multiColumn }
          showCloseButtons = { this.state.showCloseButtons }
          showGroups = { this.state.showGroups }
          showNewOnTabs = { this.state.showNewOnTabs }
          viewState = { this.state.viewState }/>
        <BottomBar 
          handleScrollToTop = { this.handleScrollToTop }
          />
      </div>
    );
  }
});

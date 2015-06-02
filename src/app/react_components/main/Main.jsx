/** @jsx React.DOM */
'use strict';

var BottomBar = require('../menus/BottomBar.jsx');
var Constants = require('../util/Constants.js');
var GroupCreator = require('../groups/GroupCreator.jsx');
var Helpers = require('../util/Helpers.js');
var MenuBar = require('../menus/MenuBar.jsx');

var RecentList = require('../recent/RecentList.jsx');
var SearchBar = require('../filtering/SearchBar.jsx');
var TabList = require('../tabs/TabList.jsx');

module.exports = React.createClass({
  getInitialState: function () {
   
    if (GroupManager.getActiveGroupId() == 0){
      GroupManager.setActiveGroupId(Constants.groups.ALL_GROUP_ID);
    }
    return {
      viewState: Constants.viewStates.NORMAL_VIEW,
      column: Constants.menus.menuBar.viewActions.SINGLE_COLUMN,
      showCloseButtons: true,
      showGroups: true,
      showNewOnTabs: true,
      twoGroupColumns: false
    };
  },
  componentWillMount: function () {
    var self = this;
    var state = Persistency.getState();
    self.setState({
      viewState: state.viewState,
      column: state.column,
      showCloseButtons: state.showCloseButtons,
      showGroups: state.showGroups,
      showNewOnTabs: state.showNewOnTabs,
      twoGroupColumns: state.twoGroupColumns
    });
    //self.refs[Constants.refs.TAB_LIST].loadGroups();
  },
  handleColumnChange: function (column) {
    Persistency.updateState({ column: column });
    this.setState({ column: column });
  },
  handleEditTabGroup: function (group, callback) {
    this.refs[Constants.refs.GROUP_CREATOR].showDialog(group, callback);
  },
  handleNewTabGroup: function () {
    this.refs[Constants.refs.GROUP_CREATOR].showDialog();
  },
  handleNewTabGroupCreated: function (name, color, filter) {
    this.refs[Constants.refs.TAB_LIST].createNewGroup(name, color, filter);
  },
  handleScrollToTop: function () {
    if(this.refs[Constants.refs.TAB_LIST].state.isVisible) {
      Helpers.scrollTo(React.findDOMNode(this.refs[Constants.refs.TAB_LIST]), 0, 200);
    }
    if(this.refs[Constants.refs.RECENT_LIST].state.isVisible) {
      Helpers.scrollTo(React.findDOMNode(this.refs[Constants.refs.RECENT_LIST]), 0, 200);
    }
  },
  handleSearch: function (query) {
    this.refs[Constants.refs.TAB_LIST].searchTabs(query);
  },
  handleViewChange: function (view) {
    Persistency.updateState({ viewState: view });
    this.setState({ viewState: view });
  },
  showRecentTabs: function (showing) {
    this.refs[Constants.refs.TAB_LIST].setState({isVisible: !showing});
    this.refs[Constants.refs.RECENT_LIST].setState({isVisible: showing});
  },
  render: function () {
    
    return (
      <div>
        <MenuBar
          handleColumnChange = { this.handleColumnChange }
          handleNewTabGroup = { this.handleNewTabGroup }
          handleViewChange = { this.handleViewChange }
          showGroups = { this.state.showGroups }
          showRecentTabs = { this.showRecentTabs }/>
        <SearchBar 
          onSearch = { this.handleSearch }/>
        <GroupCreator
          ref = { Constants.refs.GROUP_CREATOR }
          handleCreate = { this.handleNewTabGroupCreated }/>
        <RecentList
          ref = { Constants.refs.RECENT_LIST }/>
        <TabList
          ref = { Constants.refs.TAB_LIST }
          handleEditTabGroup = { this.handleEditTabGroup }
          handleNewTabGroup = { this.handleNewTabGroup }
          column = { this.state.column }
          showCloseButtons = { this.state.showCloseButtons }
          showGroups = { this.state.showGroups }
          showNewOnTabs = { this.state.showNewOnTabs }
          twoGroupColumns = { this.state.twoGroupColumns }
          viewState = { this.state.viewState }/>
        <BottomBar 
          handleScrollToTop = { this.handleScrollToTop }
          />
      </div>
    );
  }
});

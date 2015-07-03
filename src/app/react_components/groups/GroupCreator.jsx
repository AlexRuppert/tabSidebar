/** @jsx React.DOM */
'use strict';
var Colors = require('../util/Colors.js');
var Constants = require('../util/Constants.js');
var Strings = require('../util/Strings.js');

module.exports = React.createClass({
  isEditMode: false,
  afterEditCallback: null,
  isFilter: false,
  showDialog: function (group, callback) {
    this.isFilter = false;
    this.isEditMode = (typeof group !== 'undefined'
      && typeof callback === 'function');
    this.setState({ isVisible: true });
    var color = '#3fa';
    var title = '';


    if (!this.isEditMode) {
      color = Colors.getRandomColor(Colors.backgroundColors);
    }
    else {
      this.afterEditCallback = callback;
      this.isFilter = group.filter;
     
      color = group.color;
      title = group.title;
      if(group.filter){
        React.findDOMNode(this.refs[Constants.refs.FILTER_BY]).value = group.filterBy;
        React.findDOMNode(this.refs[Constants.refs.FILTER_BY_VALUE]).value = group.filterValue;
        React.findDOMNode(this.refs[Constants.refs.SORT_BY]).value = group.sortBy;
        React.findDOMNode(this.refs[Constants.refs.SORT_DIRECTION]).value = group.sortDirection;
        React.findDOMNode(this.refs[Constants.refs.USE_REGEX]).checked = (group.useRegex == true);
        
      }
    }
    var self = this;
    setTimeout(function () {
      var inputNode = React.findDOMNode(self.refs[Constants.refs.GROUP_NAME_INPUT]);
      React.findDOMNode(self.refs[Constants.refs.COLOR_INPUT]).value = color;
      inputNode.value = title;
      inputNode.focus();
      inputNode.select();
    }, 0);
  },
  getFilterSettings: function() {
    var filterBy = React.findDOMNode(this.refs[Constants.refs.FILTER_BY]).value;
    var filterValue = React.findDOMNode(this.refs[Constants.refs.FILTER_BY_VALUE]).value;
    var sortBy =  React.findDOMNode(this.refs[Constants.refs.SORT_BY]).value;
    var sortDirection =  React.findDOMNode(this.refs[Constants.refs.SORT_DIRECTION]).value;
    var useRegex = React.findDOMNode(this.refs[Constants.refs.USE_REGEX]).checked;
    
    return {
      filterBy: filterBy,
      filterValue: filterValue,
      sortBy: sortBy,
      sortDirection: sortDirection,
      useRegex: useRegex
    };
  },
  getInitialState: function () {
    return {
      isVisible: false,
      showFilterSection: false
    }
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    if (this.state.isVisible != nextState.isVisible)
      return true;
    if (this.state.showFilterSection != nextState.showFilterSection)
      return true;
    return false;
  },
  handleCloseClick: function () {
    this.setState({ isVisible: false });
  },
  handleCreateClick: function () {
    var title = React.findDOMNode(this.refs[Constants.refs.GROUP_NAME_INPUT]).value.trim();
    var color = this.refs[Constants.refs.COLOR_INPUT].getDOMNode().value;

    if (title.length > 0) {
      this.handleCloseClick();
      var filter = null;
      
    
      filter = this.getFilterSettings();
     
      if (this.isEditMode) {
        if(!this.isFilter){
          filter = null;
        }
        this.afterEditCallback(title, color, filter);
      }
      else {
        if(!this.state.showFilterSection
          || (filter.filterBy == Constants.groupCreator.NONE
          && filter.sortBy == Constants.groupCreator.NONE)) {
          this.props.handleCreate(title, color);
        }
        else {
          this.props.handleCreate(title, color, filter);
        }
      }
    }
  },
  handleInputKeyDown: function (e) {
    var eventKey = e.nativeEvent.which;

    if (eventKey == 13) {
      this.handleCreateClick();
    }
  },
  handleShowHideFilter: function (event) {
    var checkbox = React.findDOMNode(this.refs[Constants.refs.CREATE_TAB_FILTER_CHECKBOX]);
    this.setState({showFilterSection: checkbox.checked});
  },
  render: function () {
    var classes = classNames({
      'group-creator': true,
      'hidden': !this.state.isVisible
    });

    var filterSectionClasses = classNames({
      'hidden': (!this.state.showFilterSection && !this.isEditMode) 
        || (this.isEditMode && !this.isFilter)
    });
    var checkBoxSectionClasses = classNames({
      'hidden': this.isEditMode
    });

    var acceptText = this.isEditMode ? Strings.groupCreator.SAVE_CHANGES : Strings.groupCreator.CREATE_GROUP;
    return (
      <div
        className = { classes }>
        <i
          className = "fa fa-close close-button"
          onClick = { this.handleCloseClick }/>
        <div
          className = "property-container">
          <input
            ref = { Constants.refs.GROUP_NAME_INPUT }
            type = "text"
            placeholder = { Strings.groupCreator.NAME_PLACEHOLDER }
            onKeyDown = { this.handleInputKeyDown }/>
          <input
            ref = { Constants.refs.COLOR_INPUT }
            type = "color"
            defaultValue = "#ffaadd"/>
        </div>
        <span
          className = "vspacer05"/>
        <label
          className = { checkBoxSectionClasses }>
          <input
            ref = { Constants.refs.CREATE_TAB_FILTER_CHECKBOX }
            type = "checkbox"
            checked = { this.state.showFilterSection }
            onClick= { this.handleShowHideFilter }>
            { Strings.groupCreator.CREATE_FILTER }
          </input>
        </label>
        <div
          className = { filterSectionClasses }>
          <label>
            { Strings.groupCreator.FILTER_BY }
          </label>
          <select
            ref = { Constants.refs.FILTER_BY }>
            <option value = { Constants.groupCreator.NONE } selected>{ Strings.groupCreator.NONE }</option>
            <option value = { Constants.groupCreator.TITLE_CONTAINS }>{ Strings.groupCreator.TITLE_CONTAINS }</option>
            <option value = { Constants.groupCreator.URL_CONTAINS }>{ Strings.groupCreator.URL_CONTAINS }</option>
            <option value = { Constants.groupCreator.LAST_VISITED_GREATER }>{ Strings.groupCreator.LAST_VISITED_GREATER }</option>
            <option value = { Constants.groupCreator.LAST_VISITED_LOWER }>{ Strings.groupCreator.LAST_VISITED_LOWER }</option>
            <option value = { Constants.groupCreator.OPENED_GREATER }>{ Strings.groupCreator.OPENED_GREATER }</option>
            <option value = { Constants.groupCreator.OPENED_LOWER }>{ Strings.groupCreator.OPENED_LOWER }</option>
          </select>
          <label>
            { Strings.groupCreator.FILTER_VALUE }
            <span
            style = { {float: 'right'} }>
              <input
                ref = { Constants.refs.USE_REGEX }
                type = "checkbox"
                >
                { Strings.groupCreator.USE_REGEX }
              </input>
            </span>
          </label>
          <input
            ref = { Constants.refs.FILTER_BY_VALUE }
            type = "text"
            placeholder = { Strings.groupCreator.FILTER_VALUE_PLACEHOLDER }/>
          <label>
            { Strings.groupCreator.SORT_BY }
          </label>
          <select
            ref = { Constants.refs.SORT_BY }>
            <option value = { Constants.groupCreator.NONE } selected>{ Strings.groupCreator.NONE }</option>
            <option value = { Constants.groupCreator.TITLE }>{ Strings.groupCreator.TITLE }</option>
            <option value = { Constants.groupCreator.URL }>{ Strings.groupCreator.URL }</option>
            <option value = { Constants.groupCreator.LAST_VISITED }>{ Strings.groupCreator.LAST_VISITED }</option>
            <option value = { Constants.groupCreator.OPENED }>{ Strings.groupCreator.OPENED }</option>
          </select>
          <label>
            { Strings.groupCreator.SORT_DIRECTION }
          </label>
          <select
            ref = { Constants.refs.SORT_DIRECTION }>
            <option value = { Constants.groupCreator.ASCENDING } >{ Strings.groupCreator.ASCENDING }</option>
            <option value = { Constants.groupCreator.DESCENDING }>{ Strings.groupCreator.DESCENDING }</option>
          </select>
        </div>
        <span
          className = "vspacer05"/>
        <button
          className = "text-button"
          onClick = { this.handleCreateClick }>
          <i
            className = "fa fa-plus-square"/>
          <span
            className = "hspacer02"/>
            { acceptText }
        </button>
      </div>
    );
  }
});

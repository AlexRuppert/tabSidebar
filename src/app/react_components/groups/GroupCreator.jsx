/** @jsx React.DOM */
'use strict';
var Colors = require('../util/Colors.js');
var Strings = require('../util/Strings.js');
module.exports = React.createClass({
  isEditMode: false,
  afterEditCallback: null,

  showDialog: function (group, callback) {
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

      color = group.color;
      title = group.title;
    }
    var self = this;
    setTimeout(function () {
      var inputNode = React.findDOMNode(self.refs.groupNameInput);
      React.findDOMNode(self.refs.colorInput).value = color;
      inputNode.value = title;
      inputNode.focus();
      inputNode.select();
    }, 0);
  },
  getInitialState: function () {
    return {
      isVisible: false
    }
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    return (this.state.isVisible != nextState.isVisible);
  },
  handleCloseClick: function () {
    this.setState({ isVisible: false });
  },
  handleCreateClick: function () {
    var title = React.findDOMNode(this.refs.groupNameInput).value.trim();
    var color = this.refs.colorInput.getDOMNode().value;

    if (title.length > 0) {
      this.handleCloseClick();
      if (this.isEditMode) {
        this.afterEditCallback(title, color);
      }
      else {
        this.props.handleCreate(title, color);
      }
    }
  },
  handleInputKeyDown: function (e) {
    var eventKey = e.nativeEvent.which;

    if (eventKey == 13) {
      this.handleCreateClick();
    }
  },
  render: function () {
    var classes = classNames({
      'group-creator': true,
      'hidden': !this.state.isVisible
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
            ref = "groupNameInput"
            type = "text"
            placeholder = { Strings.groupCreator.NAME_PLACEHOLDER }
            onKeyDown = { this.handleInputKeyDown }/>
          <input
            ref = "colorInput"
            type = "color"
            defaultValue = "#ffaadd"/>
        </div>
        <span
          className = "vspacer05"/>
        <button
          ref = "acceptButton"
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

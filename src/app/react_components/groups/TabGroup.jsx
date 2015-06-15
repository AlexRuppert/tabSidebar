/** @jsx React.DOM */
'use strict';

var Colors = require('../util/Colors.js');
module.exports = React.createClass({
  getInitialState: function () {
    return {
      isActive:  this.props.isActive || false
    };
  },
  getDefaultProps: function () {
    return {
      color: '#fa3',
      title: ''
    }
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    if (this.state.isActive != nextState.isActive)
      return true;
    if (this.props.color != nextProps.color)
      return true;
    if (this.props.title != nextProps.title)
      return true;
    return false;
  },
  handleClick: function (event) {
    //this.setState({ isActive: true });
    this.props.onGroupClicked(this.props.id, event);
  },
  handleCloseClicked: function (event) {
    this.props.onGroupClosed(this.props.id);
  },
  handleContextMenu: function (event) {
    //TODO: remove for release

    event.nativeEvent.preventDefault();
    this.props.onContextMenu(this.props, event);
  },

  render: function () {
    var classes = classNames({
      'tab-group': true,
      'active': this.state.isActive
    });
    var filterIconClasses = classNames({
      'fa fa-filter': true,
      'hidden': !this.props.isFilter
    });
    var color = this.props.color ? this.props.color : Colors.getColorByHash(Colors.backgroundColors, this.props.title)
    return (
      <div
        className = { classes }
        style = { {backgroundColor: this.props.color} }
        data-id = { this.props.index }
        id = { this.props.id }
        title = { this.props.title }
        draggable = "true"
        onMouseDown = { this.handleClick }
        onContextMenu = { this.handleContextMenu }
        onDragStart = { this.props.onDragStart }
        onDragEnter = { this.props.onDragEnter }
        onDragLeave = { this.props.onDragLeave }
        onDragEnd = { this.props.onDragEnd }
        onMouseEnter = { function(e) {e.target.classList.add("hover");} }
        onMouseLeave = { function(e) {e.target.classList.remove("hover");} }>
        <i className = { filterIconClasses }/>
        { this.props.title }
      </div>
    );
  }
});

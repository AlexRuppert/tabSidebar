/** @jsx React.DOM */
"use strict";

module.exports = React.createClass({
  shouldComponentUpdate: function(nextProps, nextState) {
    return (this.props.isVisible!=nextProps.isVisible)
  },
  handleClick: function(event) {
    event.stopPropagation()
    this.props.onCloseClicked(event);
  },
  handleMouseDown: function(event) {
    event.stopPropagation()
    
  },
  render: function () {
    var classes = classNames({
      'tabClose fa fa-times': true,
      'hidden': !this.props.isVisible
    });
    return (
      <i className={classes} onClick={this.handleClick} onMouseDown={this.handleMouseDown}>

      </i>
    );
  }
});

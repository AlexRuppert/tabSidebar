/** @jsx React.DOM */
"use strict";

var TabClose = require('./TabClose.jsx');
var Colors = require('./Colors.jsx');

module.exports = React.createClass({
  shouldComponentUpdate: function(nextProps, nextState) {
    if(this.state.isActive!=nextState.isActive)
      return true;
    if(this.state.color!=nextState.color)
      return true;
    return false;
  },
  getInitialState: function() {
    return {
      isActive: false,
      color: '#f50'
    };
  },
  handleClick: function(event) {
     this.setState({isActive: true});
     this.props.onGroupClicked(this.props.id, event);
  },
  handleCloseClicked: function(event) {
     this.props.onGroupClosed(this.props.id);
  },
  handleContextMenu: function(event) {
    //TODO: remove for release
    return;
    event.nativeEvent.preventDefault();
    this.props.onContextMenu(this.props.id, event);
  },
  componentWillReceiveProps: function(nextProps) {

    this.setState({
      isActive: nextProps.isActive,
      color: nextProps.color?nextProps.color:Colors.getColorByHash(Colors.backgroundColors, this.props.title)
    });
  },
  componentWillMount: function() {
    this.componentWillReceiveProps(this.props);
  },
  render: function () {

    var classes = classNames({
      'tab-group': true,
      'active': this.state.isActive
    });

    return (
      <div
        className={classes}
        style={{backgroundColor: this.state.color}}
        data-id={this.props.index}
        onClick={this.handleClick}
        draggable="true"
        onDragStart={this.props.onDragStart}
        onDragEnd={this.props.onDragEnd}
        onContextMenu={this.handleContextMenu}>
        {this.props.title}
      </div>
    );
  }
});

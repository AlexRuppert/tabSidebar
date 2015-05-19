/** @jsx React.DOM */
"use strict";
var Colors = require('./Colors.jsx');
module.exports = React.createClass({
  shouldComponentUpdate: function(nextProps, nextState) {
    return (this.state.isVisible!=nextState.isVisible);
  },
  getInitialState: function() {
    return {
      isVisible:false
    }
  },
  showDialog: function(){

    this.setState({isVisible:true});
    var color = Colors.getRandomColor(Colors.backgroundColors);
    React.findDOMNode(this.refs.colorInput).value=color;

    //otherwise there is no focus
    var self=this;
    setTimeout(function(){React.findDOMNode(self.refs.groupNameInput).focus();}, 0);
  },

  handleCreateClick: function() {

    var name = React.findDOMNode(this.refs.groupNameInput).value.trim();
    var color = this.refs.colorInput.getDOMNode().value;

    if(name.length>0){
      this.handleCloseClick();
      this.props.handleCreate(name,color);
    }
  },
  handleCloseClick: function() {
    this.setState({isVisible:false});
    this.refs.groupNameInput.getDOMNode().value='';
  },
  handleInputKeyDown: function(e) {
    var eventKey=e.nativeEvent.which;

    if(eventKey==13)
    {
      this.handleCreateClick();
    }
  },
  render: function () {
    var classes = classNames({
      'group-creator': true,
      'hidden': !this.state.isVisible
    });

    return (
      <div className={classes}>

        <i className="fa fa-close close-button" onClick={this.handleCloseClick}/>
        <div className="property-container">
          <input ref="groupNameInput" type="text" placeholder="MyGroup" onKeyDown={this.handleInputKeyDown}/>
          <input ref="colorInput" type="color" defaultValue="#ffaadd"/>
        </div>
        <span className="vspacer05"/>
        <button className="text-button" onClick={this.handleCreateClick}>
          <i className="fa fa-plus-square"/> Create Group
        </button>
      </div>
    );
  }
});

/** @jsx React.DOM */
"use strict";
var Colors = require('./Colors.jsx');
module.exports = React.createClass({

  isEditMode: false,
  afterEditCallback: null,
  shouldComponentUpdate: function(nextProps, nextState) {
    return (this.state.isVisible!=nextState.isVisible);
  },
  getInitialState: function() {
    return {
      isVisible:false
    }
  },
  showDialog: function(group, callback){

    this.isEditMode=(typeof group !== 'undefined' && typeof callback === 'function');
    this.setState({isVisible:true});
    var color = '#3fa';
    var title = '';
    var acceptText ='Create Group';

    if(!this.isEditMode){
      color = Colors.getRandomColor(Colors.backgroundColors);
    }
    else {

      this.afterEditCallback=callback;

      color = group.color;
      title = group.title;
    }


    var self=this;
    setTimeout(function(){
      var inputNode= React.findDOMNode(self.refs.groupNameInput);
      React.findDOMNode(self.refs.colorInput).value=color;
      inputNode.value=title;
      inputNode.focus();
      inputNode.select();
    }, 0);
  },

  handleCreateClick: function() {

    var title = React.findDOMNode(this.refs.groupNameInput).value.trim();
    var color = this.refs.colorInput.getDOMNode().value;

    if(title.length>0){

      this.handleCloseClick();
      if(this.isEditMode){
        this.afterEditCallback(title,color);
      }
      else{
        this.props.handleCreate(title,color);
      }

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
    var acceptText = this.isEditMode?'Save changes':'Create group';
    return (
      <div className={classes}>

        <i className="fa fa-close close-button" onClick={this.handleCloseClick}/>
        <div className="property-container">
          <input ref="groupNameInput" type="text" placeholder="MyGroup" onKeyDown={this.handleInputKeyDown}/>
          <input ref="colorInput" type="color" defaultValue="#ffaadd"/>
        </div>
        <span className="vspacer05"/>
        <button ref="acceptButton" className="text-button" onClick={this.handleCreateClick}>
          <i className="fa fa-plus-square"/> {acceptText}
        </button>
      </div>
    );
  }
});

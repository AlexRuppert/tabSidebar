/** @jsx React.DOM */
"use strict";

var TabClose = require('./TabClose.jsx');

module.exports = React.createClass({
  //mixins:[React.addons.PureRenderMixin],
  shouldComponentUpdate: function(nextProps, nextState) {
    if(this.props.isLoading!=nextProps.isLoading)
      return true;
    if(this.props.thumbnail!=nextProps.thumbnail)
      return true;
    if(this.state.isActive!=nextState.isActive)
      return true;

    if(this.state.notVisited!=nextState.notVisited)
      return true;
    if(this.props.showCompactThumbnails!=nextProps.showCompactThumbnails)
      return true;
    if(this.props.showThumbnails!=nextProps.showThumbnails)
      return true;
    if(this.props.multiColumn!=nextProps.multiColumn)
      return true;
    if(this.props.isPinned!=nextProps.isPinned)
      return true;
    if(this.props.isSmall!=nextProps.isSmall)
      return true;
    if(this.props.showClose!=nextProps.showClose)
      return true;
    if(this.props.favicon!=nextProps.favicon)
      return true;
    if(this.props.title!=nextProps.title)
      return true;
    if(this.props.showNewOnTabs!=nextProps.showNewOnTabs)
      return true;
    return false;
  },
  getInitialState: function() {
    return {
      isActive:false,
      notVisited: true
    };
  },
  getDefaultProps: function() {
    return {
      showCompactThumbnails: false,
      showThumbnails: false,
      multiColumn: false,
      isActive: false,
      showClose: false,
      isPinned: false,
      isSmall: false,
      showNewOnTabs: true
    };
  },
  handleClick: function(event) {
    //prevent pinned tabs from dragging
    if(this.props.isPinned){
      event.preventDefault();
    }

    this.setState({
     isActive: true,
     notVisited: false
    });
    this.props.onTabClicked(this.props.id, event);
  },
  handleCloseClicked: function(event) {
     this.props.onTabClosed(this.props.id);
  },
  handleContextMenu: function(event) {
    event.nativeEvent.preventDefault();
    this.props.onContextMenu(this.props, event);
  },
  /*componentWillMount: function() {
    this.setState({isActive: this.props.isActive});
  },*/
  componentWillReceiveProps: function(nextProps) {
    if(!nextProps.isActive){
      this.setState({isActive: nextProps.isActive});
    }
    else{
      this.setState({isActive: nextProps.isActive, notVisited: false});
    }
  },
  render: function () {

    var classes = classNames({
      'tab': true,
      'active': this.state.isActive,
      'compact-thumbnail': this.props.showCompactThumbnails,
      'tab-thumbnail': this.props.showThumbnails && !this.props.showCompactThumbnails,
      'multi-column': this.props.multiColumn,
      'pinned': this.props.isPinned,
      'small': this.props.isSmall,
      'not-visited': this.state.notVisited && this.props.newlyCreated && this.props.showNewOnTabs
    });

    var faviconClasses = classNames({
      'favicon': true,
      'hidden': this.props.isLoading
    });
    var spinnerClasses = classNames({
      'fa fa-circle-o-notch fa-spin': true,
      'hidden': !this.props.isLoading
    });
    var thumbnails = classNames({
      'thumbnail': this.props.showThumbnails,
      'hidden': !this.props.showThumbnails

    });

    var titleClasses = classNames({
      'title': true,
      'extended': !(this.props.showClose && !this.props.isPinned)

    });
    return (
      <li className={classes} data-id={this.props.index} onMouseDown ={this.handleClick} draggable={!this.props.isPinned} onDragStart={this.props.onDragStart} onDragEnd={this.props.onDragEnd}
      onContextMenu={this.handleContextMenu}    title={this.props.title}>
        <img className={faviconClasses} src={this.props.favicon}/>
        <i className={spinnerClasses}></i>
        <div className={titleClasses}>{this.props.title}</div>
        <TabClose onCloseClicked={this.handleCloseClicked} isVisible={this.props.showClose && !this.props.isPinned}/>
        <img className={thumbnails} src={this.props.thumbnail}>

        </img>
      </li>
    );
  }
});

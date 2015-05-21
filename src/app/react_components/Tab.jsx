/** @jsx React.DOM */
"use strict";

var TabClose = require('./TabClose.jsx');

module.exports = React.createClass({
  //mixins:[React.addons.PureRenderMixin],
  shouldComponentUpdate: function(nextProps, nextState) {
    if(this.state.isLoading!=nextState.isLoading)
      return true;
    if(this.state.isActive!=nextState.isActive)
      return true;
    if(this.state.title!=nextState.title)
      return true;
    if(this.state.favicon!=nextState.favicon)
      return true;
    if(this.props.viewState!=nextProps.viewState)
      return true;
    if(this.props.multiColumn!=nextProps.multiColumn)
      return true;
    if(this.props.isPinned!=nextProps.isPinned)
      return true;

    if(this.state.thumbnail!=nextState.thumbnail)
      return true;
    return false;
  },
  getInitialState: function() {
    return {
      isActive:false,
      notVisited: true,
      thumbnail: this.props.thumbnail||'',
      favicon: this.props.favicon||'',
      title: this.props.title||'',
      isLoading: false
    };
  },
  getDefaultProps: function() {
    return {
      viewState: 'normalview',
      multiColumn: false,
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
    return;
    event.nativeEvent.preventDefault();
    this.props.onContextMenu(this.props, event);
  },

  componentWillUpdate: function(nextProps, nextState) {
    if(nextState.isActive && this.state.notVisited==false){
      this.setState({notVisited: false});
    }


  },
  render: function () {

    var classes = classNames({
      'tab': true,
      'active': this.state.isActive,
      'compact-thumbnail': this.props.viewState=='compactview',
      'tab-thumbnail': this.props.viewState=='thumbnailview',
      'multi-column': this.props.multiColumn,
      'pinned': this.props.isPinned,
      'small': this.props.viewState=='smalltabs',
      'not-visited': this.state.notVisited && this.props.newlyCreated && this.props.showNewOnTabs
    });

    var faviconClasses = classNames({
      'favicon': true,
      'hidden': this.state.isLoading
    });
    var spinnerClasses = classNames({
      'fa fa-circle-o-notch fa-spin': true,
      'hidden': !this.state.isLoading
    });
    var thumbnails = classNames({
      'thumbnail': true,
      'empty': this.state.thumbnail.length<=1,
      'hidden': !(this.props.viewState=='compactview' || this.props.viewState=='thumbnailview')

    });

    var titleClasses = classNames({
      'title': true,
      'extended': !(this.props.showClose && !this.props.isPinned)

    });
    var thumbnailImage={
      backgroundImage: 'url(' + (this.state.thumbnail) + ')'
    };

    return (
      <li className={classes} data-id={this.props.index} onMouseDown ={this.handleClick} draggable={!this.props.isPinned} onDragStart={this.props.onDragStart} onDragEnd={this.props.onDragEnd}
      onContextMenu={this.handleContextMenu} title={this.state.title}>
        <div className="mainline">
          <img className={faviconClasses} src={this.state.favicon}/>
          <i className={spinnerClasses}></i>
          <div className={titleClasses}>{this.state.title}</div>
          <TabClose onCloseClicked={this.handleCloseClicked} isVisible={this.props.showClose && !this.props.isPinned}/>
        </div>
        <div className={thumbnails} style={thumbnailImage}>

        </div>
      </li>
    );
  }
});

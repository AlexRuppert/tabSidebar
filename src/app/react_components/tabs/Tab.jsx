/** @jsx React.DOM */
'use strict';

var Constants = require('../util/Constants.js');

module.exports = React.createClass({
  getInitialState: function () {
    return {
      isActive: false,
      notVisited: true,
      thumbnail: this.props.thumbnail || '',
      favicon: this.props.favicon || '',
      title: this.props.title || '',
      isLoading: false
    };
  },
  getDefaultProps: function () {
    return {
      viewState: Constants.viewStates.NORMAL_VIEW,
      multiColumn: false,
      showClose: false,
      isPinned: false,
      isSmall: false,
      showNewOnTabs: true
    };
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    if (this.state.isLoading != nextState.isLoading)
      return true;
    if (this.state.isActive != nextState.isActive)
      return true;
    if (this.state.notVisited != nextState.notVisited)
      return true;
    if (this.state.title != nextState.title)
      return true;
    if (this.state.favicon != nextState.favicon)
      return true;
    if (this.props.viewState != nextProps.viewState)
      return true;
    if (this.props.multiColumn != nextProps.multiColumn)
      return true;
    if (this.props.isPinned != nextProps.isPinned)
      return true;
    if(nextState.hasOwnProperty('thumbnail')) {
      if(this.state.thumbnail.length <= 0
        && nextState.thumbnail.length > 0){
        return true;
      }
      var length = 
        Math.min(this.state.thumbnail.length, nextState.thumbnail.length, 100);
      if ((this.props.viewState == Constants.viewStates.THUMBNAIL_VIEW
        || this.props.viewState == Constants.viewStates.COMPACT_VIEW)
        && (this.state.thumbnail.substring(0,length) != nextState.thumbnail.substring(0,length)))
        return true;
    }
    return false;
  },
  componentWillUpdate: function (nextProps, nextState) {
    if (nextState.isActive && this.state.notVisited) {
      this.setState({ notVisited: false });
    }
  },
  handleClick: function (event) {
    //prevent pinned tabs from dragging
    if (this.props.isPinned) {
      event.preventDefault();
    }
    if (event.nativeEvent.which == 1) {
      this.setState({
        isActive: true,
        notVisited: false
      });
    }
    this.props.onTabClicked(this.props.id, event);
  },

  handleContextMenu: function (event) {
    //TODO: enable for release
    return;
    event.nativeEvent.preventDefault();
    this.props.onContextMenu(this.props, event);
  },
  handleTabCloseClick: function (event) {
    event.stopPropagation()
    this.props.onTabClosed(this.props.id);
  },
  handleTabCloseMouseDown: function (event) {
    event.stopPropagation()
  }, 
  render: function () {
    var classes = classNames({
      'tab': true,
      'active': this.state.isActive,
      'compact-thumbnail': this.props.viewState == Constants.viewStates.COMPACT_VIEW,
      'tab-thumbnail': this.props.viewState == Constants.viewStates.THUMBNAIL_VIEW,
      'multi-column': this.props.multiColumn,
      'pinned': this.props.isPinned,
      'small': this.props.viewState == Constants.viewStates.SMALL_VIEW,
      'not-visited': this.state.notVisited
        && this.props.newlyCreated && this.props.showNewOnTabs
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
      'empty': this.state.thumbnail.length <= 1,
      'hidden': !(this.props.viewState == Constants.viewStates.COMPACT_VIEW
        || this.props.viewState == Constants.viewStates.THUMBNAIL_VIEW)
    });
    var titleClasses = classNames({
      'title': true,
      'extended': !(this.props.showClose && !this.props.isPinned)
    });
    var thumbnailImage = {
      backgroundImage: 'url(' + (this.state.thumbnail) + ')'
    };
    var tabCloseClasses = classNames({
      'tabClose fa fa-times': true,
      'hidden': !(this.props.showClose && !this.props.isPinned)
    });
    return (
      <li
        className = { classes }
        data-id = { this.props.index }
        draggable = { !this.props.isPinned }
        title = { this.state.title }
        onDragStart = { this.props.onDragStart }
        onDragEnd = { this.props.onDragEnd }
        onContextMenu = { this.handleContextMenu }
        onMouseDown = { this.handleClick }>
        <div
          className = "mainline">
          <img
            className = { faviconClasses }
            src = { this.state.favicon }/>
          <i
            className = { spinnerClasses }/>
          <div
            className = { titleClasses }>
            { this.state.title }
          </div>
          <i
            className = { tabCloseClasses }
            onClick = { this.handleTabCloseClick }
            onMouseDown = { this.handleTabCloseMouseDown }
            isVisible = { this.props.showClose && !this.props.isPinned }/>
        </div>
        <div
          className = { thumbnails }
          style = { thumbnailImage }>
        </div>
      </li>
    );
  }
});

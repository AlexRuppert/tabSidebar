/** @jsx React.DOM */
'use strict';

var Constants = require('../util/Constants.js');
module.exports = React.createClass({
  getInitialState: function () {
    return {
      isActive: this.props.isActive,
      notVisited: true,
      thumbnail: this.props.thumbnail ,
      favicon: this.props.favicon,
      title: this.props.title,
      isLoading: false,
      isSelected: false
    };
  },
  getDefaultProps: function () {
    return {
      viewState: Constants.viewStates.NORMAL_VIEW,
      collapsed: false,
      column:  Constants.menus.menuBar.viewActions.SINGLE_COLUMN,
      favicon: '',
      firstNode: false,
      isActive: false,
      isPinned: false,
      isSmall: false,
      level: 0,
      parentNode: false,
      showClose: false,
      showNewOnTabs: true,
      title: '',
      thumbnail: ''

    };
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    
    
    if (this.state.isLoading != nextState.isLoading)
      return true;
    if (this.state.isActive != nextState.isActive)
      return true;
    if (this.state.notVisited != nextState.notVisited)
      return true;
    if (this.state.isSelected != nextState.isSelected)
      return true;
    if (this.state.title != nextState.title)
      return true;
    

      
    if (this.state.favicon != nextState.favicon)
      return true;
    if (this.props.collapsed != nextProps.collapsed)
      return true;
    /*if (this.props.newlyCreated != nextProps.newlyCreated)
      return true;*/
    if (this.props.firstNode != nextProps.firstNode)
      return true;
    if (this.props.parentNode != nextProps.parentNode)
      return true;
    if (this.props.level != nextProps.level)
      return true;
    if (this.props.viewState != nextProps.viewState)
      return true;
    if (this.props.column != nextProps.column)
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
  handleCollapse: function (event) {
    event.stopPropagation();
    this.props.onTabCollapsed(this.props.id);
  },
  render: function () {
    var classes = classNames({
      'tab': true,
      'active': this.state.isActive,
      'selected': this.state.isSelected,
      'compact-thumbnail': this.props.viewState == Constants.viewStates.COMPACT_VIEW,
      'tab-thumbnail': this.props.viewState == Constants.viewStates.THUMBNAIL_VIEW,
      'multi-column': this.props.column == Constants.menus.menuBar.viewActions.DOUBLE_COLUMN,
      'pinned': this.props.isPinned,
      'tree-node': this.props.column == Constants.menus.menuBar.viewActions.TREE_VIEW && this.props.level > 0 ,
      'small': this.props.viewState == Constants.viewStates.SMALL_VIEW,
      'not-visited': this.state.notVisited
        && this.props.newlyCreated && this.props.showNewOnTabs,
      'animated': this.props.animated
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

    var tabStyle = {};
    if (this.props.column == Constants.menus.menuBar.viewActions.TREE_VIEW) {
      var indent = 18;
      if(this.props.viewState == Constants.viewStates.SMALL_VIEW){
        indent = 17;
      }
      tabStyle = {
        marginLeft: indent * this.props.level + 'px',
        width: 'calc(100% - ' + indent * this.props.level + 'px)'
      }
    };
    if(!this.state.isActive && this.props.opacity < 100) {
      tabStyle['backgroundColor'] = 'rgba(219, 219, 219, ' + this.props.opacity/100 + ')';
    }

    var mainlineClasses = classNames({
      'mainline': true,
      'first-node': this.props.firstNode && this.props.column == Constants.menus.menuBar.viewActions.TREE_VIEW
    });

    var treeCollapseClasses = classNames({
      'tree-collapse': true,
      'hidden': !this.props.parentNode || this.props.column != Constants.menus.menuBar.viewActions.TREE_VIEW
    });

    var treeCollapseIconClasses = classNames({
      'fa': true,
      'fa-plus-square-o': this.props.collapsed,
      'fa-minus-square-o': !this.props.collapsed
    });
    return (
      <li
        className = { classes }
        data-id = { this.props.index }
        draggable = { !this.props.isPinned }
        style = { tabStyle }
        title = { this.state.title }
        onDragStart = { this.props.onDragStart }
        onDragEnd = { this.props.onDragEnd }
        onContextMenu = { this.handleContextMenu }
        onMouseDown = { this.handleClick }>
        <div
          className = { treeCollapseClasses } 
          onMouseDown = { this.handleCollapse }>
          <i
            className = { treeCollapseIconClasses }/>
        </div>
        <div
            className = { mainlineClasses }>
         
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

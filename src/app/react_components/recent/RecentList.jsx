/** @jsx React.DOM */
'use strict';

var Constants = require('../util/Constants.js');
var TabLogic = require('../tabs/Tab.js');
module.exports = React.createClass({

  updateList: function() {
    var list = [];
    var seenUrls = {};
    var self = this;
    chrome.sessions.getRecentlyClosed(function(sessions) {
      for (var i = 0; i < sessions.length; i++) {
        var url = sessions[i].tab.url;
        if(!seenUrls.hasOwnProperty(url)) {
          seenUrls[url] = true;
          sessions[i].tab.favicon = TabLogic.getFavIcon(sessions[i].tab.url, 'opera://favicon/'+sessions[i].tab.url);
          list.push(sessions[i].tab);
        }
      }
      self.setState({recentTabList: list})
      self.forceUpdate();
    });
  },
  getInitialState: function() {
    return {
      isVisible: false,
      recentTabList: []
    }
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    if (this.state.isVisible != nextState.isVisible) {
      if(nextState.isVisible){
        this.updateList();
      }
      return true;
    }
      
    return false;
  },
  componentWillMount: function () {
    
    var self = this;
    chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
      if(self.state.isVisible){
        self.updateList();
      }
    });
  },
  handleMouseDown: function (id, event) {
    //event = event.nativeEvent;
    event.preventDefault();
    event.stopPropagation();
    chrome.sessions.restore(id);
    var list = this.state.recentTabList.filter(function (obj) {
      return obj.sessionId != id;
    });
    this.setState({recentTabList: list});
    this.forceUpdate();
  },
  render: function () {
    var self = this;
    var recentListClasses = classNames({
      'recent-list': true,
      'hidden': !this.state.isVisible
    });
    var recentTabs = this.state.recentTabList.map(function (tab, i) {
      return (
        <li 
          id = { tab.sessionId }
          key = { 'recentTabs'+i }
          className = { "recent-tab" }
          onMouseDown = { self.handleMouseDown.bind(self, tab.sessionId)} >
          <img src = { tab.favicon }/>
          { tab.title }
        </li>
      );
    });


    return (
      <ul className = { recentListClasses }>
        { recentTabs }
      </ul>
    );
  }
});
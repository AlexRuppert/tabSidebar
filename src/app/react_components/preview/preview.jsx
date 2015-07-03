/** @jsx React.DOM */
'use strict';

var Constants = require('../util/Constants.js');
var Strings = require('../util/Strings.js');

module.exports = React.createClass({
  //mixins: [React.addons.PureRenderMixin],
  previousImage: '',
  domainRegex: /^.*\:\/\/([^\/?#]+)(?:[\/?#]|$)/i,
  getFavs: function () {
    var tabs = TabManager.getTabs();
    var domainCount = {};
    var favs = [];
    for (var i = 0; i < tabs.length; i++) {
      var matches = tabs[i].url.match(this.domainRegex);
      var domain = matches && matches[1];
      if(domain){
        
        if(!domainCount[domain]){
          domainCount[domain] = {favicon: tabs[i].favicon, count:1};
        }
        else {
          domainCount[domain].count++;
        }
      }
      
    }

    for (var key in domainCount){
      favs.push(
        <div
          className = "fav">
          <img src = { domainCount[key].favicon }/>
          <span>
            { domainCount[key].count }
          </span>
        </div>
        );
    }
    return favs;
  },
  updateStatistics: function() {
    this.setState({tabCount: TabManager.getTabs().length, groupCount: GroupManager.getGroups().length})
  },
  getInitialState: function () {
    return {
      isVisible: true,
      isCollapsed: false,
      preview: '',
      title: '',
      tabCount: TabManager.getTabs().length,
      groupCount: GroupManager.getGroups().length
    }
  },

  render: function () {
    if (!this.state.isVisible){
      return (
        <div/>
      );
    }


    var previewContainerClasses = classNames({
      'preview-container': true,
      'hidden': !this.state.isVisible
      //'collapsed': this.state.preview == ''
    });
    var previewClasses = classNames({
      'preview': true,
      'hidden': this.state.preview == ''
    });
    var textPreviewClasses = classNames({
      'text-preview': true,
      'hidden': this.state.preview != '' || this.state.title == ''
    });
    var previewStyle = {
      backgroundImage: 'url(' + (this.state.preview) + ')'
    }
    var groupCount = {};
    var showStatistics = (this.state.title == '' && this.state.preview == '');

    if (Persistency.getState().groupSettings.showGroups) {
      groupCount = (
        <p>
          { Strings.preview.GROUPS } { this.state.groupCount }
        </p>
      )
    }
    var statisticsClasses = classNames({
      'statistics': true,
      'hidden': !showStatistics
    });
    var favClasses = classNames({
      'favs': true,
      'hidden': !showStatistics
    });
   
    var favs = showStatistics?this.getFavs():[];
    
   
    return (
      <div
        className = { previewContainerClasses }>
        <div
          className = { favClasses }>
          { favs }
        </div>
        <div
          className = { statisticsClasses }>
          { groupCount }
          <p>
            { Strings.preview.TABS } { this.state.tabCount }
          </p>
        </div>
        <div
          className = { textPreviewClasses }>
          { this.state.title }
        </div>
        <div
          className = { previewClasses }
          style = { previewStyle }
        />
      </div>
    );
  }
});
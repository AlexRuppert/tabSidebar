/** @jsx React.DOM */
"use strict";

var Tab = require('./Tab.jsx');
var TabGroup = require('./TabGroup.jsx');
var TabLogic = require('../logic/Tab.js');
var ThumbnailCache = require('../logic/ThumbnailCache.js');
var TabContextMenu = require('./TabContextMenu.jsx');
var ContextMenu = require('./ContextMenu.jsx');
var allGroupId='allGroup';

module.exports = React.createClass({
  tabPlaceholder: document.createElement("li"),
  groupPlaceholder: document.createElement("div"),

  getInitialState: function() {
    return {
      tabs: [],
      activeTab: 0,
      searchTabsQuery:'',
      activeGroup: allGroupId,
      groups:[]
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {

    if(this.props.viewState!=nextProps.viewState)
      return true;
    if(this.props.multiColumn!=nextProps.multiColumn)
      return true;
    if(this.props.showCloseButtons!=nextProps.showCloseButtons)
      return true;
    if(this.props.showGroups!=nextProps.showGroups)
      return true;
    if(this.props.showNewOnTabs!=nextProps.showNewOnTabs)
      return true;


    /*if(this.state.tabs.length != nextState.tabs.length)
      return true;
    for(var i=0; i < this.state.tabs.length; i++){
      if(this.state.tabs[i].id!=nextState.tabs[i].id){
        return true;
      }
      if(this.state.tabs[i].pinned!=nextState.tabs[i].pinned){
        return true;
      }
    }

    if(this.state.groups!=nextState.groups)
      return true;*/
    if(this.state.searchTabsQuery!= nextState.searchTabsQuery)
      return true;
    return false;

    return true;
  },
  componentDidMount: function(){
    ThumbnailCache.init();
    TabLogic.setUpEventListeners(this);
    TabLogic.getTabs(this);
    TabLogic.setToCurrentTab(this);
    ThumbnailCache.scheduleCleanup(this);


  },
  /*componentWillUpdate(object nextProps, object nextState){
    for(var i; i < nextState.tabs.length; i++){
      ThumbnailCache.loadFromCache(this,nextState.tabs[i]);
    }
  },*/


  isAllGroupActive: function(){
    return this.state.activeGroup==allGroupId;
  },
  getGroupIndex: function(id){
    for(var i=0;i < this.state.groups.length;i++){
      if(this.state.groups[i].id==id)
      {
        return i;
      }
    }
    return -1;
  },
  getTabIndex: function(tabId){
    for(var i=0;i < this.state.tabs.length;i++){
      if(this.state.tabs[i].id==tabId)
      {
        return i;
      }
    }
    return -1;
  },
  getTabIndexInGroup: function(group, tabId){
    for(var i=0;i < group.tabs.length;i++){
      if(group.tabs[i]==tabId)
      {
        return i;
      }
    }
    return -1;
  },
  getActiveGroup: function(){
    var index = this.getGroupIndex(this.state.activeGroup);
    if(index>=0){
      return this.state.groups[index];
    }
    return null;
  },
  createNewGroup: function (name, color) {
    var groups = this.state.groups;
    groups.push({title:name, id: 'g'+name, tabs:[], color:color})

    this.setState({groups: groups});
  },
  isSearchingTabs: function(){
    return this.state.searchTabsQuery.length>0
  },
  searchTabs: function(query){

    if (typeof query === 'string'){
      if(query!=this.state.searchTabsQuery){
        this.setState({searchTabsQuery:query.toLowerCase()});
      }
    }
  },
  handleTabClicked: function(id, event) {
    event = event.nativeEvent;
    if (event.which == 1) {
      var oldId=this.state.activeTab;

      if(this.state.activeTab==id){
        return 0;
      }
      //create thumbnail on leaving tab
      ThumbnailCache.updateThumbnail(this, oldId);

      chrome.tabs.update(id, {active:true});

      /*if(this.state.activeTab && this.refs[this.state.activeTab]){
        this.refs[this.state.activeTab].setState({isActive:false});
      }*/

      var tab =this.refs[id];
      var self=this;

      if(typeof tab.state.thumbnail!=='undefined' && tab.state.thumbnail.length <= 1){
        setTimeout(function(){
          ThumbnailCache.updateThumbnail(self, id);
        }, 100);
      }

    }
    else if (event.which == 2) {
      this.handleTabClosed(id);
    }
  },
  handleGroupClicked: function(id, event) {

    event = event.nativeEvent;
    if (event.which == 1) {
      if(this.state.activeGroup && this.refs[this.state.activeGroup]){
        this.refs[this.state.activeGroup].setState({isActive:false});
      }

      this.setState({activeGroup:id});
    }
    else if (event.which == 2) {
      this.handleGroupClosed(id);
    }
  },
  handleTabClosed: function(id) {
    var newTabs = this.state.tabs.filter(function( obj ) {
        return obj.id != id;
    });

    chrome.tabs.remove(id);
    this.setState({
      tabs: newTabs,
      activeTab:(id!=this.state.activeTab)?this.state.activeTab:(newTabs.length>0?newTabs[0].id:'')
    });
  },
  handleGroupClosed: function(id) {
    var newGroups = this.state.groups.filter(function( obj ) {
        return obj.id != id;
    });
    this.setState({
      groups: newGroups,
      activeGroup:(id!=this.state.activeGroup)?this.state.activeGroup:(newGroups.length>0?newGroups[0].id:'')
    });
  },
  tabDragStart: function(e) {
    this.tabDragged = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';

    this.tabNodePlacement = "after";
    this.tabOver = e.currentTarget;
  },
  tabDragEnd: function(e) {


    if(!this.groupDragged && this.groupOver && this.tabDragged)
    {
      var groupId = this.groupOver.getAttribute('data-reactid').split('$')[1];
      var tabId = this.tabDragged.getAttribute('data-reactid').split('$')[1];

      var groups = this.state.groups;
      var target= this.getGroupIndex(groupId);
      var current = this.getGroupIndex(this.state.activeGroup)

      if(target >= 0){
        if(this.getTabIndexInGroup(groups[target],+tabId) < 0){
          groups[target].tabs.push(+tabId);
        }

        if (!this.isAllGroupActive() && current >= 0) {
          var tabIndexInGroup=this.getTabIndexInGroup(groups[current],+tabId);
          if(tabIndexInGroup>=0){
            groups[current].tabs.splice(+tabIndexInGroup, 1);
          }
        }

        this.setState({groups: groups});
      }
      this.tabDragged.style.display = "block";
      this.tabDragged.parentNode.removeChild(this.tabPlaceholder);
      return;
    }

    this.tabDragged.style.display = "block";
    if(this.isSearchingTabs()){//no moving, when searching
      return;
    }
    var index=0;
    try {
      index = Array.prototype.indexOf.call(this.tabDragged.parentNode.children, this.tabPlaceholder);
      this.tabDragged.parentNode.removeChild(this.tabPlaceholder);
    }
    catch(ex){}
    // Update state
    var tabs = this.state.tabs;

    var draggedIndex = Array.prototype.indexOf.call(this.tabDragged.parentNode.children, this.tabDragged);
    if (index < draggedIndex){
      //draggedIndex--;
    }

    var from = draggedIndex;
    var to = index;//Number(this.tabOver.dataset.id);

    this.tabDragged=null;
    if (!this.isAllGroupActive()){
      var groupIndex=this.getGroupIndex(this.state.activeGroup);
      var tabIndex=this.state.groups[groupIndex].tabs[from];


      if (from == to) return;
      if(from < to) to--;


      var groups=this.state.groups;
      if(groupIndex>=0 && tabIndex>=0){
        var temp =groups[groupIndex].tabs[to];
        groups[groupIndex].tabs.splice(to, 0, groups[groupIndex].tabs.splice(from, 1)[0]);
        this.setState({groups: groups});
      }
      return;
    }
    if (from == to) return;
    if(from < to) to--;

    //count pinned tabs
    var pinnedCount=0;
    for(var i=0; i < this.state.tabs.length;i++){
      if(this.state.tabs[i].pinned){
        pinnedCount++;
      }
    }

    chrome.tabs.move(this.state.tabs[draggedIndex+pinnedCount].id,{index:to+pinnedCount});
    /*tabs.splice(to, 0, tabs.splice(from, 1)[0]);
    this.setState({tabs: tabs});*/
  },
  tabDragOver: function(e) {
    e.preventDefault();
    this.groupOver = null;
    if(!this.tabDragged)
      return;
    if(this.isSearchingTabs()){//no moving, when searching
      return;
    }
    //only 2 levels to keep it simple: check if we are over another tab
    if(!e.target.classList.contains("tab")&&!e.target.classList.contains("tab-placeholder")){
      e.target = e.target.parentNode;

      if(!e.target.classList.contains("tab")&&!e.target.classList.contains("tab-placeholder")) {
        return;
      }
    }
    this.tabDragged.style.display = "none";
    this.tabOver = e.target;
    // Inside the dragOver method
    var relY = e.clientY - this.tabOver.offsetTop-63;
    var height = this.tabOver.offsetHeight / 2;
    var parent = e.target.parentNode;
    if(relY > height) {
      parent.insertBefore(this.tabPlaceholder, e.target.nextElementSibling);
    }
    else {
      if(this.props.multiColumn && e.target.previousElementSibling && e.target.previousElementSibling.previousElementSibling){
        parent.insertBefore(this.tabPlaceholder, e.target.previousElementSibling.previousElementSibling);
      }
      else {
        parent.insertBefore(this.tabPlaceholder, e.target);
      }
    }
  },
  groupDragStart: function(e) {
    this.groupDragged = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';

    //var parent = e.currentTarget.parentNode;
    this.GroupNodePlacement = "after";
    this.groupOver = e.currentTarget;
  },
  groupDragEnd: function(e) {
    this.groupDragged.style.display = "block";
    var index=0;
    try {
      index = Array.prototype.indexOf.call(this.groupDragged.parentNode.children, this.groupPlaceholder);
      this.groupDragged.parentNode.removeChild(this.groupPlaceholder);
    }
    catch(ex){}
    // Update state
    var groups = this.state.groups;

    var from = this.getGroupIndex(this.groupDragged.dataset.id);
    var to = index-1;//Number(this.tabOver.dataset.id);
    if (from == to) return;
    if(from < to) to--;
  //  if(this.tabNodePlacement == "after") to++;
    groups.splice(to, 0, groups.splice(from, 1)[0]);
    this.setState({groups: groups});

    this.groupDragged=null;
  },
  groupDragOver: function(e) {
    e.preventDefault();

    if(!this.groupDragged && this.tabDragged)
    {
      this.groupOver = e.target;
      return;
    }

    //only 2 levels to keep it simple: check if we are over another tab
    if(!e.target.classList.contains("tab-group")&&!e.target.classList.contains("group-placeholder")){
      e.target = e.target.parentNode;

      if(!e.target.classList.contains("tab-group")&&!e.target.classList.contains("group-placeholder")) {
        return;
      }
    }
    this.groupDragged.style.display = "none";
    this.groupOver = e.target;
    // Inside the dragOver method
    var relY = e.clientY - this.groupOver.offsetTop-63;
    var height = this.groupOver.offsetHeight / 2;
    var parent = e.target.parentNode;
    if(relY > height) {
        parent.insertBefore(this.groupPlaceholder, e.target.nextElementSibling);
    }
    else {
        parent.insertBefore(this.groupPlaceholder, e.target);
    }
  },
  handleTabContextMenuOpen: function(props, event){
    this.refs.TabContextMenu.handleContextMenu(props, event);
  },
  handleTabContextMenuSelect: function(id, action){

    switch(action){
      case 'newtab':
        chrome.tabs.create({});
        break;
      case 'clonetab':
        chrome.tabs.duplicate(id);
        break;
      case 'pintab':
        chrome.tabs.update(id,{pinned:true});
        break;
      case 'unpintab':
        chrome.tabs.update(id,{pinned:false});
        break;
      case 'reloadtab':
        chrome.tabs.reload(id);
        break;
      case 'closetab':
        chrome.tabs.remove(id);
        break;
      case 'closeothertabs':
        break;
    }
  },
  handleGroupContextMenuOpen: function(id, event){
    this.refs.GroupContextMenu.handleContextMenu(id, event);
  },
  handleGroupContextMenuSelect: function(action){
    console.log(action);
  },


  render: function () {

    var classes = classNames({
      'tab-placeholder': true,
      'multi-column': this.props.multiColumn,
      'thumbnail': this.props.viewState=='thumbnailview',
      'small': this.props.viewState=='smalltabs'
    });


    this.tabPlaceholder.className = classes;
    this.groupPlaceholder.className = 'group-placeholder';

    var tabsToMap=[];

    if((this.state.activeGroup==allGroupId || (!this.getActiveGroup()))){
      if(!this.isSearchingTabs()){
        tabsToMap=this.state.tabs;
      }
      else{

        for(var i = 0; i < this.state.tabs.length;i++){
          if(this.state.tabs[i].title.toLowerCase().indexOf(this.state.searchTabsQuery)>=0){
            tabsToMap.push(this.state.tabs[i]);
          }
        }
      }




    } else {
      var activeGroup=this.getActiveGroup();

      if(activeGroup){
        for(var i = 0; i < activeGroup.tabs.length;i++){
          var tabIndex = this.getTabIndex(+this.getActiveGroup().tabs[i]);
          if(tabIndex>=0 && tabIndex < this.state.tabs.length){
            tabsToMap.push(this.state.tabs[tabIndex]);
          }
        }
      }
    }

    var tabNodes = tabsToMap.map(function (tab, i) {

      if(!tab.pinned){

          return (
            <Tab ref={tab.id}
            id={tab.id}
            index={i}
            key={tab.id}
            title={tab.title||tab.url}

            onTabClicked={this.handleTabClicked}
            onTabClosed={this.handleTabClosed}

            favicon={tab.favicon}
            onDragEnd = {this.tabDragEnd}
            onDragStart = {this.tabDragStart}
            onContextMenu = {this.handleTabContextMenuOpen}
            viewState = {this.props.viewState}

            thumbnail={tab.thumbnail}

            multiColumn= {this.props.multiColumn}
            showClose={this.props.showCloseButtons}

            isLoading={tab.status=='loading'}
            newlyCreated={tab.newlyCreated}
            showNewOnTabs={this.props.showNewOnTabs}
            >

            </Tab>

          );

      }
    },this);
    var thereArePinnedNodes=false;
    var pinNodes = this.state.tabs.map(function (tab, i) {
      if(tab.pinned){
        thereArePinnedNodes=true;
        console.log(tab.favicon);
        return (
          <Tab ref={tab.id}
          id={tab.id}
          index={i}
          key={tab.id}
          title={tab.title}

          onTabClicked={this.handleTabClicked}
          onTabClosed={this.handleTabClosed}
          favicon={tab.favicon}

          onDragEnd = {this.tabDragEnd}
          onDragStart = {this.tabDragStart}
          onContextMenu = {this.handleTabContextMenuOpen}
          showClose={false}
          isPinned={true}
          showNewOnTabs={this.props.showNewOnTabs}
          >

          </Tab>
        );
      }

    },this);

    var groups = [];
    var groupNodes = [];
    if(this.props.showGroups){
      groups.push({id:allGroupId,title:'all', color:'#ff5900'});
      groups=groups.concat(this.state.groups)
      groupNodes = groups.map(function (group, i) {
        return (
          <TabGroup
            ref={group.id}
            id={group.id}
            index={i}
            key={group.id}
            title={group.title}
            color={group.color}
            isActive={this.state.activeGroup==group.id}
            onGroupClicked={this.handleGroupClicked}
            onGroupClosed={this.handleGroupClosed}
            onDragEnd = {this.groupDragEnd}
            onDragStart = {this.groupDragStart}
            onContextMenu = {this.handleGroupContextMenuOpen}
            >
          </TabGroup>
        );

      },this);
    }
    var pinNodesClasses = classNames({
      'tab-pin-list': true,
      'hidden': !thereArePinnedNodes

    });

    var groupListClasses = classNames({
      'tab-group-list': true,
      'hidden': !this.props.showGroups

    });

    return (
      <div className="tab-container">
        <div className="tab-list-container">

          <ContextMenu ref="TabContextMenu" items={TabContextMenu} handleSelect={this.handleTabContextMenuSelect}>

          </ContextMenu>
          <ContextMenu ref="GroupContextMenu" items={TabContextMenu} handleSelect={this.handleGroupContextMenuSelect}>

          </ContextMenu>


          <div className={groupListClasses} onDragOver={this.groupDragOver}>
            {groupNodes}
          </div>

          <div className="tab-group-bar"></div>
            <div className="tab-list">
            <ul className={pinNodesClasses}>
              {pinNodes}
            </ul>
            <ul onDragOver={this.tabDragOver}>
              {tabNodes}
            </ul>
          </div>
        </div>
      </div>
    );
  }
});

/** @jsx React.DOM */
"use strict";

var Tab = require('./Tab.jsx');
var TabGroup = require('./TabGroup.jsx');
var Colors = require('./Colors.jsx');
var TabLogic = require('../logic/Tab.js');
var GroupLogic = require('../logic/Group.js');
var ThumbnailCache = require('../logic/ThumbnailCache.js');
var TabContextMenu = require('./TabContextMenu.jsx');
var GroupContextMenu = require('./GroupContextMenu.jsx');
var ContextMenu = require('./ContextMenu.jsx');
var allGroupId = GroupLogic.allGroupId;

module.exports = React.createClass({
  tabPlaceholder: document.createElement("li"),
  groupPlaceholder: document.createElement("div"),
  pinOffset: 0,
  lastTabDragY: 0,
  getInitialState: function() {
    return {
      tabs: [],
      activeTab: 0,
      searchTabsQuery:'',
      activeGroup: GroupLogic.loadLastActiveGroup(),
      groups: []
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
    if(this.state.activeGroup!=nextState.activeGroup){
      GroupLogic.saveLastActiveGroup(nextState.activeGroup);
      return true;
    }


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


  },
  componentDidMount: function(){
    ThumbnailCache.init();
    TabLogic.init();
    TabLogic.getTabs(this);

    TabLogic.setToCurrentTab(this);
    ThumbnailCache.scheduleCleanup(this);


  },
  loadGroups(){
    GroupLogic.loadGroups(this);
    TabLogic.setUpEventListeners(this);
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
    groups.push({title:name, id: GroupLogic.getNewGroupId(), tabs:[], color:color})
    this.setState({groups: groups});
    GroupLogic.saveGroups(this.state.groups);
    this.forceUpdate();
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
      if(this.state.activeGroup!=id){
        if(this.refs[this.state.activeGroup]){
          this.refs[this.state.activeGroup].setState({isActive:false});
        }

        this.setState({activeGroup:id});
      }
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
      tabs: newTabs//,
      //activeTab:(id!=this.state.activeTab)?this.state.activeTab:(newTabs.length>0?newTabs[0].id:'')
    });
  },
  handleEditTabGroup: function(id){
    if(id==GroupLogic.allGroupId)
      return;
    var index=this.getGroupIndex(id);
    var self=this;
    if(index>=0){
      this.props.handleEditTabGroup(this.state.groups[index], function(title, color){
        self.state.groups[index].title=title;
        self.state.groups[index].color=color;
        GroupLogic.saveGroups(self.state.groups);
        self.forceUpdate();
      });
    }
  },
  cloneGroup:function (id){

    if(id==GroupLogic.allGroupId){
      var groups=this.state.groups;
      var newId=GroupLogic.getNewGroupId();
      var cloneTabs=[];
      for(var i=0;i < this.state.tabs.length; i++){
        cloneTabs.push(this.state.tabs[i].id);
      }
      groups.push({title:'all - clone', id: newId, tabs:cloneTabs, color:Colors.getColorByHash(Colors.backgroundColors, newId)});
      this.setState({groups:groups});
      GroupLogic.saveGroups(groups);
      this.forceUpdate();
    }
    else {
      var index=this.getGroupIndex(id);
      if(index>=0){
        var groups=this.state.groups;
        var groupSource=groups[index];
        var newId=GroupLogic.getNewGroupId();
        var cloneTabs=[];
        for(var i=0;i < groupSource.tabs.length; i++){
          cloneTabs.push(groupSource.tabs[i]);
        }
        groups.push({title:groupSource.title, id: newId, tabs:cloneTabs, color:Colors.getColorByHash(Colors.backgroundColors, newId)});
        this.setState({groups:groups});
        GroupLogic.saveGroups(groups);
        this.forceUpdate();
      }
    }
  },
  handleGroupClosed: function(id) {
    if(id==GroupLogic.allGroupId)
      return;
    var newGroups = this.state.groups.filter(function( obj ) {
        return obj.id != id;
    });
    var newActiveGroup= id==this.state.activeGroup?allGroupId:this.state.activeGroup;//(id!=this.state.activeGroup)?this.state.activeGroup:(newGroups.length>0?newGroups[0].id:'');

    this.setState({
      groups: newGroups,
      activeGroup:newActiveGroup
    });
    GroupLogic.saveGroups(newGroups);

    this.forceUpdate();
  },

  tabDragStart: function(e) {
    this.tabDragged = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';

    this.tabNodePlacement = "after";
    this.tabOver = e.currentTarget;
  },
  tabDragEnd: function(e) {


    if(!this.groupDragged && this.groupOver && this.tabDragged)//when tab is dragged into a group
    {
      var groupId = this.groupOver.getAttribute('data-reactid').split('$')[1];
      var tabId = this.tabDragged.getAttribute('data-reactid').split('$')[1];

      var groups = this.state.groups;
      var target= this.getGroupIndex(groupId);
      var current = this.getGroupIndex(this.state.activeGroup)
      var tab = this.state.tabs[this.getTabIndex(tabId)];

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
        GroupLogic.saveGroups(groups);
        this.forceUpdate();
      }
      this.tabDragged.style.display = "block";
      this.tabDragged.parentNode.removeChild(this.tabPlaceholder);
      this.groupOver.style.border='none';
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


    var from = draggedIndex;
    var to = index;//Number(this.tabOver.dataset.id);

    this.tabDragged=null;


    if (!this.isAllGroupActive()){//if tab is dragged around inside a group
      var groupIndex=this.getGroupIndex(this.state.activeGroup);
      var tabIndex=this.state.groups[groupIndex].tabs[from];

      //console.log(groupIndex+' '+tabIndex+' '+to);
      if (from == to) return;
      if(from < to) to--;


      var groups=this.state.groups;
      if(groupIndex>=0 && tabIndex>=0){
        var temp =groups[groupIndex].tabs[to];
        groups[groupIndex].tabs.splice(to, 0, groups[groupIndex].tabs.splice(from, 1)[0]);
        this.setState({groups: groups});
        GroupLogic.saveGroups(groups);
        this.forceUpdate();
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

    var indexTabOver=-1;
    if(this.tabPlaceholder && this.props.multiColumn){

      try {
        indexTabOver = Array.prototype.indexOf.call(this.tabOver.parentNode.children, this.tabOver);
      }
      catch(ex){}
    }


    var relY=e.clientY -63-this.pinOffset-1;
    var parent = e.target.parentNode;
    var isFirstChild=indexTabOver==0;

    var up=relY < this.lastTabDragY;
    this.lastTabDragY=relY;

    if(up || isFirstChild){
      parent.insertBefore(this.tabPlaceholder, e.target);
    }
    else {
      parent.insertBefore(this.tabPlaceholder, e.target.nextSibling);
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
    var draggedIndex = Array.prototype.indexOf.call(this.groupDragged.parentNode.children, this.groupDragged);


    var from = draggedIndex-1;
    //var from = this.getGroupIndex(this.groupDragged.dataset.id)-1;
    var to = index-1;//Number(this.tabOver.dataset.id);
    if (from == to) return;
    if(from < to) to--;
  //  if(this.tabNodePlacement == "after") to++;

    groups.splice(to, 0, groups.splice(from, 1)[0]);
    this.setState({groups: groups});
    GroupLogic.saveGroups(this.state.groups);
    this.groupDragged=null;
    this.forceUpdate();
  },
  groupDragOver: function(e) {
    e.preventDefault();



    //only 2 levels to keep it simple: check if we are over another tab
    if(!e.target.classList.contains("tab-group")&&!e.target.classList.contains("group-placeholder")){
      e.target = e.target.parentNode;

      if(!e.target.classList.contains("tab-group")&&!e.target.classList.contains("group-placeholder")) {
        return;
      }
    }

    if(!this.groupDragged && this.tabDragged)
    {
      if(e.target)
      if(this.groupOver){
        this.groupOver.style.border='none';
      }
      this.groupOver = e.target;

      this.groupOver.style.border='1px dashed #eee';
      return;
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
  handleGroupContextMenuOpen: function(props, event){
    this.refs.GroupContextMenu.handleContextMenu(props, event);
  },
  handleGroupContextMenuSelect: function(id,action){
    console.log(id+''+action);
    var index = this.getGroupIndex(id);


      switch(action){
        case 'newgroup':
          this.props.handleNewTabGroup();
          break;
        case 'clonegroup':
          this.cloneGroup(id);
          break;
        case 'editgroup':
          this.handleEditTabGroup(id);
          break;
        case 'closegroup':
          this.handleGroupClosed(id);
          break;
        case 'closeothergroups':
          if(id!=GroupLogic.allGroupId){
            var group=this.state.groups[index];
            var groups=[];
            groups.push(group);
            this.setState({groups:groups});
            GroupLogic.saveGroups(groups);
            this.forceUpdate();
          }
          break;
      }

  },
  componentDidUpdate: function(prevProps, prevState){
    if(this.thereArePinnedNodes){
      this.pinOffset=React.findDOMNode(this.refs.pinList).offsetHeight;
    }
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
        var usedTabIds=[];
        for(var i = 0; i < activeGroup.tabs.length;i++){
          var tabIndex = this.getTabIndex(activeGroup.tabs[i]);
          if(tabIndex>=0 && tabIndex < this.state.tabs.length){

            usedTabIds.push(this.getActiveGroup().tabs[i]);
            tabsToMap.push(this.state.tabs[tabIndex]);
          }
        }
        //delete non-present tabs to save memory
        if( activeGroup.tabs.length != usedTabIds.length){
          activeGroup.tabs=usedTabIds;

          GroupLogic.saveGroups(this.state.groups);
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
    this.thereArePinnedNodes=false;
    var pinNodes = this.state.tabs.map(function (tab, i) {
      if(tab.pinned){
        this.thereArePinnedNodes=true;

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
      'hidden': !this.thereArePinnedNodes

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
          <ContextMenu ref="GroupContextMenu" items={GroupContextMenu} handleSelect={this.handleGroupContextMenuSelect}>

          </ContextMenu>


          <div className={groupListClasses} onDragOver={this.groupDragOver}>
            {groupNodes}
          </div>

          <div className="tab-group-bar"></div>
            <div className="tab-list">
            <ul ref="pinList" className={pinNodesClasses}>
              {pinNodes}
            </ul>
            <ul className="unpinned-tabs" onDragOver={this.tabDragOver}>
              {tabNodes}
            </ul>
          </div>
        </div>
      </div>
    );
  }
});

'use strict';

module.exports = {
  globalProperties: {
    LAST_ACTIVE_GROUP: 'lastActiveGroup',
    PERSISTENCY: 'persistency',
    SAME_SESSION: 'sameSession',
    THUMBNAIL_CACHE: 'thumbnailCache',
    THUMBNAIL_CACHE_SIZE: 'thumbnailCacheSize'
  },
  groups: {
    ALL_GROUP_COLOR: '#ff5900',
    ALL_GROUP_ID: 'allGroup',
    TAB_URL_LENGTH: 100
  },
  menus: {
    contextMenu: {
      groupActions: {
        CLONE_GROUP: 'clonegroup',
        CLOSE_GROUP: 'closegroup',
        CLOSE_OTHER_GROUPS: 'closeothergroups',
        EDIT_GROUP: 'editgroup',
        NEW_GROUP: 'newgroup'
      },
      tabActions: {
        CLONE_TAB: 'clonetab',
        CLOSE_TAB: 'closetab',
        CLOSE_OTHER_TABS: 'closeothertabs',
        NEW_TAB: 'newtab',
        PIN_TAB: 'pintab',
        RELOAD_TAB: 'reloadtab',
        UNPIN_TAB: 'unpintab'
      },
      ITEM_HEIGHT: 25,
      MENU_WIDTH: 170
    },
    menuBar: {
      openStates: {
        NONE: 'none',
        VIEW: 'view'
      },
      viewActions: {
        DOUBLE_COLUMN: 'multicolumntabs',
        SINGLE_COLUMN: 'singlecolumntabs'
      }
    },
    menuTypes: {
      DIVIDER: 'divider',
      ITEM: 'item',
      SUBMENU: 'submenu'
    }
  },
  offsets: {
    TAB_LIST_TOP: 63
  },
  paths: {
    OPTIONS: 'app/options.html'
  },
  refs: {
    GROUP_CREATOR: 'groupCreator',
    SEARCH_BOX: 'searchBox',
    TAB_LIST: 'tabList'
  },
  thumbnails: {
    CLEANUP_INTERVAL: 60 * 1000 * 5,
    CRITICAL_CACHE_SIZE: 2000,
    DESIRED_WIDTH: 300,
    MIN_UPDATE_DELAY: 2000
  },
  viewStates: {
    COMPACT_VIEW: 'compactview',
    NORMAL_VIEW: 'normalview',
    SMALL_VIEW: 'smallview',
    THUMBNAIL_VIEW: 'thumbnailview'
  }
}
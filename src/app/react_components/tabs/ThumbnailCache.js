'use strict';

var Constants = require('../util/Constants.js');

module.exports = {
  cache: chrome.extension.getBackgroundPage(),
  canvas: {},
  context: {},
  imageObj: new Image(),
  schedule: null,

  init: function () {
    if (!this.canvas.width) {
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
      this.canvas.width = Constants.thumbnails.DESIRED_WIDTH;
      this.canvas.height = Constants.thumbnails.DESIRED_WIDTH;
    }
    if (!this.cache.hasOwnProperty(Constants.globalProperties.THUMBNAIL_CACHE)) {
      this.cache[Constants.globalProperties.THUMBNAIL_CACHE] = {};
      this.cache[Constants.globalProperties.THUMBNAIL_CACHE_SIZE] = 0;
    }
  },
  hashThumbnail: function (id, url) {
    return id + '' + url;
  },
  resizeThumbnail: function (imageUrl, width, callback) {
    var self = this;

    this.imageObj.onload = function () {
      var originalWidth = self.imageObj.width;
      var originialHeight = self.imageObj.height;

      var height = Math.floor(originialHeight / (originalWidth / width));
      self.canvas.height = height;
      self.canvas.width = width;
      self.context.drawImage(self.imageObj, 0, 0, width, height);

      callback(self.canvas.toDataURL());
    };
    this.imageObj.src = imageUrl;
  },
  createThumbnail: function (tab, callback) {
    var self = this;
    try {
      chrome.tabs.captureVisibleTab(function (dataUrl) {
        if (chrome.runtime.lastError) {
        }
        else {
          self.resizeThumbnail(dataUrl, Constants.thumbnails.DESIRED_WIDTH, function (img) {
            callback(tab.id, img);
          });
        }
      });
    }
    catch (e) {
    }
  },
  cleanUpCache: function () {
    var tabs = TabManager.getTabs();
    for (var i = 0; i < tabs.length; i++) {
      var hash = this.hashThumbnail(tabs[i].id, tabs[i].url);
      if (this.cache[Constants.globalProperties.THUMBNAIL_CACHE].hasOwnProperty(hash)) {
        this.cache[Constants.globalProperties.THUMBNAIL_CACHE][hash].marked = true;
      }
    }
    var count = 0;
    var deletedCount = 0;
    for (var item in this.cache.thumbnailCache) {
      if (this.cache[Constants.globalProperties.THUMBNAIL_CACHE].hasOwnProperty(item)) {
        count++;

        if (this.cache[Constants.globalProperties.THUMBNAIL_CACHE][item].marked) {
          this.cache[Constants.globalProperties.THUMBNAIL_CACHE][item].marked = false;
        }
        else {
          deletedCount++;
          delete this.cache[Constants.globalProperties.THUMBNAIL_CACHE][item];
        }
      }
    }
    this.cache[Constants.globalProperties.THUMBNAIL_CACHE_SIZE] = count - deletedCount;
    /*console.log("Cached thumbnails = " + count);
    console.log("Deleted thumbnails = " + deletedCount);*/
  },
  scheduleCleanup: function (tabList) {
    var self = this;

    if (!window.thumbnailCacheSchedule) {
      setTimeout(function () {
        self.cleanUpCache();
      }, 1000 * 5);
      window.thumbnailCacheSchedule = setInterval(function () {
        self.cleanUpCache();
      }, Constants.thumbnails.CLEANUP_INTERVAL);
    }
  },

  updateThumbnail: function (tabList, index, id) {
    var tabs = TabManager.getTabs();
    if (index > -1) {
      var url = tabs[index].url;
      var hash = this.hashThumbnail(id, url);

      if (this.cache[Constants.globalProperties.THUMBNAIL_CACHE].hasOwnProperty(hash)) {
        var timestamp = this.cache[Constants.globalProperties.THUMBNAIL_CACHE][hash].timestamp;
        var now = Date.now();

        if (timestamp + Constants.thumbnails.MIN_UPDATE_DELAY > now) { //no new update yet allowed
          if (tabs[index].thumbnail) { //we have already a thumbnail
            return;//abort
          }
        } //else fall through
      } else {
        this.cache[Constants.globalProperties.THUMBNAIL_CACHE][hash] = {};
        this.cache[Constants.globalProperties.THUMBNAIL_CACHE_SIZE]++;
      }

      var self = this;
      this.createThumbnail(tabs[index], function (tabId, img) {
        if (tabList.refs[tabId]) {
          self.cache[Constants.globalProperties.THUMBNAIL_CACHE][hash].timestamp = Date.now();
          tabs[index].thumbnail = img;
          tabList.refs[tabId].setState({ thumbnail: img });
        }
      });
    }
    //if user somehow creates too many thumbnails before cleanup kicks in
    if (this.cache[Constants.globalProperties.THUMBNAIL_CACHE_SIZE] > Constants.thumbnails.CRITICAL_CACHE_SIZE) {
      this.cleanUpCache();
    }
  }
}
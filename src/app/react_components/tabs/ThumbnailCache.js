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
  cleanUpCache: function (tabs) {
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

    if (!this.schedule) {
      setTimeout(function () {
        self.cleanUpCache(tabList.state.tabs);
      }, 1000 * 5);
      this.schedule = setInterval(function () {
        self.cleanUpCache(tabList.state.tabs);
      }, Constants.thumbnails.CLEANUP_INTERVAL);
    }
  },
  loadFromCache: function (tab) {
    var url = tab.url;
    var hash = this.hashThumbnail(tab.id, url);

    if (this.cache[Constants.globalProperties.THUMBNAIL_CACHE].hasOwnProperty(hash)
      && this.cache[Constants.globalProperties.THUMBNAIL_CACHE][hash].image) { //only do something if it is cached
      return this.cache[Constants.globalProperties.THUMBNAIL_CACHE][hash].image;
    }
    return '';
  },
  updateThumbnail: function (tabList, index, id) {
    if (index > -1) {
      var url = tabList.state.tabs[index].url;
      var hash = this.hashThumbnail(id, url);

      if (this.cache[Constants.globalProperties.THUMBNAIL_CACHE].hasOwnProperty(hash)) {
        var timestamp = this.cache[Constants.globalProperties.THUMBNAIL_CACHE][hash].timestamp;
        var now = Date.now();

        if (timestamp + Constants.thumbnails.MIN_UPDATE_DELAY > now) { //no new update yet allowed
          if (tabList.state.tabs[index].hasThumbnail) { //we have already a thumbnail
            return;//abort
          }
          else { //need initial thumbnail, get from cache
            tabList.state.tabs[index].thumbnail = this.cache[Constants.globalProperties.THUMBNAIL_CACHE][hash].image;
            if (tabList.refs[id]) {
              tabList.refs[id].setState({ thumbnail: this.cache[Constants.globalProperties.THUMBNAIL_CACHE][hash].image });
              return;
            }
          }
        } //else fall through
      } else {
        this.cache[Constants.globalProperties.THUMBNAIL_CACHE][hash] = {};
        this.cache[Constants.globalProperties.THUMBNAIL_CACHE_SIZE]++;
      }

      var self = this;
      this.createThumbnail(tabList.state.tabs[index], function (tabId, img) {
        //console.log("I did a snapshot for " + tabId);
        if (tabList.refs[tabId]) {
          self.cache[Constants.globalProperties.THUMBNAIL_CACHE][hash].timestamp = Date.now();
          self.cache[Constants.globalProperties.THUMBNAIL_CACHE][hash].image = img;
          tabList.state.tabs[index].thumbnail = img;
          tabList.refs[tabId].setState({ thumbnail: img });
        }
      });
    }
    //if user somehow creates too many thumbnails before cleanup kicks in
    if (this.cache[Constants.globalProperties.THUMBNAIL_CACHE_SIZE] > Constants.thumbnails.CRITICAL_CACHE_SIZE) {
      this.cleanUpCache(tabList.state.tabs);
    }
  }
}
"use strict";

module.exports = {
  cache: chrome.extension.getBackgroundPage(),
  canvas: {},
  context: {},
  imageObj: new Image(),
  schedule: null,
  desiredWidth: 300,
  minUpdateDeleyMs: 2000,
  criticalCacheSize: 2000,

  init: function () {
    if (!this.canvas.width) {
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
      this.canvas.width = this.desiredWidth;
      this.canvas.height = this.desiredWidth;
    }
    if (!this.cache.hasOwnProperty('thumbnailCache')) {
      this.cache.thumbnailCache = {};
      this.cache.thumbnailCacheSize = 0;
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
        else{
          self.resizeThumbnail(dataUrl, self.desiredWidth, function (img) {
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
      if (this.cache.thumbnailCache.hasOwnProperty(hash)) {
        this.cache.thumbnailCache[hash].marked = true;
      }
    }
    var count = 0;
    var deletedCount = 0;
    for (var item in this.cache.thumbnailCache) {
      if (this.cache.thumbnailCache.hasOwnProperty(item)) {
        count++;

        if (this.cache.thumbnailCache[item].marked) {
          this.cache.thumbnailCache[item].marked = false;
        }
        else {
          deletedCount++;
          delete this.cache.thumbnailCache[item];
        }
      }
    }
    this.cache.thumbnailCacheSize = count - deletedCount;
    console.log("Cached thumbnails = " + count);
    console.log("Deleted thumbnails = " + deletedCount);
  },
  scheduleCleanup: function (tabList) {
    var self = this;

    if (!this.schedule) {
      setTimeout(function () {
        self.cleanUpCache(tabList.state.tabs);
      }, 1000 * 5);
      this.schedule = setInterval(function () {
        self.cleanUpCache(tabList.state.tabs);
      }, 60 * 1000 * 5);
    }
  },
  loadFromCache: function (tab) {
    var url = tab.url;
    var hash = this.hashThumbnail(tab.id, url);

    if (this.cache.thumbnailCache.hasOwnProperty(hash)
      && this.cache.thumbnailCache[hash].image) { //only do something if it is cached
      return this.cache.thumbnailCache[hash].image;
    }
    return '';
  },
  updateThumbnail: function (tabList, id) {
    var index = tabList.getTabIndex(id);
    if (index > -1) {
      var url = tabList.state.tabs[index].url;
      var hash = this.hashThumbnail(id, url);

      if (this.cache.thumbnailCache.hasOwnProperty(hash)) {
        var timestamp = this.cache.thumbnailCache[hash].timestamp;
        var now = Date.now();

        if (timestamp + this.minUpdateDeleyMs > now) { //no new update yet allowed
          if (tabList.state.tabs[index].hasThumbnail) { //we have already a thumbnail
            return;//abort
          }
          else { //need initial thumbnail, get from cache
            if (tabList.refs[id]) {
              tabList.refs[id].setState({ thumbnail: this.cache.thumbnailCache[hash].image });
              return;
            }
          }
        } //else fall through
      } else {
        this.cache.thumbnailCache[hash] = {};
        this.cache.thumbnailCacheSize++;
      }

      var self = this;
      this.createThumbnail(tabList.state.tabs[index], function (tabId, img) {
        //console.log("I did a snapshot for " + tabId);
        if (tabList.refs[tabId]) {
          self.cache.thumbnailCache[hash].timestamp = Date.now();
          self.cache.thumbnailCache[hash].image = img;

          tabList.refs[tabId].setState({ thumbnail: img });
        }
      });
    }
    //if user somehow creates too many thumbnails before cleanup kicks in
    if (this.cache.thumbnailCacheSize > this.criticalCacheSize) {
      this.cleanUpCache(tabList.state.tabs);
    }
  }
}
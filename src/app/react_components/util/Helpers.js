'use strict';

var Constants = require('./Constants.js')

module.exports = {
  escapeRegExp: function (str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, '\\$&').replace('*', '.*');
  },
  isInt: function (value) {
    return !isNaN(value) &&
           parseInt(Number(value)) == value &&
           !isNaN(parseInt(value, 10));
  },
  scrollTo: function (element, to, duration) {
    var start = element.scrollTop,
        change = to - start,
        currentTime = 0,
        increment = 20;
    var self = this;
    var animateScroll = function () {
      currentTime += increment;
      var val = self.easeInOutQuad(currentTime, start, change, duration);
      element.scrollTop = val;
      if (currentTime < duration) {
        setTimeout(animateScroll, increment);
      }
    };
    animateScroll();
  },

  //t = current time
  //b = start value
  //c = change in value
  //d = duration
  easeInOutQuad: function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  },

  sortBy: function (field, type, asc) {
    var dir = asc ? 1 : -1;

    if (type == 'string') {
      return function (a, b) {
        var x = a[field].toLowerCase();
        var y = b[field].toLowerCase();
        if (x > y)
          return -dir;
        if (x < y)
          return dir;
        return 0;
      };
    }
    else {
      return function (a, b) {
        if (a[field] > b[field])
          return -dir;
        if (a[field] < b[field])
          return dir;
        return 0;
      };
    }
  }
}
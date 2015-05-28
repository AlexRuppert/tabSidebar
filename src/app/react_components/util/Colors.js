'use strict';

module.exports = {
  backgroundColors: [
    '#C62828',
    '#C2185B',
    '#6A1B9A',
    '#673AB7',
    '#5C6BC0',
    '#1976D2',
    '#0277BD',
    '#0097A7',
    '#00897B',
    '#43A047',
    '#689F38',
    '#EF6C00'
  ],

  getColorByHash: function (colorArray, text) {
    var hash = 0, i, len;
    if (text.length == 0) return hash;
    for (i = 0, len = text.length; i < len; i++) {
      hash += text.charCodeAt(i);
    }
    var index = hash % colorArray.length;
    return colorArray[index];
  },
  getRandomColor: function (colorArray) {
    var index = Math.floor(Math.random() * colorArray.length);
    return colorArray[index];
  }  
};
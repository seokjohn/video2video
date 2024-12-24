const path = require('path');

module.exports = {
  publicPath: '/video2video/',
  outputDir: 'docs', 
  configureWebpack: {
    output: {
      publicPath: '/video2video/',
    },
  },
};

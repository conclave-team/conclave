const path = require('path');
var glob = require("glob");

module.exports = {
  context: path.resolve(__dirname, 'lib'),
  entry: {
    main: './main.js',
    demo: './demo.js',
    bots: './userBot.js',
    timegraph: './timeGraph.js',
    arraysGraph: './arraysGraph.js',
    idGraph: './idGraph.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'public/js'),
  },
};
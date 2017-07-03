// import webpack from 'webpack';
// import ExtractTextPlugin from 'extract-text-webpack-plugin';
var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

const extractStyles = new ExtractTextPlugin({
  filename: '[name].[contenthash].css',
  allChunks: true,
  disable: true,
});

module.exports = {
  entry: "./src/index.tsx",
  output: {
    publicPath: './build/',
    filename: "bundle.js",
    path: __dirname + "/build"
  },

  devtool: "source-map",

  target: 'electron',

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx", ".js", ".json"]
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      { test: /\.tsx?$/, loader: "awesome-typescript-loader" },

      { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
      {
        test: /\.(sass|scss)$/,
        loader: extractStyles.extract({
          fallback: 'style-loader',
          use: [{
            loader: 'css-loader',
            options: {
              sourceMap: true,
              minimize: {
                autoprefixer: {
                  add: true,
                  remove: true,
                  browsers: ['last 2 versions'],
                },
                discardComments: {
                  removeAll: true,
                },
                discardUnused: false,
                mergeIdents: false,
                reduceIdents: false,
                safe: true,
                sourcemap: true,
              },
            },
          }, {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }],
        })
      }
    ],
  },
};

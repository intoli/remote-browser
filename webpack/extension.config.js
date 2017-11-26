const path = require('path');

const ChromeExtensionReloader  = require('webpack-chrome-extension-reloader');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

const package = require('../package.json');


const options = {
  entry: {
    'background': path.resolve(__dirname, '..', 'src', 'extension', 'background.js'),
    'content': path.resolve(__dirname, '..', 'src', 'extension', 'content.js'),
  },
  output: {
    path: path.resolve(__dirname, '..', 'dist', 'extension'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        enforce: 'pre',
        loader: 'eslint-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(
      [path.join('dist', 'extension')],
      {
        root: path.resolve(__dirname, '..'),
      },
    ),
    new CopyWebpackPlugin([{
      from: path.resolve(__dirname, '..', 'src', 'extension', 'manifest.json'),
      to: path.join('manifest.json'),
      transform: (manifest) => (
        JSON.stringify({
          description: package.description,
          name: package.name,
          version: package.version,
          ...JSON.parse(manifest),
        }, null, 2)
      ),
    }]),
    new webpack.DefinePlugin({
      'typeof window': '"object"',
    }),
  ],
  target: 'web',
  devtool: 'source-map',
  node: {
    fs: 'empty',
    net: 'empty',
  },
};


if (process.env.NODE_ENV === 'development') {
  options.plugins.push(new ChromeExtensionReloader({
    entries: {
      background: 'background',
      contentScript: 'content',
    },
  }));
}


module.exports = options;

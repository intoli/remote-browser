const path = require('path');

const ChromeExtensionReloader  = require('webpack-chrome-extension-reloader');
const CopyWebpackPlugin = require("copy-webpack-plugin");

const package = require('./package.json');


const options = {
  entry: {
    [path.join('extension', 'background')]: path.resolve(__dirname, 'src', 'extension', 'background.js'),
    [path.join('extension', 'content')]: path.resolve(__dirname, 'src', 'extension', 'content.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
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
        loader: "babel-loader"
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin([{
      from: path.resolve(__dirname, 'src', 'extension', 'manifest.json'),
      to: path.join('extension', 'manifest.json'),
      transform: (manifest) => (
        JSON.stringify({
          description: package.description,
          name: package.name,
          version: package.version,
          ...JSON.parse(manifest),
        }, null, 2)
      ),
    }]),
  ],
};


if (process.env.NODE_ENV === 'development') {
  options.plugins.push(new ChromeExtensionReloader());
  options.devtool = 'source-map';
}


module.exports = options;

const path = require('path');

const ChromeExtensionReloader  = require('webpack-chrome-extension-reloader');
const CopyWebpackPlugin = require("copy-webpack-plugin");

const package = require('./package.json');


const options = {
  entry: {
    background: path.resolve(__dirname, 'src', 'background.js'),
    content: path.resolve(__dirname, 'src', 'content.js'),
  },
  output: {
    path: path.resolve(__dirname, 'build'),
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
      from: "src/manifest.json",
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

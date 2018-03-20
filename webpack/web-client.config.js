const path = require('path');

const webpack = require('webpack');


const options = {
  entry: {
    index: path.resolve(__dirname, '..', 'src', 'index.js'),
  },
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: '[name].web.js',
    library: 'Browser',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  externals: [
    'express',
    'express-ws',
    'portfinder',
    'selenium-webdriver',
    'ws',
  ],
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
    new webpack.DefinePlugin({
      'typeof window': '"object"',
    }),
  ],
  target: 'web',
  devtool: 'source-map',
  node: {
    __dirname: false,
    child_process: 'empty',
    fs: 'empty',
    net: 'empty',
    path: 'empty',
  },
};


module.exports = options;

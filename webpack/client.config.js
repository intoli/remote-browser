const path = require('path');

const webpack = require('webpack');


const options = {
  entry: {
    index: path.resolve(__dirname, '..', 'src', 'index.js'),
  },
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: '[name].js',
    library: 'Browser',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  externals: [
    'express',
    'ws',
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, '..', 'src'),
        enforce: 'pre',
        loader: 'eslint-loader',
      },
      {
        test: /\.js$/,
        include: path.resolve(__dirname, '..', 'src'),
        loader: 'babel-loader',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'typeof window': '"undefined"',
    }),
  ],
  target: 'node',
  devtool: 'source-map',
  node: {
    __dirname: false,
  }
};


module.exports = options;

const path = require('path');

const webpack = require('webpack');


// We'll explicitly whitelist the dependencies that we actually want to include.
const packageJson = require(path.resolve(__dirname, '..', 'package.json'));
const whitelistedDependencies = ['simple-websocket'];
const blacklistedDependencies = Object.keys(packageJson.dependencies)
  .filter(packageName => !whitelistedDependencies.includes(packageName));


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
      ...blacklistedDependencies.map(dependency => ({
        test: new RegExp(`^${path.resolve(__dirname, '..', 'node_modules', dependency)}/`),
        loader: 'null-loader',
      })),
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

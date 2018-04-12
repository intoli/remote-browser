const path = require('path');

const webpack = require('webpack');


// We'll explicitly whitelist the dependencies that we actually want to include.
const packageJson = require(path.resolve(__dirname, '..', 'package.json'));
const whitelistedDependencies = ['isomorphic-fetch', 'simple-websocket'];
const blacklistedDependencies = Object.keys(packageJson.dependencies)
  .filter(packageName => !whitelistedDependencies.includes(packageName));


const options = {
  entry: {
    index: path.resolve(__dirname, '..', 'src', 'index.js'),
  },
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: path.join('web-client', '[name].js'),
    library: 'Browser',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
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
    new webpack.EnvironmentPlugin([
      REMOTE_BROWSER_API_URL,
    ]),
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

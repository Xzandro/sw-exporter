const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
  entry: './app/View.js',
  output: {
    filename: './bundle.js',
    path: path.join(process.cwd(), 'app'),
  },
  mode: 'development',
  target: 'electron-renderer',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
      },
    ],
  },
  plugins: [new ESLintPlugin()],
};

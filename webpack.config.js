const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
  entry: './app/View.js',
  output: {
    filename: './app/bundle.js',
  },
  mode: 'production',
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

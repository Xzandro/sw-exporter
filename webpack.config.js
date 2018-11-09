module.exports = {
  entry: './app/View.js',
  output: {
    filename: './app/bundle.js',
  },
  target: 'electron',
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'eslint-loader',
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: {
          presets: ['env', 'react'],
        },
      },
    ],
  },
};
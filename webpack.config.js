module.exports = {
  entry:'./app/View.js',
  output:{
    filename:'./app/bundle.js'
  },
  target: 'electron',
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query:{
          presets:['react','es2015']
        }
      }
    ]
  }
}
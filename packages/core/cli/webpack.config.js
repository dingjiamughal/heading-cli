const path = require('path');

module.exports = {
  mode: 'production',
  entry: './bin/core.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'core.js'
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.m?js$/,
        // exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env']],
            plugins: [
              [
                '@babel/plugin-transform-runtime',
                {
                  corejs: 3,
                  regenerator: true,
                  useESModules: true,
                  helpers: true
                }
              ]
            ]
          }
        }
      }
    ]
  }
};

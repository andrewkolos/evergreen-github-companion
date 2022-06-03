'use strict'
const CopyPlugin = require('copy-webpack-plugin')
const path = require('path')

const commonConfig = {
  module: {
    rules: [{ test: /\.tsx?$/, loader: 'ts-loader' }],
  },
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
}
const mainConfig = {
  mode: 'development',
  entry: './src/electron/main.ts',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'out/electron'),
  },
  ...commonConfig,

  // tell webpack that we're building for electron
  target: 'electron-main',
  node: {
    // tell webpack that we actually want a working __dirname value
    // (ref: https://webpack.js.org/configuration/node/#node-__dirname)
    __dirname: false,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve('src/electron/static'),
          to: path.resolve('out/electron'),
        },
      ],
    }),
  ],
}

const preloadConfig = {
  mode: 'development',
  entry: './src/electron/preload.ts',
  output: {
    filename: 'preload.js',
    path: path.resolve(__dirname, 'out/electron'),
  },
  ...commonConfig,
  target: 'electron-preload',
  node: {
    // tell webpack that we actually want a working __dirname value
    // (ref: https://webpack.js.org/configuration/node/#node-__dirname)
    __dirname: false,
  },
}

module.exports = [mainConfig, preloadConfig]

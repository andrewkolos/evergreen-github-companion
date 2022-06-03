'use strict'

// pull in the 'path' module from node
const path = require('path')
const HtmlWebPackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

/** @type {import('webpack').Configuration} */
module.exports = {
  // development mode will set some useful defaults in webpack
  mode: 'development',
  // the entry point is the top of the tree of modules.
  // webpack will bundle this file and everything it references.
  entry: './src/website/renderer.tsx',
  // Avoids use of `eval` when generating source maps. V8 will throw a fit if it sees evals as they are unsafe.
  devtool: 'cheap-module-source-map',
  // we specify we want to put the bundled result in the matching out/ folder
  output: {
    filename: 'renderer.js',
    path: path.resolve(__dirname, 'out/website'),
  },
  target: 'electron-renderer',
  module: {
    // rules tell webpack how to handle certain types of files
    rules: [
      // at the moment the only custom handling we have is for typescript files
      // .ts and .tsx files get passed to ts-loader
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
      },
      { test: /\.jpe?g$|\.svg$|\.gif$|\.png$/i, use: 'url-loader' },
      { test: /\.otf$|\.woff$|\.woff2$|\.eot$|\.ttf$/, use: 'url-loader' },
      { test: /\.ico$|_icon\.png$/i, use: 'url-loader' },
    ],
  },
  resolve: {
    // specify certain file extensions to get automatically appended to imports
    // ie we can write `import 'index'` instead of `import 'main.ts'`
    extensions: ['.ts', '.tsx', '.js'],
  },
  plugins: [
    new MiniCssExtractPlugin(),

    // This reads index.html from src, injects a <script> tag for main.js, and then copies it to the output dir
    new HtmlWebPackPlugin({
      template: 'src/website/index.html',
    }),
  ],
}

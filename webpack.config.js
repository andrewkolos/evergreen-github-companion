const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

/** @type {import('webpack').Configuration} */
module.exports = [
  {
    mode: 'development',
    entry: {
      main: './src/main.ts',
      renderer: './src/renderer.ts',
      preload: './src/preload.ts',
    },
    target: 'electron-main',
    resolve: {
      extensions: ['.ts', '.tsx', '.json', '.js', '.css'],
    },
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.ts(x?)$/,
          include: /src/,
          use: [{ loader: 'ts-loader' }],
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    output: {
      filename: '[name].js',
      path: path.resolve('dist'),
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
      }),
    ],
  },
]

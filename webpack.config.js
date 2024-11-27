const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const nodeExternals = require('webpack-node-externals')
require('dotenv').config();

const commonConfig = {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/env', '@babel/react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: ['ts-loader'],
      },
    ],
  },
  // module resolution configuration
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    modules: [path.resolve(__dirname, 'client/src'), 'node_modules'],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
  },

}

const frontendConfig = {
  ...commonConfig,
  name: 'frontend',
  entry: './dashboard/src/index.tsx',
  
  output: {
    path: path.resolve(__dirname, 'dist/dashboard'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  target: 'web',
  
  // plugins for additional build steps
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './dashboard/public/dash.html',
      inject: true,
    }),
    new Dotenv(),
  ],

  devServer: {
    headers: {"Access-Control-Allow-Origin": "*"},
    historyApiFallback: true,
    static: {
      //   publicPath: '/dist',
      // directory: path.resolve(__dirname, 'dist'),
      directory: path.resolve(__dirname, './dashboard/public'), // ensure access to static files in the public directory
    },
    proxy: [
      {
        context: ['/api', '/route', '/dashboard', '/api-config'],
        target: 'http://localhost:2024',
        logLevel:   'info',
      },
    ],
  },
};

const backendConfig = {
  ...commonConfig,
  name: 'backend',
  entry: './server/server.ts',
  
  output: {
    path: path.resolve(__dirname, 'dist/server'),
    filename: 'server.js',
    publicPath: '/',
  },
  target: 'node',
  externals: [nodeExternals()],
  // plugins for additional build steps
  plugins: [
    new Dotenv(),
  ],

  node: {
    __dirname: false,
    __filename: false
  }
};

module.exports = [frontendConfig, backendConfig];
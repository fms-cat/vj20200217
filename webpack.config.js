/* eslint-env node */

const path = require( 'path' );

const ForkTsCheckerWebpackPlugin = require( 'fork-ts-checker-webpack-plugin' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const webpack = require( 'webpack' );

module.exports = ( env, argv ) => {
  const DEBUG = argv.mode === 'development';

  return {
    entry: path.resolve( __dirname, 'src/main.ts' ),
    output: {
      path: path.resolve( __dirname, 'dist' ),
      filename: 'bundle.js'
    },
    module: {
      rules: [
        { test: /\.(png|jpg|gif|ttf|otf)$/, use: 'url-loader' },
        { test: /\.(sass|scss|css)$/, use: [ 'style-loader', 'css-loader' ] },
        {
          test: /\.(sass|scss)$/,
          use: {
            loader: 'sass-loader',
            options: {
              implementation: require( 'sass' )
            }
          },
        },
        { test: /\.(glsl|frag|vert)$/, use: [ 'raw-loader', 'glslify-loader' ] },
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: { happyPackMode: true, transpileOnly: true }
            }
          ]
        },
      ]
    },
    resolve: {
      modules: [ 'node_modules' ],
      extensions: [ '.ts', '.js' ],
    },
    optimization: {
      minimize: !DEBUG
    },
    devServer: {
      inline: true,
      hot: true
    },
    devtool: DEBUG ? 'inline-source-map' : false,
    plugins: [
      new webpack.DefinePlugin( {
        'process.env': { DEBUG: DEBUG },
      } ),
      new HtmlWebpackPlugin( {
        template: './src/html/index.html'
      } ),
      ...( DEBUG ? [
        new webpack.NamedModulesPlugin(),
        new ForkTsCheckerWebpackPlugin( { checkSyntacticErrors: true } ),
      ] : [] ),
    ],
    devtool: DEBUG ? 'inline-source-map' : false
  };
};

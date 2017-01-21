const path = require('path');
const webpack = require('webpack');

const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const ngcWebpack = require('ngc-webpack');

const ROOT = path.join(__dirname);

const NormalModuleReplacementPlugin = require('webpack/lib/NormalModuleReplacementPlugin');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');

const AOT = false;
module.exports = function (options) {
  return {
    entry: {
      'main': path.join(ROOT, `./test/integration/main.browser${AOT ? '.aot' : ''}.ts`)
    },

    output: {

      path: '__webpack_dist__',

      filename: '[name].bundle.js',

      sourceMapFilename: '[file].map',

      chunkFilename: '[id].chunk.js',

      library: 'ac_[name]',
      libraryTarget: 'var',
    },


    externals: [ /node_modules/ ],

    resolve: {
      extensions: ['.ts', '.js', '.json'],
      modules: ['node_modules'],
    },

    resolveLoader: {
      alias: {
        'ng-router-loader': path.join(ROOT, './index.ts') //path.join(ROOT, './dist/index.js')
      }
    },

    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ng-router-loader',
              options: {
                loader: 'async-import',
                debug: true,
                genDir: '__codegen__',
                aot: AOT
              }
            },
            'awesome-typescript-loader?{configFileName: "tsconfig.integration.json"}'
          ],
          exclude: [/\.(spec|e2e)\.ts$/]
        },

      ],

    },

    plugins: [
      new LoaderOptionsPlugin({}),

      new ngcWebpack.NgcWebpackPlugin({
        disabled: !AOT,
        tsConfig: path.join(ROOT, './tsconfig.integration.json')
      }),

      new CommonsChunkPlugin({
          name: 'vendor',
          chunks: ['main'],
          minChunks: module => /node_modules\//.test(module.resource)
      }),

      new NormalModuleReplacementPlugin(
        /facade(\\|\/)async/,
        path.join(ROOT, 'node_modules/@angular/core/src/facade/async.js')
      ),
      new NormalModuleReplacementPlugin(
        /facade(\\|\/)collection/,
        path.join(ROOT, 'node_modules/@angular/core/src/facade/collection.js')
      ),
      new NormalModuleReplacementPlugin(
        /facade(\\|\/)errors/,
        path.join(ROOT, 'node_modules/@angular/core/src/facade/errors.js')
      ),
      new NormalModuleReplacementPlugin(
        /facade(\\|\/)lang/,
        path.join(ROOT, 'node_modules/@angular/core/src/facade/lang.js')
      ),
      new NormalModuleReplacementPlugin(
        /facade(\\|\/)math/,
        path.join(ROOT, 'node_modules/@angular/core/src/facade/math.js')
      ),
    ],

    node: {
      global: true,
      crypto: 'empty',
      process: true,
      module: false,
      clearImmediate: false,
      setImmediate: false
    }

  };
}
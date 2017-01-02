export type BUILT_IN_LOADERS = 'sync' | 'async-require' | 'async-system';

/**
 * Loader options for the `ng-router-loader`.
 *
 * ## Resource specific options
 * Some options apply to a resource, the global option serve as the default but can be overridden in a resource URI using query parameters.
 *
 * >Resource specific options are marked with the **resource_override** tag.
 *
 * #### AOT mode
 * Some of the options apply on when the `aot` flag is set to **true**.
 *
 * >AOT specific options are marked with the **aot_mode** tag.
 *
 *
 * ## Usage
 * #### Webpack 1
 * ```ts
 * {
 *    test: /\.ts$/,
 *    loaders: [
 *      'awesome-typescript-loader',
 *      'ng-router-loader?aot=true&genDir=codegen'
 *    ]
 * }
 * ```
 *
 * #### Webpack 2
 * You can use the query string as well as:
 * ```ts
 * {
 *    test: /\.ts$/,
 *    use: [
 *      'awesome-typescript-loader',
 *      {
 *         loader: 'ng-router-loader',
 *         options: {
 *           aot: true,
 *           genDir: 'codegen'
 *         }
 *      }
 *    ]
 * }
 * ```
 */
export interface RouterLoaderOptions {
  /**
   * A separator used to identify the NgModule class name in the URI.
   * @default '#'
   */
  delimiter?: string;

  /**
   * Enable support for AOT compiled code.
   * If you are bundling AOT compiled code (.ngfactory) set this to true
   * @default false
   */
  aot?: boolean;

  /**
   * The suffix used by the angular compiler to mark compiled version of source tree modules.
   *
   * @aot_mode
   * @default '.ngfactory'
   */
  moduleSuffix?: string;

  /**
   * The suffix used by the angular compiler to mark compiled version of source tree NgModule class.
   *
   * @aot_mode
   * @default 'NgFactory'
   */
  factorySuffix?: string;

  /**
   * The code generator to use when replacing the URI with a callback.
   *
   * There are 3 built in code generators:
   *   - sync: The module will be part of the bundle (lazy initializing but NOT lazy loading)
   *   - async-require: The module will load in a separate bundle, using webpack's `require.ensure` feature (support chunkName)
   *   - async-system: The module will load in a separate bundle using System.import
   *
   *   Note: System.import is deprecated in Webpack 2, will be removed in webpack 3 (https://github.com/webpack/webpack/releases/tag/v2.1.0-beta.28)
   *
   * You can override the loader in a specific resource by setting the loader in a resource query.
   *
   * @resource_override
   * @default 'async-require'
   */
  loader?: BUILT_IN_LOADERS | string;

  /**
   * The destination of compiled files created by the angular compiler-cli.
   * The directory is resolved relative to the current working directory (process.cwd())
   *
   * When genDir is empty or "." the destination is the project root and factory files are saved along side the source tree.
   *
   * IMPORTANT NOTE:
   * The compiler-cli takes this value from the tsconfig file @ "angularCompilerOptions.genDir" and
   * resolve the destination with "genDir" relative to the "tsconfig" file.
   * Webpack (hence the loader) run on a different process so it does not know about that "tsconfig".
   * If your setup is complex you need to make sure that the 2 "genDir"s resolve to the same directory according to the logic described here.
   *
   * The best scenario is when "tsconfig.json" is in the project root and webpack is executed from the project root.
   * In this case the "genDir" should be identical to the "genDir" value in "tsconfig.json"
   *
   * @aot_mode
   * @default ''
   */
  genDir?: string;

  /**
   * If false outputs a pretty code
   *
   * @default true
   */
  inline?: boolean;

  debug?: boolean;

  /**
   * Resolve ngfactory modules and verify they exist, if not track the symbol and search for the ngfactory
   * that exports the symbol.
   *
   * AOT compilation emit ngfactory files only for NgModule, Component and Directive.
   * If a module does not have one of those the compiler will not create an ngfactory file for it.
   *
   * In webpack it is a common practice to use directories as packages (barrel pattern) having an
   * index file exporting what's needed.
   *
   * When a URI reference a module (ModA) that:
   * - export an NgModule defined in an other module (ModB) and;
   * - ModA has no NgModule, Component or Directive defined inside it
   *
   * The resolved file will "ModA.ngfactory", even though it does not exists.
   * When bySymbol is true the loader will use the metadata in "ngsummary.json" files to lookup the
   * first ngfactory file that exports ModB, it will then use it as the resolved URI.
   *
   * You can override this option in a specific resource by setting the bySymbol property in a resource query.
   *
   * @resource_override
   * @aot_mode
   * @default true
   */
  bySymbol?: boolean;
}

/**
 * Resource specific options, defined as query string on the resource URI.
 *
 * ```
 * {
 *   path: 'home',
 *   loadChildren: './app/home/home-module#HomeModule?loader=sync&bySymbol=false'
 * }
 * ```
 */
export interface RouteResourceOptions {
  /**
   * The code generator to use when replacing the URI with a callback.
   *
   * @resource_override RouterLoaderOptions.loader
   */
  loader?: BUILT_IN_LOADERS | string;

  /**
   * A chunk name used by webpack to bundle async modules.
   * Used by the "async-require" loader.
   *
   * For more information see [webpack require.ensure](https://webpack.js.org/guides/code-splitting/#code-splitting-with-require-ensure-)
   */
  chunkName?: string;

  /**
   * Resolve ngfactory modules and verify they exist, if not track the symbol and search for the ngfactory
   * that exports the symbol.
   *
   * @resource_override RouterLoaderOptions.loader
   */
  bySymbol?: boolean;
}

export const DEFAULT_OPTIONS: RouterLoaderOptions = {
  delimiter: '#',
  aot: false,
  moduleSuffix: '.ngfactory',
  factorySuffix: 'NgFactory',
  loader: 'async-require',
  genDir: '',
  inline: true,
  bySymbol: true
};

export const DEFAULT_RESOURCE_OPTIONS: RouteResourceOptions = {
  loader: undefined,
  chunkName: undefined,
  bySymbol: undefined
};


const loaderUtils = require('loader-utils');
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

import { RouterLoaderOptions, RouteResourceOptions, DEFAULT_OPTIONS } from './options';
import { RouteDestination } from './RouteModule';

export interface ReplaceResult {
  /**
   * Debug mode
   */
  debug: boolean;

  /**
   * The resolved path
   */
  filePath: string;

  /**
   * The NgModule property on the resolved module
   */
  moduleName: string;

  /**
   * The RESOURCE query used to resolve the module.
   * Note: This is the query defined on the URI used in "loadChildren", not the global query.
   */
  resourceQuery: RouteResourceOptions;

  /**
   * The updated source file.
   */
  source: string;

  /**
   * The content remove from the source file.
   */
  match: string;

  /**
   * The content inserted into the source file.
   */
  replacement: string
}

export type  LoaderCodeGen = Function & (
    ( (file: string, module: string) => string )
  | ( (file: string, module: string, loaderOptions: RouterLoaderOptions) => string )
  | ( (file: string, module: string, loaderOptions: RouterLoaderOptions, resourceOptions: RouteResourceOptions) => string )
  )

export class Loader {
  public query: RouterLoaderOptions;

  constructor( private webpack: any) { }

  replace(source: string): Promise<[ReplaceResult] | undefined> {
    //TODO: Move this regex async chaos into AST

    const LOAD_CHILDREN_RE = /loadChildren[\s]*:[\s]*['|"](.*?)['|"]/gm;
    const promises = [];
    let match = LOAD_CHILDREN_RE.exec(source);

    while (match) {
      const p = this.replaceSource(match[0], match[1])
        .then(result => {
          source = source.replace(result.match, result.replacement);
          return Object.assign(result, {
            source
          });
        });

      promises.push(p);
      match = LOAD_CHILDREN_RE.exec(source);
    }

    if (promises.length > 0) {
      return Promise.all(promises);
    } else {
      return Promise.resolve(undefined);
    }
  }

  private resolve(context: string, resourceUri: string): Promise<string> {
    return new Promise<string>( (resolve, reject) => {
      this.webpack.resolve(context, resourceUri, (err, fullPath) => {
        if (err) {
          reject(err);
        } else {
          resolve(fullPath);
        }
      });
    });
  }

  private replaceSource(match: string, loadChildrenPath: string): Promise<ReplaceResult> {
    this.query = Object.assign({}, DEFAULT_OPTIONS, loaderUtils.parseQuery(this.webpack.query));

    const route = new RouteDestination(loadChildrenPath, this.webpack.resourcePath, this.query);

    const codeGen = Loader.LOADER_CODEGEN_MAP.get(route.options.loader);
    if (!codeGen) {
      return Promise.reject(new Error(`ng-router-loader - Invalid code generator "${route.options.loader}"`));
    }

    let context: string = !route.isRawRelative || !route.isCompiled
      ? path.dirname(this.webpack.resourcePath)
      : path.dirname(this.genDirToSourceTree(this.webpack.resourcePath))
    ;

    return this.resolve(context, route.rawFilePath)
      .then( (filePath) => {
        let moduleName = route.moduleName;

        // update the file path for non-ngfactory files
        if (this.query.aot) {
          filePath = this.sourceTreeToGenDir(filePath);
          filePath = filePath.substr(0, filePath.lastIndexOf('.'));

          if (route.options.bySymbol) {
            filePath = this.trackSymbolRootDecl(filePath, route.moduleName);
          }

          filePath = filePath + this.query.moduleSuffix;
          moduleName = moduleName + this.query.factorySuffix;
        } else {
          filePath = filePath.substr(0, filePath.lastIndexOf('.'));
        }

        filePath = this.normalize(filePath);

        const replacement = codeGen(filePath, moduleName, this.query, route.options);

        return {
          debug: typeof this.query.debug !== 'boolean' ? this.webpack.debug : this.query.debug,
          filePath,
          moduleName,
          resourceQuery: route.options,
          source: undefined,
          match,
          replacement
        }
      });
  }

  private normalize(filePath: string): string {
    let normalizedPath = path.normalize(filePath);

    if (os.platform() === 'win32') {
      normalizedPath = normalizedPath.replace(/\\/g, '\\\\');
    }

    return normalizedPath;
  }

  private trackSymbolRootDecl(absPath: string, moduleName: string): string {
    const summarySuffix = '.ngsummary.json';

    if (absPath.endsWith(summarySuffix)) {
      const summary = require(absPath);
      const symbols = summary.symbols
        .filter( s => s.name === moduleName)
        .filter( s => summary.summaries.some( ss => ss.metadata.__symbol === s.__symbol ) );

      const m = symbols[0];
      let filePath = m.filePath.replace(/^(.*)\.d\.ts$/, '$1');
      return this.trackSymbolRootDecl(this.sourceTreeToGenDir(filePath), moduleName);
    } else if (fs.existsSync(absPath + this.query.moduleSuffix + '.ts')) {
      return absPath;
    } else {
      return this.trackSymbolRootDecl(absPath + summarySuffix, moduleName);
    }
  }

  /**
   * Convert a source tree file path into a it's genDir representation
   * this only change the path to the file, not the file iteself (i.e: suffix)
   * @param absFilePath
   * @returns {string}
   */
  private sourceTreeToGenDir(absFilePath: string): string {
    if (this.query.genDir && this.query.genDir !== '.') {
      const relativeNgModulePath = path.relative(process.cwd(), absFilePath);
      return path.join(path.resolve(process.cwd(), this.query.genDir), relativeNgModulePath);
    } else {
      return absFilePath;
    }
  }

  private genDirToSourceTree(absFilePath: string): string {
    if (this.query.genDir && this.query.genDir !== '.') {
      const relativeNgModulePath = path.relative(path.resolve(process.cwd(), this.query.genDir), absFilePath);
      return path.join(process.cwd(), relativeNgModulePath);
    } else {
      return absFilePath;
    }
  }

  static setCodeGen(name: string, codeGen: LoaderCodeGen): void {
    Loader.LOADER_CODEGEN_MAP.set(name, codeGen);
  }
  static LOADER_CODEGEN_MAP = new Map<string, LoaderCodeGen>();
}

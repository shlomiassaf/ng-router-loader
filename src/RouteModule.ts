const loaderUtils = require('loader-utils');
import * as path from 'path';
import { RouteResourceOptions, RouterLoaderOptions, DEFAULT_RESOURCE_OPTIONS } from './options';

export class RouteDestination {
  readonly options: RouteResourceOptions;

  /**
   * The absolute file path to the destination from the import.
   */
  readonly filePath: string;
  readonly moduleName: string;
  readonly rawFilePath: string;

  /**
   * If true the source resource is a angular compiler compiled module (ngFactory).
   */
  readonly isCompiled: boolean;

  /**
   * If true the original (raw) file path is a relative path.
   */
  readonly isRawRelative: boolean;

  constructor(private loadChildrenPath: string, private sourceResourcePath: string, private query: RouterLoaderOptions) {
    const [ pathString, pathQuery ] = loadChildrenPath.split('?') as [string, string];
    const { loader, chunkName, bySymbol } = Object.assign(
      {},
      DEFAULT_RESOURCE_OPTIONS,
      loaderUtils.parseQuery(pathQuery ? '?' + pathQuery : '')
    );

    this.options = {
      loader: typeof loader === 'string' ? loader : query.loader,
      chunkName,
      bySymbol: typeof bySymbol === 'boolean' ? bySymbol : query.bySymbol
    };

    // split the string on the delimiter
    const [ filePath, moduleName ] = pathString.split(query.delimiter) as [string, string];

    this.rawFilePath = filePath;
    this.moduleName = moduleName || 'default';

    this.isCompiled = this.getFilename(sourceResourcePath).endsWith(query.moduleSuffix);
    this.isRawRelative = filePath.startsWith('.');

    const currentDir = path.dirname(sourceResourcePath);
    // the absolute path of our destenation NgModule module.
    this.filePath =  path.resolve(currentDir, filePath);

  }

  private getFilename(resourcePath): string {
    const filename = path.basename(resourcePath);

    return path.basename(resourcePath, path.extname(filename));
  }
}

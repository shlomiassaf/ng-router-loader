import { RouteResourceOptions, RouterLoaderOptions } from './options';
export declare class RouteDestination {
    private loadChildrenPath;
    private sourceResourcePath;
    private query;
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
    constructor(loadChildrenPath: string, sourceResourcePath: string, query: RouterLoaderOptions);
    private getFilename(resourcePath);
}

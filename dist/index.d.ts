import * as Loader from './src/Loader';
import * as options from './src/options';
declare function loader(source: any, sourcemap: any): void;
declare module loader {
    type ReplaceResult = Loader.ReplaceResult;
    type LoaderCodeGen = Loader.LoaderCodeGen;
    type RouterLoaderOptions = options.RouterLoaderOptions;
    type RouteResourceOptions = options.RouteResourceOptions;
    /**
     * Add a code generator that can be used in the 'loader' option.
     * @param name
     * @param codeGen
     */
    function setCodeGen(name: string, codeGen: Loader.LoaderCodeGen): void;
}
export = loader;

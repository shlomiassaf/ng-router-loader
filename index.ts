import * as Loader from './src/Loader';
import * as options from './src/options';
import { BUILT_IN_CODEGENS } from './src/builtin_codegens';

function loader(source, sourcemap) {
  this.cacheable && this.cacheable();

  this.async();

  const l = new Loader.Loader(this);

  l.replace(source)
    .then( results => {
      if (results) {
        results.forEach( result => {
          source = result.source;

          if (result.debug) {
            const d = [
              '================================== ng-router-loader ==================================',
              `Importer:    ${this.resourcePath}`,
              `Raw Request: ${result.match}`,
              `Replacement: ${result.replacement}`,
              '======================================================================================'
            ];
            console.log(d.join('\n'));
          }
        });
      }
      this.callback(null, source, sourcemap);
    })
    .catch( err => this.callback(err) );
}

module loader {
  export type ReplaceResult = Loader.ReplaceResult;
  export type LoaderCodeGen = Loader.LoaderCodeGen;
  export type RouterLoaderOptions = options.RouterLoaderOptions;
  export type RouteResourceOptions = options.RouteResourceOptions;

  /**
   * Add a code generator that can be used in the 'loader' option.
   * @param name
   * @param codeGen
   */
  export function setCodeGen(name: string, codeGen: Loader.LoaderCodeGen) {
    Loader.Loader.setCodeGen(name, codeGen);
  }
}

BUILT_IN_CODEGENS.forEach( (cgDef) => Loader.Loader.setCodeGen(cgDef.name, cgDef.codeGen) );

export = loader;

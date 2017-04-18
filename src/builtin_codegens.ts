const recast = require("recast");
const n = recast.types.namedTypes;
const b = recast.types.builders;

import { LoaderCodeGen } from './Loader';
import { RouterLoaderOptions, RouteResourceOptions } from './options';

function getRequireString(file: string, module: string): string {
  return 'require(\'' + file + '\')[\'' + module + '\']';
}

export const syncCodeGen: LoaderCodeGen =
  (file: string, module: string) => `function syncCodeGen() { return ${getRequireString(file, module)}; }`;

export const ensureCodeGen: LoaderCodeGen = (file: string, module: string,
                                             loaderOptions: RouterLoaderOptions,
                                             resourceOptions: RouteResourceOptions) => {
  const requireString = getRequireString(file, module);
  const webpackChunkName = resourceOptions.chunkName ? `, '${resourceOptions.chunkName}'` : '';

  const result = [
    `function ensureCodeGen() { return new Promise(function (resolve) {`,
    `  require.ensure([], function (require) {`,
    `    resolve(${requireString});`,
    `  }${webpackChunkName});`,
    `})}`
  ];

  return result.join('');
};

export const systemCodeGen: LoaderCodeGen = (file: string, module: string, opts: RouterLoaderOptions) => {
  systemCodeGen['deprecated']();
  const result = [
    `function systemCodeGen() { return System.import('${file}')`,
    `.then( function(module) { return module['${module}']; } ); }`
  ];

  return result.join('');
};
systemCodeGen['deprecated'] = () => {
  console.warn('\nDEPRECATED: ng-router-loader "async-system" loader use the System.import construct which is deprecated in webpack 2 and will be removed in webpack 3, please use the "async-import" instead. (https://github.com/webpack/webpack/releases/tag/v2.1.0-beta.28)\n');
  systemCodeGen['deprecated'] = () => {};
};

export const importCodeGen: LoaderCodeGen = (file: string, module: string, opts: RouterLoaderOptions, resourceOptions: RouteResourceOptions) => {
  const webpackChunkName = resourceOptions.chunkName ? ` /* webpackChunkName: "${resourceOptions.chunkName}" */` : '';  

  const result = [
    `function importCodeGen() { return import_('${file}'${webpackChunkName})`,
    `  .then( function(module) { return module['${module}']; } ); }`
  ];

  const fnDec = recast.parse(result.join(''), { ecmaVersion: 5, sourceType: 'script'}).program.body[0];
  n.FunctionDeclaration.assert(fnDec);
  fnDec.body.body[0].argument.callee.object.callee.name = 'import';

  return fnDec;
};


export const BUILT_IN_CODEGENS: Array<{ name: string, codeGen: LoaderCodeGen }> = [
  { name: 'sync', codeGen: syncCodeGen },
  { name: 'async-require', codeGen: ensureCodeGen },
  { name: 'async-import', codeGen: importCodeGen },
  { name: 'async-system', codeGen: systemCodeGen }
];

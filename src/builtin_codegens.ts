import { LoaderCodeGen } from './Loader';
import { RouterLoaderOptions, RouteResourceOptions } from './options';

function getRequireString(file: string, module: string): string {
  return 'require(\'' + file + '\')[\'' + module + '\']';
}

export const syncCodeGen: LoaderCodeGen =
  (file: string, module: string) => `loadChildren: function() { return ${getRequireString(file, module)}; }`;

export const ensureCodeGen: LoaderCodeGen = (file: string, module: string,
                                             loaderOptions: RouterLoaderOptions,
                                             resourceOptions: RouteResourceOptions) => {
  const requireString = getRequireString(file, module);
  const webpackChunkName = resourceOptions.chunkName ? `, '${resourceOptions.chunkName}'` : '';

  const result = [
    `loadChildren: function() { return new Promise(function (resolve) {`,
    `  require.ensure([], function (require) {`,
    `    resolve(${requireString});`,
    `  }${webpackChunkName});`,
    `})}`
  ];

  return loaderOptions.inline ? result.join('') : result.join('\n');
};

export const systemCodeGen: LoaderCodeGen = (file: string, module: string, opts: RouterLoaderOptions) => {
  systemCodeGen['deprecated']();
  const result = [
    `loadChildren: function() { return System.import('${file}')`,
    `.then( function(module) { return module['${module}']; } ); }`
  ];

  return opts.inline ? result.join('') : result.join('\n');
};
systemCodeGen['deprecated'] = () => {
  console.warn('\nDEPRECATED: ng-router-loader "async-system" loader use the System.import construct which is deprecated in webpack 2 and will be removed in webpack 3, please use the "async-import" instead. (https://github.com/webpack/webpack/releases/tag/v2.1.0-beta.28)\n');
  systemCodeGen['deprecated'] = () => {};
};

export const importCodeGen: LoaderCodeGen = (file: string, module: string, opts: RouterLoaderOptions) => {
  const result = [
    `loadChildren: function() { return import('${file}')`,
    `  .then( function(module) { return module['${module}']; } ); }`
  ];

  return opts.inline ? result.join('') : result.join('\n');
};


export const BUILT_IN_CODEGENS: Array<{ name: string, codeGen: LoaderCodeGen }> = [
  { name: 'sync', codeGen: syncCodeGen },
  { name: 'async-require', codeGen: ensureCodeGen },
  { name: 'async-import', codeGen: importCodeGen },
  { name: 'async-system', codeGen: systemCodeGen }
];

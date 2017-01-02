import { LoaderCodeGen } from './Loader';
import { RouterLoaderOptions, RouteResourceOptions } from './options';

function getRequireString(file: string, module: string): string {
  return 'require(\'' + file + '\')[\'' + module + '\']';
}

export const syncCodeGen: LoaderCodeGen =
  (file: string, module: string) => `loadChildren: () => ${getRequireString(file, module)}`;

export const ensureCodeGen: LoaderCodeGen = (file: string, module: string,
                                             loaderOptions: RouterLoaderOptions,
                                             resourceOptions: RouteResourceOptions) => {
  const requireString = getRequireString(file, module);
  const webpackChunkName = resourceOptions.chunkName ? `, '${resourceOptions.chunkName}'` : '';

  const result = [
    `loadChildren: () => new Promise(function (resolve) {`,
    `  (require as any).ensure([], function (require: any) {`,
    `    resolve(${requireString});`,
    `  }${webpackChunkName});`,
    `})`
  ];

  return loaderOptions.inline ? result.join('') : result.join('\n');
};

export const systemCodeGen: LoaderCodeGen = (file: string, module: string, opts: RouterLoaderOptions) => {
  const result = [
    `loadChildren: () => System.import('${file}')`,
    `  .then( (module: any) => module['${module}'] )`
  ];

  return opts.inline ? result.join('') : result.join('\n');
};

export const BUILT_IN_CODEGENS: Array<{ name: string, codeGen: LoaderCodeGen }> = [
  { name: 'sync', codeGen: syncCodeGen },
  { name: 'async-require', codeGen: ensureCodeGen },
  { name: 'async-system', codeGen: systemCodeGen }
];

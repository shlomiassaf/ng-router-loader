import * as Path from 'path';
import { expect } from 'chai';
import '../index'; // this will load the built in code generators.
import * as options from '../src/options';
import { syncCodeGen, ensureCodeGen, systemCodeGen, importCodeGen } from '../src/builtin_codegens';
import { Loader, ReplaceResult } from '../src/Loader';
import { wpFactory, WebpackMockFactory } from './testing/WebpackMock';

function objToKvpString(obj: any): string {
  return Object.keys(obj).map( k => `${k}-${obj[k]}`).join(',');
}

function cwdJoin(...paths: string[]): string {
  return Path.join(process.cwd(), ...paths);
}

function mapToZero(results: ReplaceResult[]): ReplaceResult | undefined {
  return results ? results[0] : undefined;
}

describe('Loader', () => {

  it('should return undefined when source has no string literal children', () => {
    return new Loader(null).replace("")
      .then(mapToZero)
      .then( (result: ReplaceResult) => {
        expect(result).to.be.undefined;
      });
  });

  describe('Options', () => {
    it('should handle empty query by loading default options', () => {
      const loader = wpFactory().resourcePath('/pc/my-project/root-item.ts').toLoader();

      return loader.replace("loadChildren: '../level-1/level-1-item.ts?bySymbol=false'")
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(objToKvpString(loader.query)).to.eql(objToKvpString(options.DEFAULT_OPTIONS));
        });
    });

    it('should use supplied options', () => {
      const loader = wpFactory()
        .setOption('delimiter', '!')
        .setOption('aot', true)
        .setOption('moduleSuffix', 'test')
        .resourcePath(cwdJoin('pc/my-project/root-item.ts'))
        .resolver(cwdJoin('src/@vts/sections/inventory/index.ts'))
        .toLoader();


      return loader.replace("loadChildren: '../level-1/level-1-item.ts?bySymbol=false'")
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(loader.query.delimiter).to.equal('!');
          expect(loader.query.aot).to.equal(true);
          expect(loader.query.moduleSuffix).to.equal('test');
          expect(loader.query.factorySuffix).to.equal(options.DEFAULT_OPTIONS.factorySuffix);
        });
    });
  });

  describe('JIT', () => {

    const factory = wpFactory()
      .setOption('aot', false)
      .setOption('bySymbol', false);

    it('should resolve relative module reference', () => {
      const loader = factory
        .resourcePath(cwdJoin('src/app/app.routes.ts'))
        .resolver(cwdJoin('src/app/module-container/child-module/child.module.ts'))
        .toLoader();

      return loader.replace(`loadChildren: '../module-container/child-module/child.module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('ChildModule');
          expect(result.filePath).to.eql(cwdJoin('src/app/module-container/child-module/child.module'));
        });
    });

    it('should resolve deep relative module reference', () => {
      const loader = factory
        .resourcePath(cwdJoin('src/app/deep/deeper/deeper-still/app.routes.ts'))
        .resolver(cwdJoin('src/new-branch/child-module/child.module.ts'))
        .toLoader();

      return loader.replace(`loadChildren: '../../../../new-branch/child-module/child.module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('ChildModule');
          expect(result.filePath).to.eql(cwdJoin('src/new-branch/child-module/child.module'));
        });
    });

    it('should resolve barrel module reference', () => {
      const loader = factory
        .resourcePath(cwdJoin('src/app/app.routes.ts'))
        .resolver(cwdJoin('src/app/module-container/child-module/index.ts'))
        .toLoader();

      return loader.replace(`loadChildren: 'app/module-container/child-module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('ChildModule');
          expect(result.filePath).to.eql(cwdJoin('src/app/module-container/child-module/index'));
        });
    });
  });

  describe('AOT - With genDir', () => {

    const factory = wpFactory()
      .setOption('aot', true)
      .setOption('bySymbol', false)
      .setOption('genDir', 'compiled');

    it('should resolve relative module reference from compiled code', () => {
      const loader = factory
        .resourcePath(cwdJoin('compiled/src/app/app.routes.ngfactory.ts'))
        .resolver(cwdJoin('src/app/module-container/child-module/child.module.ts'))
        .toLoader();

      return loader.replace(`loadChildren: '../module-container/child-module/child.module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('ChildModuleNgFactory');
          expect(result.filePath).to.eql(cwdJoin('compiled/src/app/module-container/child-module/child.module.ngfactory'));
        });
    });

    it('should resolve relative module reference from source code', () => {
      const loader = factory
        .resourcePath(cwdJoin('src/app/app.routes.ts'))
        .resolver(cwdJoin('src/app/module-container/child-module/child.module.ts'))
        .toLoader();

      return loader.replace(`loadChildren: '../module-container/child-module/child.module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('ChildModuleNgFactory');
          expect(result.filePath).to.eql(cwdJoin('compiled/src/app/module-container/child-module/child.module.ngfactory'));
        });
    });

    it('should resolve deep relative module reference from compiled code', () => {
      const loader = factory
        .resourcePath(cwdJoin('compiled/src/app/deep/deeper/deeper-still/app.routes.ngfactory.ts'))
        .resolver(cwdJoin('src/new-branch/child-module/child.module.ts'))
        .toLoader();

      return loader.replace(`loadChildren: '../../../../new-branch/child-module/child.module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('ChildModuleNgFactory');
          expect(result.filePath).to.eql(cwdJoin('compiled/src/new-branch/child-module/child.module.ngfactory'));
        });
    });

    it('should resolve deep relative module reference from source code', () => {
      const loader = factory
        .resourcePath(cwdJoin('src/app/deep/deeper/deeper-still/app.routes.ts'))
        .resolver(cwdJoin('src/new-branch/child-module/child.module.ts'))
        .toLoader();

      return loader.replace(`loadChildren: '../../../../new-branch/child-module/child.module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('ChildModuleNgFactory');
          expect(result.filePath).to.eql(cwdJoin('compiled/src/new-branch/child-module/child.module.ngfactory'));
        });
    });

    it('should resolve barrel module reference from compiled code', () => {
      const loader = factory
        .resourcePath(cwdJoin('compiled/src/app/app.routes.ngfactory.ts'))
        .resolver(cwdJoin('src/app/module-container/child-module/index.ts'))
        .toLoader();

      return loader.replace(`loadChildren: 'app/module-container/child-module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('ChildModuleNgFactory');
          expect(result.filePath).to.eql(cwdJoin('compiled/src/app/module-container/child-module/index.ngfactory'));
        });
    });

    it('should resolve barrel module reference from source code', () => {
      const loader = factory
        .resourcePath(cwdJoin('src/app/app.routes.ts'))
        .resolver(cwdJoin('src/app/module-container/child-module/index.ts'))
        .toLoader();

      return loader.replace(`loadChildren: 'app/module-container/child-module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('ChildModuleNgFactory');
          expect(result.filePath).to.eql(cwdJoin('compiled/src/app/module-container/child-module/index.ngfactory'));
        });
    });
  });

  describe('AOT - Without genDir', () => {

    const factory = wpFactory()
      .setOption('aot', true)
      .setOption('bySymbol', false)
      .setOption('genDir', '')
      .resolver(cwdJoin('src/app/module-container/child-module/child.module.ts'));

    it('should resolve relative module reference from compiled code', () => {
      const loader = factory
        .resourcePath(cwdJoin('src/app/app.routes.ngfactory.ts'))
        .toLoader();

      return loader.replace(`loadChildren: '../module-container/child-module/child.module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('ChildModuleNgFactory');
          expect(result.filePath).to.eql(cwdJoin('src/app/module-container/child-module/child.module.ngfactory'));
        });
    });

    it('should resolve relative module reference from source code', () => {
      const loader = factory
        .resourcePath(cwdJoin('src/app/app.routes.ts'))
        .toLoader();

      return loader.replace(`loadChildren: '../module-container/child-module/child.module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('ChildModuleNgFactory');
          expect(result.filePath).to.eql(cwdJoin('src/app/module-container/child-module/child.module.ngfactory'));
        });
    });

    it('should resolve deep relative module reference from compiled code', () => {
      const loader = factory
        .resourcePath(cwdJoin('src/app/deep/deeper/deeper-still/app.routes.ngfactory.ts'))
        .resolver(cwdJoin('src/new-branch/child-module/child.module.ts'))
        .toLoader();

      return loader.replace(`loadChildren: '../../../../new-branch/child-module/child.module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('ChildModuleNgFactory');
          expect(result.filePath).to.eql(cwdJoin('src/new-branch/child-module/child.module.ngfactory'));
        });
    });

    it('should resolve deep relative module reference from source code', () => {
      const loader = factory
        .resourcePath(cwdJoin('src/app/deep/deeper/deeper-still/app.routes.ts'))
        .toLoader();

      return loader.replace(`loadChildren: '../../../../new-branch/child-module/child.module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('ChildModuleNgFactory');
          expect(result.filePath).to.eql(cwdJoin('src/new-branch/child-module/child.module.ngfactory'));
        });
    });

    it('should resolve barrel module reference from compiled code', () => {
      const loader = factory
        .resourcePath(cwdJoin('compiled/src/app/app.routes.ngfactory.ts'))
        .resolver(cwdJoin('src/app/module-container/child-module/index.ts'))
        .toLoader();

      return loader.replace(`loadChildren: 'app/module-container/child-module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('ChildModuleNgFactory');
          expect(result.filePath).to.eql(cwdJoin('src/app/module-container/child-module/index.ngfactory'));
        });
    });

    it('should resolve barrel module reference from source code', () => {
      const loader = factory
        .resourcePath(cwdJoin('src/app/app.routes.ts'))
        .toLoader();

      return loader.replace(`loadChildren: 'app/module-container/child-module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('ChildModuleNgFactory');
          expect(result.filePath).to.eql(cwdJoin('src/app/module-container/child-module/index.ngfactory'));
        });
    });
  });

  describe('AOT - bySymbol & genDir', () => {
    const factory = wpFactory()
      .setOption('aot', true)
      .setOption('bySymbol', true)
      .setOption('genDir', '__codegen__')
      .resolver(cwdJoin('test/integration/app/+detail/index.ts'));


    // Using symbol tracking to get the module file.
    // The module "demo/app/app.routes.ts" has a lazy route "./+detail#DetailModule"
    // The "+detail" module is a barrel, it has an "index.ts" file and the lazy route use it (i.e: it does not do "./+detail/index")
    // The index file DOES NOT contain the module itself, the module is in "./+detail/detail.module.ts"...
    // The index file just re-exports it.
    // If the bySymbol option is on the loader will track the file holding the module using the ngsummary JSON files.
    // it will return the module file, not the index file.
    //
    // the lazy route in '/test/integration/app/app.routes.ts' is added to the app.module.ngfactory file created by
    // the compiler, this is why we need to check from compiler code as well.
    it('should resolve relative module reference from compiled code', () => {
      const loader = factory
        .resourcePath(cwdJoin('__codegen__/test/integration/app/app.module.ngfactory.ts'))
        .toLoader();

      return loader.replace(`loadChildren: './+detail#DetailModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('DetailModuleNgFactory');
          expect(result.filePath).to.eql(cwdJoin('__codegen__/test/integration/app/+detail/detail.module.ngfactory'));
        });
    });

    it('should resolve relative module reference from source code', () => {
      const loader = factory
        .resourcePath(cwdJoin('/test/integration/app/app.routes.ts'))
        .toLoader();

      return loader.replace(`loadChildren: './+detail#DetailModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('DetailModuleNgFactory');
          expect(result.filePath).to.eql(cwdJoin('__codegen__/test/integration/app/+detail/detail.module.ngfactory'));
        });
    });

    it('should override bySymbol settings if set in a resource query', () => {
      const loader = factory
        .setOption('bySymbol', false)
        .resourcePath(cwdJoin('/test/integration/app/app.routes.ts'))
        .toLoader();

      return loader.replace(`loadChildren: './+detail#DetailModule?bySymbol=true'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.moduleName).to.equal('DetailModuleNgFactory');
          expect(result.filePath).to.eql(cwdJoin('__codegen__/test/integration/app/+detail/detail.module.ngfactory'));
        });
    });
  });

  describe('Code generators', () => {

    const factory = wpFactory()
      .setOption('aot', false)
      .setOption('bySymbol', false)
      .resourcePath(cwdJoin('src/app/app.routes.ts'))
      .resolver(cwdJoin('src/app/module-container/child-module/index.ts'));


    it('should output sync codegen', () => {
      const loader = factory
        .setOption('loader', 'sync')
        .toLoader();

      return loader.replace(`loadChildren: 'app/module-container/child-module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.replacement).to.eql(syncCodeGen(result.filePath, result.moduleName, loader.query, result.resourceQuery));
        });
    });

    it('should output async-require codegen', () => {
      const loader = factory
        .setOption('loader', 'async-require')
        .toLoader();

      return loader.replace(`loadChildren: 'app/module-container/child-module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.replacement).to.eql(ensureCodeGen(result.filePath, result.moduleName, loader.query, result.resourceQuery));
        });
    });

    it('should output async-system codegen', () => {
      const loader = factory
        .setOption('loader', 'async-system')
        .toLoader();

      return loader.replace(`loadChildren: 'app/module-container/child-module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.replacement).to.eql(systemCodeGen(result.filePath, result.moduleName, loader.query, result.resourceQuery));
        });
    });

    it('should output async-import codegen', () => {
      const loader = factory
        .setOption('loader', 'async-import')
        .toLoader();

      return loader.replace(`loadChildren: 'app/module-container/child-module#ChildModule'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.replacement).to.eql(importCodeGen(result.filePath, result.moduleName, loader.query, result.resourceQuery));
        });
    });


    it('should output a custom codegen', () => {
      const loader = factory.toLoader();
      function custom(file: string, module: string): string {
        return 'This is a test!';
      }

      Loader.setCodeGen('sync-custom', custom);

      return loader.replace(`loadChildren: 'app/module-container/child-module#ChildModule?loader=sync-custom'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          expect(result.replacement).to.eql('This is a test!');
        });
    });

    it('should throw on unknown loader', () => {
      const loader = factory.toLoader();

      return loader.replace(`loadChildren: 'app/module-container/child-module#ChildModule?loader=made-up'`)
        .then(mapToZero)
        .then( (result: ReplaceResult) => {
          throw new Error('Mock error - should not get here');
        })
        .catch( err => {
          expect(err.toString()).to.equal('Error: ng-router-loader - Invalid code generator "made-up"');
        });
    });
  });
});
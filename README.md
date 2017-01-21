
Webpack loader for `NgModule` lazy loading using the angular router


[![Build Status](https://travis-ci.org/shlomiassaf/ng-router-loader.svg?branch=master)](https://travis-ci.org/shlomiassaf/ng-router-loader)
[![GitHub version](https://badge.fury.io/gh/shlomiassaf%2Fng-router-loader.svg)](https://badge.fury.io/gh/shlomiassaf%2Fng-router-loader)

## Installation

`npm install ng-router-loader --save-dev`

OR

`yarn add ng-router-loader --dev`

# V 2.0.0 BREAKING CHANGES:
Version 2.0.0 introduce support for the [import()](https://github.com/tc39/proposal-dynamic-import) construct.  
`import()` is [not yet implemented](https://github.com/Microsoft/TypeScript/issues/12364) in TypeScript. 
TypeScript does not ignore it but transpile it to something else which breaks the code.

To use the `import()` construct the loader must run **AFTER** the typescript transpilation process, 
this is after the `awesome-typescript-loader` in the example below. 

Running after TS also means all code generators now emit ES5 code.

> Webpack 1 users can't use `async-import` as it's not supported in version 1.  
Webpack 2 users can use it as long as they are running on webpack > 2.1.0 beta28

# V 2.1.0 BREAKING CHANGES:
`ng-router-loader` now uses AST to parse the module.  
Using AST provides a more accurate detection of the `loadChildren` property.

## Webpack integration

Add the `ng-router-loader` to your typescript loaders chain

### Webpack 1
```
loaders: [
  {
    test: /\.ts$/,
    loaders: [
       'ng-router-loader',
      'awesome-typescript-loader'
    ]
  }
]
```

### Webpack 2
```
module: {
  rules: [
    {
       test: /\.ts$/,
       use: [
       {
           loader: 'ng-router-loader' 
           options: {
            /* ng-router-loader options */
           }
        } ,
         'awesome-typescript-loader'          
       ]
    }
  ]
}
```

## Lazy Loading
Use the `loadChildren` API with **any webpack resolvable** path to reference your lazy loaded angular module.
Use `#` as a delimiter and write the `NgModule` class name.

```ts
import { Routes } from '@angular/router';

export const ROUTES: Routes = [
  { path: 'detail', loadChildren: () => '../my-ng-modules/details#DetailModule' },
];
```

> The delimiter is configurable.

> Query parameters (details#DetailModule?loader=sync) are added after the delimiter.  
 This behaviour might change, supporting both pre & after. 

## Synchronous Loading
For synchronous module loading, add the sync=true as a query string value to your loadChildren string. The module will be included in your bundle and not lazy-loaded.
```ts
import { Routes } from '@angular/router';

export const ROUTES: Routes = [
  { path: 'detail', loadChildren: () => '../my-ng-modules/details#DetailModule?loader=sync' },
];
```
> The Synchronous example uses a resource specific loader option, you can also set a global loader option.

## Configuration 
Please read [the documentation](https://shlomiassaf.github.io/ng-router-loader)
 
# In detph 
## @angular/router
The `@angular/router` provides an API for deferred `NgModule` loading, this is a simple API that accepts a function that returns an `NgModule` class.

**Project structure**
```
├── project-root/
│   ├── app
│   │   ├── app.routes.ts
│   ├── my-ng-modules
│   │   ├── details
│   │   │   ├──index.ts
│   │   │   ├──details.module.ts
│   │   │   ├──details.component.ts
```

> DetailModule is defined in `details.module.ts` and exported in `index.ts`

**app.routes.ts**
```ts
import { Routes } from '@angular/router';
import { DetailModule } from '../my-ng-modules/details';

export const ROUTES: Routes = [
  { path: 'detail', loadChildren: () => DetailModule },
];
```

The `@angular/router` will not invoke the function until the path is active, this is the how lazy loading is done.
 
## The loader
The example above works just fine but it includes a hard reference to the `DetailModule`. 
Having a reference results in adding the file containing the module into the bundle.
 
To achieve lazy loading we need to write the code in a lazy loading code-style that webpack understand.

`ng-router-loader` abstracts the complexity and provides an easy approach using a string reference.
In the background the loader will translate the string to code. 

The string reference is the reference you use when you `require` or `import`.  
Any string that resolves with `require` or `import` can be used and the same rules apply with 1 addition, the string reference requires must provide the name of the `NgModule` exported.

Using the same example above:

**app.routes.ts**
```ts
import { Routes } from '@angular/router';

export const ROUTES: Routes = [
  { path: 'detail', loadChildren: () => '../my-ng-modules/details#DetailModule' },
];
```

> It's that easy!

## A word about the `angular-router-loader`
The `angular-router-loader` ("ARL" from now) came out with angular final when AOT was still blurry and not enough information was out there.
This made it very limited in it's capabilities, while using it I reached some dead ends that **ARL** did'nt handle.
  
Another issue I had is that **ARL** forced me to structure my app in a certain way which was not webpack oriented. A loader should be transparent to the developer.

I started fixing things and quickly understood that a rewrite is required.

Here are some of the key points:

  - **Module resolution**  
  **ARL** use the file system to resolve URIs, this makes it impossible to use the goodies webpack `resolve` provides, 
  such as **barrels**, **aliasing**, **custom module directories** and more, see [webpack resolve](https://webpack.js.org/configuration/resolve/).  
  `ng-router-loader` uses webpack to resolve modules so everything webpack resolves will work.
  
  - **AOT re-exports**   
  **ARL** can't handle re-exported `NgModule` symbols in AOT mode.  
   The example above shows the `index.ts` file exporting the `DetailModule` defined in a different 
   file, this is a tricky scenario that requires symbol tracking and it will result in an unknown module import created by **ARL**
   `ng-router-loader` performs a deep metadata search to extract the right import.
   
   - **Custom code generators**
   `ng-router-loader` code generation is plugin based, you can provide a custom code generator that fits your use case.
   
   - **Typescript based**
   
## TODO
  [x] Smart detection, use AST to detect ROUTE API.

## Credits

[angular-router-loader](https://github.com/brandonroberts/angular-router-loader)
Learned a lot reading the code!
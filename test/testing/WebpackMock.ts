import { Loader } from '../../src/Loader';
import { RouterLoaderOptions } from '../../index';

export class WebpackMock {
  constructor(private options: RouterLoaderOptions,
              public resourcePath: string,
              private resolver?: string | ((context: string, resourceUri: string) => string) ) { }

  get query(): string {
    const kvp = Object.keys(this.options)
      .map( k => `${k}=${this.options[k]}`)
      .join('&');

    if (kvp) return '?' + kvp;
    return '';
  }

  resolve(context: string, resourceUri: string, cb: (err, fullPath?) => void): void {
    if (typeof this.resolver === 'function') {
      try {
        cb(null, this.resolver(context, resourceUri));
      }
      catch (err) {
        cb(err);
      }
    } else {
      cb(null, this.resolver || '');
    }
  }
}

export class WebpackMockFactory {
  private _meta: any = {
    options: {}
  };

  options(options: RouterLoaderOptions): this {
    this._meta.options = options;
    return this;
  }

  // When going TS 2.1
  // setOption<T extends keyof RouterLoaderOptions>(key: T, value: RouterLoaderOptions[T]): this {
  setOption(key: string, value: any): this {
    this._meta.options[key] = value;
    return this;
  }
  resourcePath(resourcePath: string): this {
    this._meta.resourcePath = resourcePath;
    return this;
  }

  resolver(resolver: string | ((context: string, resourceUri: string) => string)): this {
    this._meta.resolver = resolver;
    return this;
  }

  toWebpack(): WebpackMock {
    return new WebpackMock(
      this._meta.options,
      this._meta.resourcePath,
      this._meta.resolver
    );
  }

  toLoader(): Loader {
    return new Loader(this.toWebpack());
  }
}

export function wpFactory(): WebpackMockFactory {
  return new WebpackMockFactory();
}
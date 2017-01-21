import { Component } from '@angular/core';
/*
 * We're loading this component asynchronously
 * We are using some magic with es6-promise-loader that will wrap the module with a Promise
 * see https://github.com/gdi2290/es6-promise-loader for more info
 */

console.log('`__DETAIL__` component loaded asynchronously');

@Component({
  selector: 'detail',
  template: `
    <h1>Hello from __DETAIL__</h1>
    <router-outlet></router-outlet>
  `
})
export class DetailComponent {
  constructor() {

  }

  ngOnInit() {
    console.log('hello `__DETAIL__` component');
  }

}

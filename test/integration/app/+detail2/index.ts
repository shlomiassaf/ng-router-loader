import { Detail2Module } from "./detail.module";

export function getDetail2() {
  return Detail2Module as any;
}
console.log('`Detail` bundle loaded asynchronously');

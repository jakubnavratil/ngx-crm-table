import { Pipe, PipeTransform } from '@angular/core';

function deepFind(obj: { [K in string]: any }, path: string): any | undefined {
  const paths = path.split('.');
  let current: { [K in string]: any } = obj;
  while (paths.length) {
    const field = paths.shift();
    if (!field) {
      return undefined;
    }

    current = current[field];
    if (current == null) {
      return undefined;
    }
  }

  return current;
}

@Pipe({
  name: 'deepValue',
})
export class DeepValuePipe implements PipeTransform {
  transform(value: object, path: string, ...args: unknown[]): any {
    return deepFind(value, path);
  }
}

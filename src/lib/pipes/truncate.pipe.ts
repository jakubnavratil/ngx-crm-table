import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, length?: string): string {
    const limit = length ? parseInt(length, 10) : 20;
    const trail = '...';
    return value && value.length > limit
      ? value.substring(0, limit) + trail
      : value;
  }
}

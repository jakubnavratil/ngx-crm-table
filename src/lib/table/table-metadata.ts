import { Injectable } from '@angular/core';
import { FilterFieldDirective } from './filter-field.directive';

@Injectable()
export class TableMetadata {
  filterFieldDefsByName = new Map<string, FilterFieldDirective>();
}

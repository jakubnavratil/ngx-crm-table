import { Directive, Input } from '@angular/core';
import { CrudTableService } from './crud-table.service';

interface TableDefTemplateContext<TData, TItem extends object> {
  $implicit: TItem;
  rowIndex: number;
  columnCount: number;
}

@Directive({
  selector: 'ng-template[lsTableDef]',
  standalone: true,
})
export class TableDefDirective<TData> {
  @Input('lsTableDef') service!: CrudTableService<
    any,
    any,
    TData extends { nodes: ReadonlyArray<any> | Array<any> } ? TData : never,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >;

  static ngTemplateContextGuard<
    TContextItem extends { nodes: ReadonlyArray<T> | Array<any> },
    T extends object,
  >(
    dir: TableDefDirective<TContextItem>,
    ctx: unknown,
  ): ctx is TableDefTemplateContext<
    TContextItem,
    TContextItem['nodes'][number]
  > {
    return true;
  }
}

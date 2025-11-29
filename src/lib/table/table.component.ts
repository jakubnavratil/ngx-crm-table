import {
  AfterContentChecked,
  Component,
  ContentChild,
  ContentChildren,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  QueryList,
  TemplateRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ConfirmationService,
  MenuItem,
  MessageService,
  SortMeta,
} from 'primeng/api';
import {
  Table,
  TableBody,
  TableLazyLoadEvent,
  TableRowCollapseEvent,
  TableRowExpandEvent,
} from 'primeng/table';
import { BehaviorSubject, combineLatest, EMPTY, interval } from 'rxjs';
import { map, scan, shareReplay, switchMap, tap } from 'rxjs/operators';
import {
  FilterGroup,
  FilterRuleField,
  FilterRuleType,
  isFilterGroup,
} from '../filter-selector/types';
import { SortDirection, SortField, SortItem } from '../sort-selector/types';
import { CrudColumnDef } from './crud-column-def.directive';
import { CrudTableColumn } from './crud-table-column';
import { CrudTableService } from './crud-table.service';
import { FilterFieldDirective } from './filter-field.directive';
import { normalizeFilter } from './filter-utils';
import { TableMetadata } from './table-metadata';
import { CustomSort } from './types';

interface IDObject {
  id: string | number;
}

type ExpandedScan = [{ [key: string]: boolean }, boolean];
export type TableGroupBy<T> = {
  field: string;
  fn?: (item: T) => any;
};

const orgSortMultiple = Table.prototype.sortMultiple;
Table.prototype.sortMultiple = function () {
  let orig;
  if (this.groupRowsBy != null) {
    orig = this.groupRowsBy;
    this.groupRowsBy = String(orig);
  }
  const result = orgSortMultiple.call(this);
  if (this.groupRowsBy != null) {
    this.groupRowsBy = orig;
  }
  return result;
};

// Fix for PrimeNG 17, fixed in 19
// https://github.com/primefaces/primeng/pull/17368
const origShouldRenderRowGroupHeader =
  TableBody.prototype.shouldRenderRowGroupHeader;
TableBody.prototype.shouldRenderRowGroupHeader = function (
  ...args: Parameters<typeof origShouldRenderRowGroupHeader>
) {
  if (this.dt.expandedRowTemplate) {
    return origShouldRenderRowGroupHeader.call(this, ...args);
  }

  return origShouldRenderRowGroupHeader.call(
    this,
    args[0],
    args[1],
    this.getRowIndex(args[2]),
  );
};

const origShouldRenderRowGroupFooter =
  TableBody.prototype.shouldRenderRowGroupFooter;
TableBody.prototype.shouldRenderRowGroupFooter = function (
  ...args: Parameters<typeof origShouldRenderRowGroupFooter>
) {
  if (this.dt.expandedRowTemplate) {
    return origShouldRenderRowGroupFooter.call(this, ...args);
  }

  return origShouldRenderRowGroupFooter.call(
    this,
    args[0],
    args[1],
    this.getRowIndex(args[2]),
  );
};

@Component({
  selector: 'ls-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  providers: [TableMetadata],
})
export class TableComponent<T extends IDObject>
  implements OnInit, AfterContentChecked
{
  tableMetadata = inject(TableMetadata);

  @ContentChild('headerLeft') headerLeft: TemplateRef<any> | null = null;
  @ContentChild('header') header: TemplateRef<any> | null = null;
  @ContentChild('headerRight') headerRight: TemplateRef<any> | null = null;
  @ContentChild('detailView') detailView: TemplateRef<any> | null = null;
  @ContentChild('detailViewUpdate') detailViewUpdate: TemplateRef<any> | null =
    null;
  @ContentChild('detailViewCreate') detailViewCreate: TemplateRef<any> | null =
    null;
  @ContentChild('tableHeaderCols')
  tableHeaderCols: TemplateRef<any> | null = null;
  @ContentChild('tableBodyCols') tableBodyCols: TemplateRef<any> | null = null;

  @ContentChildren(CrudColumnDef) columnsDefs!: QueryList<CrudColumnDef>;
  private columnDefsByName = new Map<string, CrudColumnDef>();

  @ContentChildren(FilterFieldDirective)
  filterFieldDefs!: QueryList<FilterFieldDirective>;
  filterFieldDefsByName = this.tableMetadata.filterFieldDefsByName;

  private columnsPriv: CrudTableColumn[] = [];

  @ContentChild('expansion') expansionTemplate: TemplateRef<any> | null = null;
  @ContentChild('groupHeader') groupHeaderTemplate: TemplateRef<any> | null =
    null;

  @Input()
  get columns(): CrudTableColumn[] {
    return this.columnsPriv;
  }
  set columns(value: CrudTableColumn[]) {
    this.columnsPriv = value;
    this.sortFields = this.columnsPriv
      .filter((v) => v.sortable !== false)
      .map((v) => {
        return {
          field: v.field,
          label: v.header,
        };
      });
  }

  get columnCount(): number {
    return (
      this.columnsPriv.length +
      (this.selectable ? 1 : 0) +
      (this.expandable ? 1 : 0) +
      (this.fillColumn ? 1 : 0)
    );
  }

  @Input()
  fillColumn = false;

  private _fields?: FilterRuleField[];
  @Input()
  get fields(): FilterRuleField[] {
    if (this._fields == null) {
      this._fields = this.columnsPriv
        .filter((v) => v.filterable !== false)
        .map((v) => {
          const [field, subField] = v.field.split('.');
          return {
            label: v.header,
            field,
            subField,
            type: (v.filterable as FilterRuleType) ?? FilterRuleType.TEXT,
            useInFulltext: v.searchable ?? true,
          };
        });
    }

    return this._fields;
  }
  set fields(value: FilterRuleField[]) {
    this._fields = value;
  }

  sortFields: SortField[] = [];

  @Input()
  label = 'Simple table';

  @Input()
  newRecordLabel = 'Nový záznam';

  @Input()
  detailTypeCreate?: 'sidebar' | 'dialog';

  @Input()
  detailTypeUpdate?: 'sidebar' | 'dialog';

  @Input()
  dialogStyle = { width: '70%', minWidth: '800px' };

  @Input()
  selectable = true;

  @Input()
  expandable = false;

  @Input()
  showExpansionButtons = true;

  @Input()
  canShowRowExpansionButton?: (item: T) => boolean;

  @Input()
  rowHasExpansionItems?: (item: T) => boolean;

  @Input()
  contextMenuEnabled = true;

  @Input()
  defaultActionEnabled = true;

  @Input()
  defaultActionAlwaysVisible = false;

  @Input()
  defaultItemActionIcon = 'pi pi-pencil';

  @Input()
  defaultItemActionClass = '';

  private _staticFilter?: object;
  @Input()
  get staticFilter() {
    return this._staticFilter;
  }
  set staticFilter(value: object | undefined) {
    this._staticFilter = value;
    this.refetch(true);
  }

  @Input()
  disableCreate = false;

  @Input()
  showHeader = true;

  @Input()
  allowFilter = true;

  @Input()
  allowSort = true;

  @Input()
  tableStyleClass = '';

  @Input()
  sidebarStyleClass = '';

  @Input()
  pagingOptions = [25, 75, 200];

  @Input()
  pagingDefault = this.pagingOptions[0];

  private _backendDefaultSortConfig: SortItem[] = [
    { field: 'id', direction: SortDirection.DESC },
  ];
  private _backendDefaultSort: SortItem[] = this._backendDefaultSortConfig;
  @Input()
  public get backendDefaultSort(): SortItem[] {
    return this._backendDefaultSort;
  }
  public set backendDefaultSort(value: SortItem[] | undefined | false) {
    this._backendDefaultSort = this._backendDefaultSortConfig;
    if (value != null) {
      this._backendDefaultSort = value ? value : [];
    }
    this.updateTableSort();
  }

  pGroupRowsBy?: any;
  _groupRowsBy?: TableGroupBy<T>;
  @Input()
  get groupRowsBy() {
    return this._groupRowsBy;
  }
  set groupRowsBy(value: TableGroupBy<T> | string | undefined | null) {
    if (value == null) {
      this._groupRowsBy = undefined;
      return;
    }
    if (typeof value === 'string') {
      this._groupRowsBy = { field: value };
    } else {
      this._groupRowsBy = value;
    }

    this.createPrimeNGGroupRowsBy();
  }

  @Input()
  groupRowsByOrder: SortDirection = SortDirection.ASC;

  createPrimeNGGroupRowsBy() {
    if (this._groupRowsBy == null) {
      return undefined;
    }

    const field = this._groupRowsBy.field;
    const userFn = this._groupRowsBy.fn;

    if (userFn == null) {
      this.pGroupRowsBy = field;
      return;
    }

    const fn = (row: T) => {
      return userFn.call(this, row);
    };
    fn.toString = () => {
      // defined for sorting header
      return field;
    };
    fn.toJSON = () => {
      // defined for sorting query
      return field;
    };

    this.pGroupRowsBy = fn;
  }

  get pGroupRowsByOrder() {
    return this.groupRowsByOrder === SortDirection.ASC ? 1 : -1;
  }

  @Input()
  groupRowsMode?: 'subheader';

  @Input()
  view: 'sidebar' | 'dialog' | 'splitview' = 'sidebar';

  @Input()
  splitviewKey?: string;

  currentPageInfo = $localize`Zobrazeno ${'{first}'} - ${'{last}'} ze ${'{totalRecords}'} záznamů`;

  totalCount = 0;

  loading$ = this.service.loading$;
  networkLoading$ = this.service.networkLoading$;

  selectedRows = [];

  @Output()
  onRowExpand = new EventEmitter<TableRowExpandEvent>();

  @Output()
  onRowCollapse = new EventEmitter<TableRowCollapseEvent>();

  private _showDetail = false;
  get showDetail() {
    return this._showDetail;
  }
  set showDetail(value: boolean) {
    this._showDetail = value;
    if (value == false) {
      this.selectedDetail = undefined;
    }
  }

  selectedDetail?: T;
  contextMenuItem?: T;

  items$ = this.service.fetchData$.pipe(
    // tap((r) => console.log(r)),
    tap((r) => (this.totalCount = r.totalCount)),
    map((result) => [...result.nodes]),
    shareReplay(1),
    takeUntilDestroyed(),
  );

  expandAll$ = new BehaviorSubject(false);

  // keep expanded rows in memory (lost on table refresh)
  expandedRows$ = combineLatest([this.expandAll$, this.items$]).pipe(
    scan(
      ([prevExpandedRows, lastExpandAll], [expandAll, items]) => {
        if (lastExpandAll === true && expandAll === false) {
          return [{}, expandAll] as ExpandedScan;
        }

        const expandedRows: { [key: string]: boolean } = {
          ...prevExpandedRows,
        };
        if (expandAll) {
          items.forEach(
            (item) =>
              (expandedRows[item.id] =
                this.rowHasExpansionItems == null ||
                this.rowHasExpansionItems(item)),
          );
        }
        return [expandedRows, expandAll] as ExpandedScan;
      },
      // Initial state
      [{}, false] as ExpandedScan,
    ),
    map(([expandedRows]) => expandedRows),
  );

  lastEvent?: TableLazyLoadEvent;

  private filterPriv?: FilterGroup;
  get filter(): FilterGroup | undefined {
    return this.filterPriv;
  }
  set filter(v: FilterGroup | undefined) {
    this.filterPriv = v;
    this.refetch(true);
  }

  private sortPriv?: Required<SortItem>[];
  get sort(): Required<SortItem>[] | undefined {
    return this.sortPriv;
  }
  set sort(v: Required<SortItem>[] | undefined) {
    // console.log('sort set', v);
    this.sortPriv = v;
    this.updateTableSort();
  }

  tableSort: SortMeta[] = [];

  private lastFetchFilter?: FilterGroup;
  filterRulesCount = 0;

  private fulltextPriv?: string | null;
  get fulltext(): string | undefined | null {
    return this.fulltextPriv;
  }
  set fulltext(v: string | undefined | null) {
    this.fulltextPriv = v;
    this.refetch();
  }

  isFirstLazyEvent = true;

  tableMenuItems: MenuItem[] = [
    {
      label: $localize`Zobrazit`,
      icon: 'pi pi-fw pi-pencil',
      command: () => {
        if (this.contextMenuItem) {
          this.editRow(this.contextMenuItem);
        }
      },
    },
    {
      label: $localize`Smazat`,
      icon: 'pi pi-fw pi-trash',
      styleClass: 'p-menuitem-danger',
      command: () => {
        if (this.contextMenuItem) {
          this.deleteRow(this.contextMenuItem);
        }
      },
    },
  ];

  private _autoRefetch: false | number = 5 * 1000;
  @Input()
  get autoRefetch(): false | number {
    return this._autoRefetch;
  }
  set autoRefetch(value: false | number) {
    this._autoRefetch = value;
    this.autoRefetchBase$.next(value);
  }

  autoRefetchBase$ = new BehaviorSubject(this._autoRefetch);
  refetchInterval$ = this.autoRefetchBase$.pipe(
    switchMap((base) => {
      if (base === false) {
        return EMPTY;
      }

      return interval(base);
    }),
    takeUntilDestroyed(),
  );

  public viewMenuItems = [
    {
      label: 'Možnosti zobrazení',
      items: [
        {
          label: 'Boční panel',
          icon: 'sidebar',
          command: () => {
            this.view = 'sidebar';
          },
        },
        {
          label: 'Vedle sebe',
          icon: 'splitview',
          command: () => {
            this.view = 'splitview';
          },
        },
        {
          label: 'Vyskakovací okno',
          icon: 'dialog',
          command: () => {
            this.view = 'dialog';
          },
        },
      ],
    },
  ];

  constructor(
    private service: CrudTableService<
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any
    >,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.service.openNewDialog$.subscribe(() => {
      this.openNew();
    });

    this.service.openEditDialog$.subscribe((item: T) => {
      this.editRow(item);
    });

    this.service.closeDialog$.subscribe(() => {
      this.close();
    });

    this.updateTableSort();

    this.refetchInterval$.subscribe(() => {
      this.service.refetchLast();
    });
  }

  ngAfterContentChecked(): void {
    this.columnDefsByName.clear();
    this.columnsDefs.forEach((columnDef) => {
      this.columnDefsByName.set(columnDef.name, columnDef);
    });

    this.filterFieldDefsByName.clear();
    this.filterFieldDefs.forEach((filterFieldDef) => {
      this.filterFieldDefsByName.set(filterFieldDef.name, filterFieldDef);
    });
  }

  getColumnDefByName(name: string) {
    return this.columnDefsByName.get(name);
  }

  updateTableSort() {
    this.tableSort =
      this.sortPriv
        ?.filter(
          <T extends SortItem>(s: T): s is Required<T> => s.field != null,
        )
        .map((s) => ({
          field: s.field,
          order: s.direction === SortDirection.ASC ? 1 : -1,
        })) ?? [];

    // apply default backend sort
    if (this.tableSort.length === 0 && this.backendDefaultSort.length > 0) {
      this.tableSort = this.backendDefaultSort
        ?.filter(
          <T extends SortItem>(s: T): s is Required<T> => s.field != null,
        )
        .map((s) => ({
          field: s.field,
          order: s.direction === SortDirection.ASC ? 1 : -1,
        }));
    }

    if (this._groupRowsBy != null) {
      const colName = this._groupRowsBy.field;
      if (this.tableSort.length === 0 || this.tableSort[0]?.field !== colName) {
        this.tableSort = [
          {
            field: colName,
            order: this.groupRowsByOrder === SortDirection.ASC ? 1 : -1,
          },
          ...this.tableSort,
        ];
      }
    }
  }

  isColumnSortable(col: CrudTableColumn) {
    if (col.sortable !== false && this.allowSort) {
      return true;
    }

    return this.backendDefaultSort.some((s) => s.field === col.field);
  }

  lazyLoad(event: TableLazyLoadEvent): void {
    this.lastEvent = event;

    if (!this.isFirstLazyEvent) {
      // clicked on backend sort column with disabled sorting
      // ignore user input and reset table icon by reseting table sort
      if (!this.allowSort) {
        this.tableSort = [...this.tableSort];
        return;
      }

      // handle event from table (paging) with only backend sort
      // dont update sort array - hiden on
      if (
        this.backendDefaultSort.length &&
        event.multiSortMeta &&
        event.multiSortMeta.length === this.backendDefaultSort.length &&
        event.multiSortMeta.every(
          (s, i) =>
            s.field === this.backendDefaultSort[i]?.field &&
            s.order ===
              (this.backendDefaultSort[i]?.direction === SortDirection.ASC
                ? 1
                : -1),
        )
      ) {
        if (this.sort?.length) {
          console.log('resetting sort');
          this.sortPriv = undefined;
        }

        this.refetch();
        return;
      }
    }

    const sort: Required<SortItem>[] = [];
    if (event.sortField && event.sortOrder) {
      const fields = Array.isArray(event.sortField)
        ? event.sortField
        : [event.sortField];
      for (const sortField of fields) {
        sort.push({
          field: sortField,
          direction:
            event.sortOrder > 0 ? SortDirection.ASC : SortDirection.DESC,
        });
      }
    } else if (event.multiSortMeta) {
      for (const metaSort of event.multiSortMeta) {
        sort.push({
          field: metaSort.field,
          direction:
            metaSort.order > 0 ? SortDirection.ASC : SortDirection.DESC,
        });
      }
    }

    // update sort only on change, so it does not trigger rewrite to sort selector
    if (
      (this.isFirstLazyEvent === false || this._groupRowsBy != null) &&
      (this.sort == null ||
        this.sort.length != sort.length ||
        this.sort.some(
          (s, i) =>
            s.field !== sort[i].field || s.direction !== sort[i].direction,
        ))
    ) {
      // console.log('sort set from table', sort);
      this.sortPriv = sort;
    }

    if (this.isFirstLazyEvent) {
      this.isFirstLazyEvent = false;
    }

    this.refetch();
  }

  resetFilter(): void {
    this.filter = { and: [{}] };
  }

  resetSort(): void {
    this.sort = [];
  }

  refetch(checkFilter = false, checkSort = false): void {
    if (!this.lastEvent) {
      return;
    }

    const event = this.lastEvent;
    const customSort: CustomSort[] =
      this.sort?.map((s) => ({ field: s.field, order: s.direction })) ?? [];

    if (!customSort.length) {
      customSort.push({
        field: 'id',
        order: 'DESC',
      });
    }

    // put together
    // staticFilter, userFilter and fulltextFilter
    const compositeFilter: FilterGroup = {
      and: [],
    };

    if (this.staticFilter != null) {
      compositeFilter.and?.push(this.staticFilter);
    }

    const userFilter = normalizeFilter(this.filter, this.fields);
    if (userFilter != null) {
      compositeFilter.and?.push(userFilter);
    }

    if (this.fulltext != null && this.fulltext !== '') {
      const comparator = { like: `%${this.fulltext}%` };
      const fulltextFilter: FilterGroup = {
        or: [
          ...this.fields
            .filter((f) => f.type === FilterRuleType.TEXT && f.useInFulltext)
            .map((f) => {
              const val = f.subField
                ? { [f.subField]: comparator }
                : comparator;
              return {
                [f.field]: val,
              };
            }),
        ],
      };
      compositeFilter.and?.push(fulltextFilter);
    }

    const useFilter = compositeFilter.and?.length ? compositeFilter : {};
    if (
      checkFilter &&
      JSON.stringify(useFilter) === JSON.stringify(this.lastFetchFilter)
    ) {
      return;
    }
    this.lastFetchFilter = useFilter;
    this.filterRulesCount = this.countFilterRules(userFilter);
    this.service.fetch({
      filter: useFilter,
      paging: { offset: event.first, limit: event.rows },
      sorting: [], // not used
      customSort,
    });
  }

  countFilterRules(filter: FilterGroup | null): number {
    if (filter == null) {
      return 0;
    }

    const list = 'and' in filter ? filter.and : 'or' in filter ? filter.or : [];
    if (list == null) {
      return 0;
    }

    let sum = 0;
    for (const item of list) {
      if (isFilterGroup(item)) {
        sum += this.countFilterRules(item);
      } else {
        sum++;
      }
    }
    return sum;
  }

  openNew(): void {
    this.showDetail = true;
    this.selectedDetail = undefined;
  }

  close(): void {
    this.showDetail = false;
  }

  editRow(item: T): void {
    this.showDetail = true;
    this.selectedDetail = item;
  }

  resetSelectedRows(): void {
    this.selectedRows = [];
  }

  expandAll() {
    this.expandAll$.next(true);
  }

  collapseAll() {
    this.expandAll$.next(false);
  }

  onRowExpanded(event: TableRowExpandEvent) {
    this.onRowExpand.emit(event);
  }

  onRowCollapsed(event: TableRowCollapseEvent) {
    this.onRowCollapse.emit(event);
  }

  deleteRow(item: T): void {
    this.deleteSelectedRows();
  }

  deleteSelectedRows(): void {
    this.confirmationService.confirm({
      message: 'Opravdu chcete smazat vybrané záznamy?',
      header: 'Smazat?',
      icon: 'pi pi-exclamation-triangle text-red-500',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text p-button-plain',
      acceptLabel: 'Smazat',
      rejectLabel: 'Zrušit',
      defaultFocus: 'reject',
      accept: () => {
        // this.products = this.products.filter(val => !this.selectedProducts.includes(val));
        // this.selectedProducts = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Záznamy smazány',
          life: 3000,
        });
      },
    });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SortDirection, SortField, SortItem, SortOrder } from '../types';

@Component({
  selector: 'ls-sort-selector-item',
  templateUrl: './sort-selector-item.component.html',
  styleUrls: ['./sort-selector-item.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SortSelectorItemComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortSelectorItemComponent implements OnInit, ControlValueAccessor {
  @Input()
  fields?: SortField[];

  @Output()
  remove = new EventEmitter();

  private selectedFieldPriv?: SortField;
  get selectedField(): SortField | undefined {
    return this.selectedFieldPriv;
  }
  set selectedField(field: SortField | undefined) {
    if (field == null) {
      return;
    }

    this.selectedFieldPriv = field;
    this.updateSort();
  }

  private selectedOrderPriv?: SortDirection;
  get selectedOrder(): SortDirection | undefined {
    return this.selectedOrderPriv;
  }
  set selectedOrder(order: SortDirection | undefined) {
    if (order == null) {
      return;
    }

    this.selectedOrderPriv = order;
    this.updateSort();
  }

  orders: SortOrder[] = [
    {
      label: $localize`Vzestupně`,
      value: SortDirection.ASC,
      icon: 'pi-sort-amount-up-alt',
    },
    {
      label: $localize`Sestupně`,
      value: SortDirection.DESC,
      icon: 'pi-sort-amount-down-alt',
    },
  ];

  sort?: SortItem;

  onChange?: (_: SortItem) => void;
  onTouched?: () => void;

  constructor() {}

  ngOnInit(): void {}

  writeValue(value: SortItem): void {
    if (value == null) {
      return;
    }

    this.sort = value;
    if (value.field) {
      this.selectedFieldPriv = this.fields?.find(
        (f) => f.field === value.field
      );
    }
    this.selectedOrderPriv = value.direction;
  }

  registerOnChange(fn: (_: SortItem) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  updateSort(): void {
    if (this.selectedField == null || this.selectedOrder == null) {
      return;
    }

    const field = this.selectedField.field;
    const direction = this.selectedOrder;
    if (
      this.sort != null &&
      this.sort.field === field &&
      this.sort.direction === direction
    ) {
      return;
    }

    this.sort = {
      field,
      direction,
    };
    this.onChange?.(this.sort);
  }
}

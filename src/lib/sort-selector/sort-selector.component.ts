import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  Input,
  OnInit,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SortDirection, SortField, SortItem } from './types';

interface SortItemContainer {
  item: SortItem;
}

@Component({
  selector: 'ls-sort-selector',
  templateUrl: './sort-selector.component.html',
  styleUrls: ['./sort-selector.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SortSelectorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortSelectorComponent implements OnInit, ControlValueAccessor {
  @Input()
  fields?: SortField[];

  itemContainers: SortItemContainer[] = [];

  sort: SortItem[] = [];

  onChange?: (_: SortItem[]) => void;
  onTouched?: () => void;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  writeValue(sort: SortItem[] | null): void {
    if (sort == null || this.sort === sort) {
      return;
    }

    this.sort = sort;
    this.itemContainers = sort.map((item) => ({
      item: {
        field: item.field,
        direction: item.direction,
      },
    }));
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (_: SortItem[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  updateSort(): void {
    this.sort = this.itemContainers.map((c) => c.item);

    console.log('calling on change', this.sort);
    this.onChange?.(this.sort);
  }

  addItem(): void {
    this.itemContainers.push({
      item: {
        direction: SortDirection.ASC,
      },
    });
  }

  removeItem(item: SortItemContainer): void {
    this.itemContainers.splice(this.itemContainers.indexOf(item), 1);
    this.itemContainers = [...this.itemContainers];
    this.updateSort();
  }
}

import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  FilterGroup,
  FilterGroupListItem,
  FilterGroupOperator,
  FilterItem,
  FilterItemGroup,
  FilterItemRule,
  FilterRule,
  FilterRuleField,
  isFilterGroup,
} from '../types';

@Component({
  selector: 'ls-filter-selector-group',
  templateUrl: './filter-selector-group.component.html',
  styleUrls: ['./filter-selector-group.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FilterSelectorGroupComponent),
      multi: true,
    },
  ],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterSelectorGroupComponent
  implements OnInit, ControlValueAccessor
{
  @Input()
  fields?: FilterRuleField[];

  @Output()
  remove = new EventEmitter();

  conditions = [
    { label: $localize`Vše ( AND )`, value: 'and', styleClass: 'p-button-sm' },
    { label: $localize`Něco ( OR )`, value: 'or', styleClass: 'p-button-sm' },
  ];

  private selectedConditionPrivate: FilterGroupOperator = 'and';
  get selectedCondition(): FilterGroupOperator {
    return this.selectedConditionPrivate;
  }
  set selectedCondition(condition: FilterGroupOperator) {
    this.selectedConditionPrivate = condition;
    this.updateFilter();
  }

  filter: FilterGroup = { and: [{}] };

  items: FilterItem[] = this.filterListToFilterItems(this.filter);

  onChange?: (_: FilterGroup) => void;
  onTouched?: () => void;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  private filterListToFilterItems(filterGroup: FilterGroup): FilterItem[] {
    const filterList =
      ('or' in filterGroup
        ? filterGroup.or
        : 'and' in filterGroup
          ? filterGroup.and
          : []) ?? [];
    return filterList.map((filter) => {
      if (isFilterGroup(filter)) {
        const item: FilterItemGroup = {
          type: 'group',
          filter,
        };
        return item;
      } else {
        const item: FilterItemRule = {
          type: 'rule',
          filter,
        };
        return item;
      }
    });
  }

  updateFilter(): void {
    const condition = this.selectedCondition;
    const filterItems: FilterGroupListItem[] = this.items.map(
      (item) => item.filter,
    );
    this.filter =
      condition === 'and' ? { and: filterItems } : { or: filterItems };
    this.onChange?.(this.filter);
  }

  writeValue(value: FilterGroup): void {
    // https://github.com/angular/angular/issues/14988
    if (value == null || value === this.filter) {
      return;
    }

    this.filter = value;
    this.items = this.filterListToFilterItems(value);
    this.selectedConditionPrivate = 'or' in value ? 'or' : 'and';
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (_: FilterGroup) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  addRule(): void {
    const rule: FilterRule = {};
    this.items.push({
      type: 'rule',
      filter: rule,
    });
    this.updateFilter();
  }

  addGroup(): void {
    const group: FilterGroup = { and: [{}] };
    this.items.push({
      type: 'group',
      filter: group,
    });
    this.updateFilter();
  }

  changeItemFilter(): void {
    this.updateFilter();
  }

  removeItem(item: FilterItem): void {
    this.items.splice(this.items.indexOf(item), 1);
    this.items = [...this.items];
    this.updateFilter();
  }
}

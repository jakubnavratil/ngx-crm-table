import { Directive, Input, TemplateRef, booleanAttribute } from '@angular/core';
import { FilterOperator } from '../filter-selector/types';

interface TableRowTemplateContext {
  $implicit: any;
  updateValue: (value: any) => void;
}

@Directive({
  selector: '[filterField]',
  standalone: true,
})
export class FilterFieldDirective {
  constructor(public template: TemplateRef<any>) {}

  static ngTemplateContextGuard(
    dir: FilterFieldDirective,
    ctx: unknown,
  ): ctx is TableRowTemplateContext {
    return true;
  }

  @Input('filterField')
  name!: string;

  @Input({ transform: booleanAttribute })
  disableOperators = false;

  @Input()
  forceOperator?: FilterOperator;

  @Input({ transform: booleanAttribute })
  disableUpdateDebounce = false;

  @Input()
  valueToRuleValue?: (value: any) => any;

  @Input()
  ruleValueToValue?: (ruleValue: any) => any;
}

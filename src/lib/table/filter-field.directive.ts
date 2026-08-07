import { Directive, Input, TemplateRef, booleanAttribute } from '@angular/core';
import {
  FilterGroup,
  FilterOperator,
  FilterRule,
  FilterRuleField,
} from '../filter-selector/types';

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

  /**
   * Builds the whole filter rule instead of just its value.
   *
   * `valueToRuleValue` can only rewrite the value inside a single comparator,
   * which is enough to swap one displayed value for several stored ones. Use
   * this when a choice needs a different shape altogether - a negation, or
   * several conditions OR-ed together, e.g. "everything not in this list, or
   * not set at all".
   *
   * Return null to clear the rule. Takes precedence over `valueToRuleValue`.
   */
  @Input()
  valueToRule?: (
    value: any,
    field: FilterRuleField,
  ) => FilterRule | FilterGroup | null;

  /**
   * Inverse of `valueToRule`, used to restore the control from a stored rule.
   *
   * Return null/undefined if the rule is not one this field produced - the
   * filter component tries each configured field in turn.
   */
  @Input()
  ruleToValue?: (rule: FilterRule | FilterGroup) => any;
}

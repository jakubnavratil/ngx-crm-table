import {
  Component,
  EventEmitter,
  forwardRef,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { Subject, Subscription } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { TableMetadata } from "../../table/table-metadata";
import {
  FilterComparator,
  FilterOperator,
  FilterRule,
  FilterRuleField,
  FilterRuleSimple,
  FilterRuleType,
} from "../types";

interface FilterRuleOperator {
  label: string;
  operator: FilterOperator;
  valueHidden?: true;
  default?: true;
}

interface FieldOperatorCombination {
  type: FilterRuleType;
  operators: FilterRuleOperator[];
}

@Component({
  selector: "ls-filter-selector-rule",
  templateUrl: "./filter-selector-rule.component.html",
  styleUrls: ["./filter-selector-rule.component.scss"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FilterSelectorRuleComponent),
      multi: true,
    },
  ],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterSelectorRuleComponent
  implements OnInit, OnDestroy, ControlValueAccessor
{
  tableMetadata = inject(TableMetadata);

  @Input()
  fields?: FilterRuleField[];

  @Output()
  remove = new EventEmitter();

  private selectedFieldPriv?: FilterRuleField;
  get selectedField(): FilterRuleField | undefined {
    return this.selectedFieldPriv;
  }
  set selectedField(field: FilterRuleField | undefined) {
    this.selectedFieldPriv = field;
    this.valuePriv = null;
    if (field != null) {
      this.operators =
        this.fieldOperators.find((f) => f.type === field.type)?.operators ?? [];

      // if (this.selectedOperatorPriv == null) {
      this.selectedOperatorPriv =
        this.operators.find((o) => o.default) ?? this.operators[0];
      // }
    }
    this.updateRule();
  }

  get selectedFieldConfig() {
    if (this.selectedField == null) {
      return null;
    }

    return this.tableMetadata.filterFieldDefsByName.get(
      this.selectedField.field
    );
  }

  operators: FilterRuleOperator[] = [];

  fieldOperators: FieldOperatorCombination[] = [
    {
      type: FilterRuleType.TEXT,
      operators: [
        { label: "je vyplněný", operator: "isNot", valueHidden: true },
        { label: "je prázdný", operator: "is", valueHidden: true },
        { label: "obsahuje", operator: "contains", default: true },
        { label: "neobsahuje", operator: "notContains" },
        { label: "začíná na", operator: "startsWith" },
        { label: "končí na", operator: "endsWith" },
        { label: "je", operator: "equals" },
        { label: "není", operator: "equals" },

        // in: [String!]
        // notIn: [String!]
        // TODO: empty
      ],
    },
    {
      type: FilterRuleType.BOOLEAN,
      operators: [
        { label: "je", operator: "is", default: true },
        // { label: 'není', operator: 'isNot' },
        // TODO: empty
      ],
    },
    {
      type: FilterRuleType.NUMBER,
      operators: [
        { label: "je rovno", operator: "equals", default: true },
        { label: "není rovno", operator: "notEquals" },
        { label: "větší než", operator: "gt" },
        { label: "větší nebo rovno", operator: "gte" },
        { label: "menší než", operator: "lt" },
        { label: "menší nebo rovno", operator: "lte" },

        // between: IntFieldComparisonBetween
        // notBetween: IntFieldComparisonBetween
        // in: [Int!]
        // notIn: [Int!]
        // TODO: empty
      ],
    },
    {
      type: FilterRuleType.DATE,
      operators: [
        { label: "dne", operator: "dateIs", default: true },
        { label: "je rovno", operator: "equals" },
        { label: "není rovno", operator: "notEquals" },
        { label: "větší než", operator: "gt" },
        { label: "větší nebo rovno", operator: "gte" },
        { label: "menší než", operator: "lt" },
        { label: "menší nebo rovno", operator: "lte" },

        // between: DateFieldComparisonBetween
        // notBetween: DateFieldComparisonBetween
        // in: [DateTime!]
        // notIn: [DateTime!]
        // TODO: empty
      ],
    },
  ];

  private selectedOperatorPriv?: FilterRuleOperator;
  get selectedOperator(): FilterRuleOperator | undefined {
    return this.selectedOperatorPriv;
  }
  set selectedOperator(field: FilterRuleOperator | undefined) {
    this.selectedOperatorPriv = field;
    this.updateRule();
  }

  private valuePriv?: any;
  get value(): any {
    return this.valuePriv;
  }
  set value(value: any) {
    this.valuePriv = value;
    this.valueChange$.next();
  }

  private valueChange$ = new Subject<void>();
  private valueChangeSubscription?: Subscription;

  updateValue!: (value: any) => void;
  valueToRuleValue = (value: any) => {
    return value;
  };

  ruleValueToValue = (ruleValue: any) => {
    return ruleValue;
  };

  rule: FilterRule = {};
  FilterRuleType = FilterRuleType;

  booleanOptions = [
    { label: "Ano", value: true },
    { label: "Ne", value: false },
  ];

  onChange?: (_: FilterRule) => void;
  onTouched?: () => void;

  ngOnInit(): void {
    this.updateValue = (value: any) => {
      this.valuePriv = value;

      if (this.selectedFieldConfig?.disableUpdateDebounce === true) {
        this.updateRule();
        return;
      }

      this.valueChange$.next();
    };

    this.valueChangeSubscription = this.valueChange$
      .pipe(debounceTime(500))
      .subscribe(() => this.updateRule());
  }

  ngOnDestroy(): void {
    if (this.valueChangeSubscription) {
      this.valueChangeSubscription.unsubscribe();
    }
  }

  updateRule(): void {
    const field = this.selectedField;
    const operator = this.selectedOperator;
    let value = this.value;
    value = (
      this.selectedFieldConfig?.valueToRuleValue ?? this.valueToRuleValue
    )(value);
    // const valueIsEmpty = value == null || value === '';

    if (
      field &&
      operator &&
      // prazdne pole ignoruje
      (!Array.isArray(value) || value.length)
      // && (!valueIsEmpty ||
      //   operator.operator === 'isEmpty' ||
      //   operator.operator === 'isNotEmpty')
    ) {
      let ruleOperator = operator.operator;
      if (this.selectedFieldConfig?.forceOperator != null) {
        ruleOperator = this.selectedFieldConfig.forceOperator;
      }
      // if (ruleOperator === 'isEmpty') {
      //   ruleOperator = 'is';
      //   value = null;
      // } else if (ruleOperator === 'isNotEmpty') {
      //   ruleOperator = 'isNot';
      //   value = null;
      // }

      if (
        this.selectedField?.type === FilterRuleType.BOOLEAN &&
        value == null
      ) {
        this.rule = {};
        return;
      }

      if (ruleOperator === "in" && value == null) {
        this.rule = {};
        return;
      }

      const comparator: FilterComparator = {
        [ruleOperator]: value,
      };
      this.rule = {
        [field.field]:
          field.subField != null
            ? { [field.subField]: comparator }
            : comparator,
      };
    } else {
      this.rule = {};
    }
    this.onChange?.(this.rule);
  }

  writeValue(value: FilterRule): void {
    // https://github.com/angular/angular/issues/14988
    if (value == null || value === this.rule) {
      return;
    }

    const fieldName = Object.keys(value).shift();
    if (!fieldName) {
      return;
    }

    const fields = this.fields?.filter((f) => f.field === fieldName);
    if (fields == null || fields.length === 0) {
      return;
    }

    // test all fields for relation
    const relationOrComparator: FilterComparator | FilterRuleSimple =
      value[fieldName];
    let comparator: FilterComparator | undefined;
    let field: FilterRuleField | undefined = undefined;
    for (const _field of fields) {
      if (
        _field.subField != null &&
        this.isRelationRule(relationOrComparator, _field.subField)
      ) {
        comparator = relationOrComparator[_field.subField];
        field = _field;
        break;
      }
    }

    if (comparator == null) {
      comparator = relationOrComparator;
    }

    if (field == null) {
      field = fields[0];
    }

    const operator = Object.keys(comparator).shift() as
      | keyof FilterComparator
      | undefined;
    if (!operator) {
      return;
    }

    this.selectedFieldPriv = field;
    this.operators =
      this.fieldOperators.find((f) => f.type === field?.type)?.operators ?? [];
    this.selectedOperatorPriv = this.operators.find(
      (o) => o.operator === operator
    );
    if (this.selectedOperatorPriv == null) {
      this.selectedOperatorPriv =
        this.operators.find((o) => o.default) ?? this.operators[0];
    }
    this.valuePriv = (
      this.selectedFieldConfig?.ruleValueToValue ?? this.ruleValueToValue
    )(comparator[operator]);
  }

  isRelationRule(
    rule: FilterComparator | FilterRuleSimple,
    subfield: string | undefined
  ): rule is FilterRuleSimple {
    return subfield != null && subfield in rule;
  }

  registerOnChange(fn: (_: FilterRule) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}

import { FilterMatchMode } from 'primeng/api';

export interface FilterItemGroup {
  type: 'group';
  filter: FilterGroup;
}
export interface FilterItemRule {
  type: 'rule';
  filter: FilterRule;
}
export type FilterItem = FilterItemGroup | FilterItemRule;
export type FilterGroupListItem = FilterGroup | FilterRule;

export type FilterGroup = FilterGroupAnd | FilterGroupOr;
export interface FilterGroupAnd {
  and?: FilterGroupListItem[];
}
export interface FilterGroupOr {
  or?: FilterGroupListItem[];
}
export interface FilterRule {
  [K: string]: FilterComparator | FilterRuleSimple;
}
export interface FilterRuleSimple {
  [K: string]: FilterRule;
}
export type FilterGroupOperator = 'or' | 'and';

type onlyString<T, K extends keyof T> = T[K] extends string ? T[K] : never;
export type FilterOperator = keyof {
  [K in keyof typeof FilterMatchMode as onlyString<
    typeof FilterMatchMode,
    K
  >]: (typeof FilterMatchMode)[K];
};
export type FilterComparator = {
  -readonly [K in FilterOperator]?: any;
};

export enum FilterRuleType {
  TEXT = 'text', // rovna, nerovna, obsahuje, neobsahuje, zacina, konci, null, not null
  DATE = 'date', // rovna, nerovna, vetsi, mensi, null, not null
  NUMBER = 'numeric', // rovna, nerovna, vetis, mensi, null, not null
  BOOLEAN = 'boolean', // ano / ne
}
export interface FilterRuleField {
  field: string;
  subField?: string;
  label: string;
  type: FilterRuleType;
  selectField?: string;
  selectOptions?: FilterRuleFieldSelectOption[];
  useInFulltext: boolean;
}
export interface FilterRuleFieldSelectOption {
  value: string | number;
  label: string;
}

export function isFilterGroup(
  filterListItem: FilterGroupListItem,
): filterListItem is FilterGroup {
  return 'and' in filterListItem || 'or' in filterListItem;
}

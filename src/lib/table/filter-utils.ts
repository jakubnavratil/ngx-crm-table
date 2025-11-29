import {
  FilterComparator,
  FilterGroup,
  FilterGroupListItem,
  FilterOperator,
  FilterRule,
  FilterRuleField,
  FilterRuleType,
  isFilterGroup,
} from '../filter-selector/types';

const QUERY_COMPARATORS: {
  [K in FilterRuleType]: {
    [K in FilterOperator]?: (value: any) => { [K: string]: any } | null;
  };
} = {
  [FilterRuleType.TEXT]: {
    contains: (value: string | null) => ({ like: `%${value ?? ''}%` }),
    notContains: (value: string | null) => ({ notLike: `%${value ?? ''}%` }),
    startsWith: (value: string | null) => ({ like: `${value ?? ''}%` }),
    endsWith: (value: string | null) => ({ like: `%${value ?? ''}` }),
    equals: (value: string | null) => ({ eq: value ?? '' }),
    notEquals: (value: string | null) => ({ neq: value ?? '' }),
    is: (value: string | null) => ({ is: null }),
    isNot: (value: string | null) => ({ isNot: null }),
  },
  [FilterRuleType.BOOLEAN]: {
    is: (value: boolean) => ({ is: value }),
    isNot: (value: boolean) => ({ isNot: value }),
  },
  [FilterRuleType.NUMBER]: {
    // between: (value: number) => ({ between: [value, value] }),
    // notBetween: (value: number) => ({ notBetween: [value, value] }),
    equals: (value: number) => (value == null ? null : { eq: value }),
    notEquals: (value: number) => (value == null ? null : { neq: value }),
    gt: (value: number) => (value == null ? null : { gt: value }),
    gte: (value: number) => (value == null ? null : { gte: value }),
    lt: (value: number) => (value == null ? null : { lt: value }),
    lte: (value: number) => (value == null ? null : { lte: value }),
  },
  [FilterRuleType.DATE]: {
    // between: (value: Date) => ({ between: [value, value] }),
    // notBetween: (value: Date) => ({ notBetween: [value, value] }),
    dateIs: (value: Date) => {
      if (value == null) {
        return null;
      }

      return {
        between: {
          lower: value,
          upper: new Date(value.getTime() + 24 * 60 * 60 * 1000),
        },
      };
    },
    equals: (value: Date) => (value == null ? null : { eq: value }),
    notEquals: (value: Date) => (value == null ? null : { neq: value }),
    gt: (value: Date) => (value == null ? null : { gt: value }),
    gte: (value: Date) => (value == null ? null : { gte: value }),
    lt: (value: Date) => (value == null ? null : { lt: value }),
    lte: (value: Date) => (value == null ? null : { lte: value }),
  },
};

export function isFilterItemEmpty(item: FilterGroupListItem): boolean {
  return !Object.keys(item).length;
}

export function normalizeRule(
  rule: FilterRule,
  fields: FilterRuleField[],
): { [K: string]: any } | null {
  const fieldName = Object.keys(rule).shift();
  if (!fieldName) {
    return null;
  }

  const ruleOrComparator = rule[fieldName];
  if (isComparator(ruleOrComparator)) {
    const normComp = normalizeComparator(ruleOrComparator, [fieldName], fields);
    if (normComp == null) {
      return null;
    }

    return {
      [fieldName]: normComp,
    };
  } else {
    const subFieldName = Object.keys(ruleOrComparator).shift();
    if (subFieldName) {
      const normComp = normalizeComparator(
        ruleOrComparator[subFieldName],
        [fieldName, subFieldName],
        fields,
      );
      if (normComp == null) {
        return null;
      }

      return {
        [fieldName]: {
          [subFieldName]: normComp,
        },
      };
    }
  }

  return null;
}

export function normalizeComparator(
  comparator: FilterComparator,
  fieldNames: string[],
  fields: FilterRuleField[],
): { [K: string]: any } | null {
  const field = fields.find(
    (f) =>
      f.field === fieldNames[0] &&
      (fieldNames.length === 1 || f.subField === fieldNames[1]),
  );
  if (field == null) {
    throw new Error('Filtrable field not found:' + fieldNames.join('.'));
  }

  const operator = Object.keys(comparator).shift() as keyof FilterComparator;
  if (operator) {
    const value = comparator[operator];
    const comparison = QUERY_COMPARATORS[field.type]?.[operator]?.(value);

    // cancel rule if comparison is null
    if (comparison === null) {
      return null;
    }

    if (comparison) {
      return comparison;
    }
  }

  return comparator;
}

export function isComparator(
  ruleOrComparator: FilterRule | FilterComparator,
): ruleOrComparator is FilterComparator {
  const subfieldNameOrOperator = Object.keys(ruleOrComparator).shift();
  if (!subfieldNameOrOperator) {
    return false;
  }

  const value = (ruleOrComparator as any)[subfieldNameOrOperator];
  return (
    typeof value !== 'object' ||
    Array.isArray(value) ||
    value == null ||
    value instanceof Date
  );
}

export function normalizeFilter(
  group: FilterGroup | undefined,
  fields: FilterRuleField[],
): FilterGroup | null {
  if (group == null) {
    return null;
  }

  const list = 'and' in group ? group.and : 'or' in group ? group.or : [];
  if (list == null || !list.length) {
    return null;
  }

  const normalizedList = list
    .map((i) => {
      if (isFilterGroup(i)) {
        const normalizedGroup = normalizeFilter(i, fields);
        return normalizedGroup == null || isFilterItemEmpty(normalizedGroup)
          ? null
          : normalizedGroup;
      } else {
        return isFilterItemEmpty(i) ? null : normalizeRule(i, fields);
      }
    })
    .filter(<T>(i: T): i is Exclude<T, null> => i !== null);

  if (!normalizedList.length) {
    return null;
  }

  if ('and' in group) {
    return { and: normalizedList };
  } else {
    return { or: normalizedList };
  }
}

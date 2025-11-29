export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface SortOrder {
  label: string;
  value: SortDirection;
  icon: string;
}

export interface SortItem {
  field?: string;
  direction: SortDirection;
}

export interface SortField {
  field: string;
  label: string;
}

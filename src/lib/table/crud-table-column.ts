import { Validator } from '@angular/forms';
import { FilterRuleType } from '../filter-selector/types';

export interface CrudTableColumn<Field = string> {
  field: Field;
  header: string;
  styleClass?: string;
  sortable?: boolean;
  filterable?: FilterRuleType | false;
  searchable?: boolean;
  hidden?: boolean;

  action?: (item: any) => void;
  actionStyleClass?: string;
  actionIcon?: string;
}

export interface CrudTableField<Field = string> {
  field: Field;
  label: string;

  // table
  tableDisplayType: string;
  tableLabel?: string;
  tableStyleClass?: string;
  tableHidden?: boolean;

  tableActionType?: 'button' | 'field';
  tableAction?: (item: any) => void;
  tableActionStyleClass?: string;
  tableActionIcon?: string;

  // filter
  filterType?: FilterRuleType | false;

  // sort
  sortEnabled?: boolean;

  // detail
  detailDisplay?: string;
  detailLabel?: string;
  detailValidators?: Validator[];
}

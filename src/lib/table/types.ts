import { OperationVariables } from '@apollo/client';

export type CustomSort = {
  readonly field: string;
  readonly order: string;
};

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export type FormGroupByDataLib<T extends {}> =
  import('@angular/forms').FormGroup<{
    [P in keyof T]: import('@angular/forms').FormControl<T[P] | null>;
  }>;
export type FormGroupByDataLib2<T extends {}> =
  import('@angular/forms').FormGroup<{
    [P in keyof T]-?: import('@angular/forms').FormControl<NonNullable<
      T[P]
    > | null>;
  }>;

export type FormGroupParamsLib<T extends {}> = {
  [P in keyof T]: [T[P], ...any];
};

export type FormGroupControls<T extends {}> = {
  [P in keyof T]: import('@angular/forms').FormControl<T[P] | null>;
};

export type MakeFormDataLib<
  T,
  K extends keyof T | 'id' = 'id',
  E extends {} = {},
> = Omit<Writeable<T>, K | 'id' | 'createdAt' | 'updatedAt'> & E;

export type ExtractServiceTypeLib<T> =
  T extends import('./crud-table.service').CrudTableService<
    any,
    any,
    infer ListResponse,
    infer DetailResponse,
    infer DetailVariables extends OperationVariables,
    infer CreateResponse,
    infer CreateVariables extends OperationVariables,
    infer UpdateResponse,
    infer UpdateVariables extends OperationVariables,
    infer DeleteResponse,
    infer DeleteVariables extends OperationVariables,
    infer DetailValue extends { id: string | number },
    infer CreateData,
    infer UpdateData
  >
    ? {
        DetailResponse: DetailResponse;
        DetailVariables: DetailVariables;
        CreateResponse: CreateResponse;
        CreateVariables: CreateVariables;
        UpdateResponse: UpdateResponse;
        UpdateVariables: UpdateVariables;
        DeleteResponse: DeleteResponse;
        DeleteVariables: DeleteVariables;
        DetailValue: DetailValue;
        CreateData: CreateData;
        UpdateData: UpdateData;
        ListResponse: ListResponse;
      }
    : never;

export type ExtractFormDataLib<
  S extends import('./crud-table.service').CrudTableService<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    UpdateData
  >,
  K extends keyof UpdateData | 'id' = 'id',
  E extends {} = {},
  UpdateData = ExtractServiceTypeLib<S>['UpdateData'],
> = MakeFormDataLib<UpdateData, K, E>;

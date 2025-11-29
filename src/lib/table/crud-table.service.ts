import {
  DocumentNode,
  FetchResult,
  MutationUpdaterFn,
  OperationVariables,
} from '@apollo/client/core';
import { Apollo, QueryRef, WatchQueryOptions } from 'apollo-angular';
import { Subject, firstValueFrom, map } from 'rxjs';
import { BaseTableService } from './base-table.service';

export abstract class CrudTableService<
  FetchResponse,
  FetchVariables extends OperationVariables,
  FetchData,
  DetailResponse,
  DetailVariables extends OperationVariables,
  CreateResponse,
  CreateVariables extends OperationVariables,
  UpdateResponse,
  UpdateVariables extends OperationVariables,
  DeleteResponse,
  DeleteVariables,
  DetailValue extends { id: string | number } = { id: string | number },
  CreateData = any,
  UpdateData = any,
> extends BaseTableService<FetchResponse, FetchVariables, FetchData> {
  abstract detailQuery: DocumentNode;
  abstract createQuery?: DocumentNode;
  abstract updateQuery?: DocumentNode;
  abstract deleteQuery?: DocumentNode;

  private createOptimisticUpdate?: MutationUpdaterFn<CreateResponse>;
  private deleteOptimisticUpdate?: (
    record: DeleteVariables,
  ) => MutationUpdaterFn<DeleteResponse>;

  openNewDialog$ = new Subject<void>();
  openEditDialog$ = new Subject<any>();
  closeDialog$ = new Subject<void>();

  constructor(apollo: Apollo) {
    super(apollo);
  }

  openNewDialog() {
    this.openNewDialog$.next();
  }

  openEditDialog(item: any) {
    this.openEditDialog$.next(item);
  }

  closeDialog() {
    this.closeDialog$.next();
  }

  protected setCreateOptimisticUpdate(
    fn: MutationUpdaterFn<CreateResponse>,
  ): void {
    this.createOptimisticUpdate = fn;
  }

  protected setDeleteOptimisticUpdate(
    fn: (record: DeleteVariables) => MutationUpdaterFn<DeleteResponse>,
  ): void {
    this.deleteOptimisticUpdate = fn;
  }

  detail(
    detail: DetailVariables,
    options?: Omit<WatchQueryOptions<DetailVariables, DetailResponse>, 'query'>,
  ): QueryRef<DetailResponse, DetailVariables> {
    return this.apollo.watchQuery<DetailResponse, DetailVariables>({
      query: this.detailQuery,
      variables: detail,
      returnPartialData: true,
      ...options,
    });
  }

  detailSelector(response: DetailResponse): DetailValue | null | undefined {
    throw 'Missing implementation of detailSelector';
  }

  detailValue(detail: DetailVariables) {
    return this.detail(detail).valueChanges.pipe(
      map((d) => this.detailSelector(d.data) ?? undefined),
    );
  }

  async create(create: CreateVariables): Promise<FetchResult<CreateResponse>> {
    if (this.createQuery == null) {
      throw 'Missing implementation of createQuery';
    }

    const result = await firstValueFrom(
      this.apollo.mutate<CreateResponse, CreateVariables>({
        mutation: this.createQuery,
        variables: create,
        update: this.createOptimisticUpdate,
      }),
    );

    this.refetchLast();

    return result;
  }

  createSelector(response: CreateResponse): DetailValue {
    throw 'Missing implementation of createSelector';
  }

  createInputVariables(data: CreateData): CreateVariables {
    throw 'Missing implementation of createInputVariables';
  }

  async createValue(data: CreateData) {
    const variables = this.createInputVariables(data);
    const result = await this.create(variables);
    if (!result.data) {
      return;
    }

    return this.createSelector(result.data);
  }

  update(
    update: UpdateVariables,
    optimisticData?: any,
  ): Promise<FetchResult<UpdateResponse>> {
    if (this.updateQuery == null) {
      throw 'Missing implementation of updateQuery';
    }

    const result = firstValueFrom(
      this.apollo.mutate<UpdateResponse, UpdateVariables>({
        mutation: this.updateQuery,
        variables: update,

        ...(optimisticData
          ? {
              optimisticResponse: optimisticData,
            }
          : null),
      }),
    );

    return result;
  }

  updateSelector(response: UpdateResponse): DetailValue {
    throw 'Missing implementation of updateSelector';
  }

  updateInputVariables(id: string, update: UpdateData): UpdateVariables {
    throw 'Missing implementation of updateInputVariables';
  }

  async updateValue(id: number | string, data: UpdateData) {
    const variables = this.updateInputVariables(String(id), data);
    const result = await this.update(variables);
    if (!result.data) {
      return;
    }

    return this.updateSelector(result.data);
  }

  async delete(record: DeleteVariables): Promise<boolean> {
    if (this.deleteQuery == null) {
      throw 'Missing implementation of deleteQuery';
    }

    try {
      const response = await firstValueFrom(
        this.apollo.mutate<DeleteResponse, DeleteVariables>({
          mutation: this.deleteQuery,
          variables: record,
          update: this.deleteOptimisticUpdate?.(record),
        }),
      );
      if (response.data == null) {
        return false;
      }

      this.refetchLast();

      return true;
    } catch (e) {
      return false;
    }
  }
}

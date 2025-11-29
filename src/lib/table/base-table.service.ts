import { OperationVariables } from '@apollo/client/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { DocumentNode } from 'graphql';
import {
  MonoTypeOperatorFunction,
  Observable,
  Subject,
  isObservable,
  of,
} from 'rxjs';
import {
  catchError,
  filter as filter$,
  share,
  switchMap,
  tap,
} from 'rxjs/operators';

export abstract class BaseTableService<
  Response,
  Variables extends OperationVariables,
  Data,
> {
  protected query?: QueryRef<Response, Variables>;
  enableSubscription = false;

  public loading$ = new Subject<boolean>();
  public networkLoading$ = new Subject<boolean>();

  private fetchDataSubject$ = new Subject<Data>();

  // Create a shared observable that will trigger onLastSubscriberUnsubscribe when the last subscriber unsubscribes
  fetchData$ = this.fetchDataSubject$
    .asObservable()
    .pipe(share(), this.onLastSubscriberUnsubscribe());

  // used for optimistic ui
  protected lastVariables?: Variables;

  abstract fetchQuery: DocumentNode;

  constructor(protected readonly apollo: Apollo) {}

  /**
   * Custom operator that triggers a method when the last subscriber unsubscribes
   * @returns A MonoTypeOperatorFunction that handles the last subscriber unsubscribe event
   */
  protected onLastSubscriberUnsubscribe<T>(): MonoTypeOperatorFunction<T> {
    return (source) => {
      let subscriberCount = 0;

      return new Observable<T>((observer) => {
        subscriberCount++;

        const subscription = source.subscribe(observer);

        return () => {
          subscriberCount--;
          if (subscriberCount === 0) {
            this.onLastSubscriberUnsubscribed();
          }
          subscription.unsubscribe();
        };
      });
    };
  }

  /**
   * Override this method in your service to handle when the last subscriber unsubscribes
   */
  protected onLastSubscriberUnsubscribed(): void {
    // Default implementation does nothing
    // Override this method in your service to add custom behavior
  }

  abstract listSelector(
    response: Response | {},
    variables: Variables,
  ): Data | Observable<Data>;

  fetch(variables?: Variables): void {
    this.lastVariables = variables;
    if (!this.query) {
      this.query = this.apollo.watchQuery<Response, Variables>({
        query: this.fetchQuery,
        variables,
        notifyOnNetworkStatusChange: true,
        errorPolicy: 'ignore',
      });

      // this.query.subscribeToMore({
      //   document: COMMENTS_SUBSCRIPTION,
      //   variables: {
      //     repoName: params.repoFullName,
      //   },
      //   updateQuery: (prev, { subscriptionData }) => {
      //     if (!subscriptionData.data) {
      //       return prev;
      //     }

      //     const newFeedItem = subscriptionData.data.commentAdded;

      //     return {
      //       ...prev,
      //       entry: {
      //         comments: [newFeedItem, ...prev.entry.comments],
      //       },
      //     };
      //   },
      // });

      this.query.valueChanges
        .pipe(
          tap((response) => {
            this.loading$.next(
              response.loading &&
                (response.data == null ||
                  this.listSelector(response.data, this.lastVariables!) ==
                    null),
            );
            this.networkLoading$.next(response.loading);
          }),
          // tap((r) =>
          //   console.log(r.networkStatus, r.loading, r.partial, r.data)
          // ),
          catchError((e) => {
            console.log('table error');
            this.loading$.next(false);
            this.networkLoading$.next(false);
            return of(null);
          }),
          switchMap((r) => {
            if (r?.data == null) {
              return of(null);
            }

            const res = this.listSelector(r.data, this.lastVariables!);
            if (isObservable(res)) {
              return res;
            }

            return of(res);
          }),
          filter$(<T>(r: T): r is Exclude<T, null> => !!r),
        )
        .subscribe(this.fetchDataSubject$);

      return;
    }

    this.query.refetch(variables).catch((error) => {
      console.error('refetch error', error);
    });
  }

  refetchLast(): void {
    if (this.lastVariables) {
      this.fetch(this.lastVariables);
    }
  }
}

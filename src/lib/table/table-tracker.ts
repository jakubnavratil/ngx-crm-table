import { InjectionToken } from '@angular/core';

/**
 * Optional analytics sink for user interactions performed inside the table
 * (opening a detail, creating a new record, filtering, sorting, searching,
 * expanding a row). The library stays decoupled: if no implementation is
 * provided, all tracking is a no-op.
 *
 * Provide an implementation in the host app via {@link TABLE_INTERACTION_TRACKER}.
 */
export interface TableInteractionTracker {
  trackTableEvent(event: string, params: Record<string, unknown>): void;
}

/** DI token the app binds to a {@link TableInteractionTracker} implementation. */
export const TABLE_INTERACTION_TRACKER =
  new InjectionToken<TableInteractionTracker>('TABLE_INTERACTION_TRACKER');

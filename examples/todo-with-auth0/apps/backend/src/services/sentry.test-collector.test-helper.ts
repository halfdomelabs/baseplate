import type { Event, EventHint } from '@sentry/node';

interface SentryTestReport {
  event: Event;
  hint: EventHint;
}

const reports: SentryTestReport[] = [];

export const sentryTestCollector = {
  reports(): SentryTestReport[] {
    return reports;
  },
  reset(): void {
    reports.length = 0;
  },
  beforeSend: (event: Event, hint: EventHint): null => {
    reports.push({ event, hint });
    return null;
  },
};

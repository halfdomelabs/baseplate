import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

let timeAgoInitialized = false;

export function initializeTimeAgo(): void {
  if (timeAgoInitialized) {
    return;
  }
  TimeAgo.addDefaultLocale(en);
  timeAgoInitialized = true;
}

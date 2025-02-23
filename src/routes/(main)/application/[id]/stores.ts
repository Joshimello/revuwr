import { writable, derived } from 'svelte/store';
import type { ExpandedApplication } from './types';

export const application = writable<ExpandedApplication | null>(null);
export const event = derived(application, $application => $application?.expand?.event || null);
export const answers = derived(application, $application => $application?.expand?.response || []);

export const currentIndex = writable(0);
export const isReadOnly = derived([application, event], ([$application, $event]) => {
  if (!$application) return true;
  if ($event?.status == 'archived') {
    return true;
  }
  if (!['draft', 'editsRequested'].includes($application.status)) {
    return true;
  }
  return false;
});
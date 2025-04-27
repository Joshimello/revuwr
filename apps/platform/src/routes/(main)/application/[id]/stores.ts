import { writable, derived } from 'svelte/store';
import type { ExpandedApplication } from './types';

export const application = writable<ExpandedApplication | null>(null);
export const event = derived(application, ($application) => $application?.expand?.event || null);
export const answers = derived(application, ($application) => $application?.expand?.response || []);

export const currentIndex = writable(0);
export const isReadOnly = derived(
	[application, event, currentIndex],
	([$application, $event, $currentIndex]) => {
		if (!$application) return true;
		if ($event?.status == 'archived') {
			return true;
		}
		if (
			$application.status == 'editsRequested' &&
			$application.expand?.response[$currentIndex]?.status == 'edit'
		) {
			return false;
		}
		if (!['draft'].includes($application.status)) {
			return true;
		}
		return false;
	}
);

import { writable } from 'svelte/store';
import { PUBLIC_BASE_PATH } from '$env/static/public';
import * as m from '$lib/paraglide/messages.js';

export interface BreadcrumbItem {
	text: string;
	href: string;
}

// Internal store - only used within this module
const _breadcrumbs = writable<BreadcrumbItem[]>([]);

// Exported readonly store for components to subscribe to
export const breadcrumbs = { subscribe: _breadcrumbs.subscribe };

/**
 * Set breadcrumbs for the current route.
 * Automatically adds the "Admin" root breadcrumb.
 *
 * @param crumbs - Array of breadcrumb items (without the root "Admin" item)
 */
export function setBreadcrumbs(crumbs: BreadcrumbItem[]): void {
	const adminRoot: BreadcrumbItem = {
		text: m.admin(),
		href: `${PUBLIC_BASE_PATH}/events`
	};

	_breadcrumbs.set([adminRoot, ...crumbs]);
}

/**
 * Clear all breadcrumbs (useful for cleanup or error states)
 */
export function clearBreadcrumbs(): void {
	_breadcrumbs.set([]);
}

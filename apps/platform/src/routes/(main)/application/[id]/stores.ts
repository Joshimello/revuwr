import { writable } from 'svelte/store';
import type { ExpandedApplication } from './types';

export const application = writable<ExpandedApplication | null>(null);
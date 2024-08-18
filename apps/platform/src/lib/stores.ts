import { writable } from 'svelte/store';
import { type BaseAuthStore } from 'pocketbase';
import { type UsersResponse } from './pocketbase/pocketbase-types'; 

export interface ExtendedAuthStore extends BaseAuthStore {
  model: UsersResponse;
}

export const user = writable<ExtendedAuthStore | null>(null);
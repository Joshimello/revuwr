import type { UsersResponse } from '$lib/pocketbase/pocketbase-types'
import { writable } from 'svelte/store'
import { type ExpandedUsersResponse } from './types'

export const users = writable<ExpandedUsersResponse[]>([])
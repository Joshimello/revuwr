// See https://kit.svelte.dev/docs/types#app

import type { TypedPocketBase, UsersResponse } from "$lib/pocketbase/pocketbase-types";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			pb: TypedPocketBase;
			apb: TypedPocketBase;
			user: UsersResponse | null;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};

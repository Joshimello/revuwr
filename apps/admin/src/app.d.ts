// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			pb: TypedPocketBase
			user: AuthModel | undefined
			rs: Resend
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};

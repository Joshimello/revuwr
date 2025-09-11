<script lang="ts">
	import { goto } from '$app/navigation';
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { pb } from '$lib/pocketbase/client';
	import { toast } from 'svelte-sonner';

	let email = '';
	let password = '';
	let isLoading = false;

	async function handleSubmit() {
		isLoading = true;

		try {
			await pb.admins.authWithPassword(email, password);
			document.cookie = pb.authStore.exportToCookie({ httpOnly: false, secure: false });
			goto(`${PUBLIC_BASE_PATH}/`, { invalidateAll: true });
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
				console.error(err);
			}
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Admin Login</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4"
>
	<div class="w-full max-w-md">
		<div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
			<form on:submit|preventDefault={handleSubmit} class="space-y-6">
				<div class="space-y-2">
					<Label for="email" class="text-sm font-medium text-gray-700">Email</Label>
					<Input
						id="email"
						type="email"
						bind:value={email}
						placeholder="admin@example.com"
						required
						disabled={isLoading}
						class="h-12 border-gray-200 text-base focus:border-gray-400 focus:ring-0"
					/>
				</div>

				<div class="space-y-2">
					<Label for="password" class="text-sm font-medium text-gray-700">Password</Label>
					<Input
						id="password"
						type="password"
						bind:value={password}
						required
						disabled={isLoading}
						class="h-12 border-gray-200 text-base focus:border-gray-400 focus:ring-0"
					/>
				</div>

				<Button
					type="submit"
					class="h-12 w-full bg-gray-900 text-base font-medium hover:bg-gray-800 focus:ring-gray-900"
					disabled={isLoading}
				>
					{#if isLoading}
						<svg
							class="-ml-1 mr-3 h-4 w-4 animate-spin text-white"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Signing in...
					{:else}
						Sign in
					{/if}
				</Button>
			</form>
		</div>
	</div>
</div>

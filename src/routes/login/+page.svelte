<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { enhance } from '$app/forms';

	export let form;
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100">
	<form method="POST" use:enhance class="bg-white p-6 rounded shadow-md w-full max-w-sm">
		<h1 class="text-2xl font-bold mb-4">Login</h1>
		
		{#if form?.error}
			<div class="mb-4 p-2 bg-red-50 text-red-600 rounded text-sm">
				{form.error}
			</div>
		{/if}
		
		<div class="mb-4">
			<label for="username" class="block text-sm font-medium mb-1">Username</label>
			<Input
				id="username"
				name="username"
				type="text"
				value={form?.username || ''}
				required
			/>
		</div>
		
		<div class="mb-6">
			<label for="password" class="block text-sm font-medium mb-1">Password</label>
			<Input
				id="password"
				name="password"
				type="password"
				required
			/>
		</div>
		
		<Button type="submit" class="w-full">
			Sign In
		</Button>
	</form>
</div>
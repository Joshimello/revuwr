<script lang="ts">
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import { setBreadcrumbs } from '$lib/breadcrumbs.js';
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages.js';
	import { onMount } from 'svelte';
	import DataTable from './data-table.svelte';
	import { getAllUsers } from './methods';
	import NewUser from './new-user.svelte';
	import { users } from './stores';

	// Set breadcrumbs for users list page
	setBreadcrumbs([
		{
			text: m.users(),
			href: `${PUBLIC_BASE_PATH}/users`
		}
	]);

	onMount(async () => {
		$users = (await getAllUsers()) || [];
	});

	let createUserOpen = false;
</script>

<div class="flex items-center">
	<h1 class="text-lg font-semibold md:text-2xl">
		{m.users()}
	</h1>
</div>

<div class="flex gap-2">
	<Button
		variant="outline"
		on:click={async () => {
			$users = (await getAllUsers()) || [];
		}}
	>
		{m.refresh_list()}
	</Button>
	<Button
		variant="outline"
		on:click={() => {
			createUserOpen = true;
		}}
	>
		{m.create_new_user()}
	</Button>
</div>

<DataTable />

<NewUser bind:open={createUserOpen} />

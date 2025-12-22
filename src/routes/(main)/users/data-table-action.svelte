<script lang="ts">
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import * as m from '$lib/paraglide/messages.js';
	import { Edit3, Mail, SquareArrowOutUpRight, SquareMenu, Trash2, User } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { deleteUser, getAllUsers } from './methods';
	import QuickEdit from './quick-edit.svelte';
	import { users } from './stores';
	import type { ExpandedUsersResponse } from './types';

	export let record: ExpandedUsersResponse;

	let deleteUserOpen = false;
	let quickEditOpen = false;
	let isLoading = false;
	let deleteAllUserData = false;
	let deleteUserAccount = false;

	// When deleteUserAccount is checked, force deleteAllUserData to be checked
	$: if (deleteUserAccount && !deleteAllUserData) {
		deleteAllUserData = true;
	}

	// Button should be disabled if nothing is checked
	$: canDelete = deleteAllUserData || deleteUserAccount;
</script>

<div class="flex">
	<Button variant="ghost" size="icon" href={`${PUBLIC_BASE_PATH}/users/${record.id}`}>
		<SquareArrowOutUpRight size="20" class="text-muted-foreground" />
	</Button>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger asChild let:builder>
			<Button variant="ghost" size="icon" builders={[builder]}>
				<SquareMenu size="20" class="text-muted-foreground" />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<DropdownMenu.Group>
				<DropdownMenu.Item on:click={() => (quickEditOpen = true)}>
					<Edit3 size="16" class="mr-2" />
					{m.quick_edit()}
				</DropdownMenu.Item>
				<DropdownMenu.Item href={`${PUBLIC_BASE_PATH}/users/${record.id}`}>
					<User size="16" class="mr-2" />
					{m.user_details()}
				</DropdownMenu.Item>
				<DropdownMenu.Item href={`mailto:${record.email}`} target="_blank">
					<Mail size="16" class="mr-2" />
					{m.mail_user()}
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item on:click={() => (deleteUserOpen = true)}>
					<Trash2 size="16" class="mr-2" />
					{m.delete_data()}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Label class="p-0 px-2 font-mono text-xs font-normal text-muted-foreground">
				{record.id}
			</DropdownMenu.Label>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>

<Dialog.Root bind:open={deleteUserOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				{m.deleting_data_of_user({ name: record.name, username: record.username })}
			</Dialog.Title>
			<Dialog.Description>
				{m.deletion_warning()}
			</Dialog.Description>
		</Dialog.Header>
		<Separator />
		<div class="flex flex-col gap-4">
			<div class="flex items-center space-x-2">
				<Checkbox id="delete-user-data" bind:checked={deleteAllUserData} disabled={isLoading} />
				<Label for="delete-user-data" class="text-sm font-medium">
					{m.delete_all_user_data()}
				</Label>
			</div>
			<Label class="text-xs text-muted-foreground">
				{m.delete_all_user_data_description()}
			</Label>

			<div class="flex items-center space-x-2">
				<Checkbox id="delete-user-account" bind:checked={deleteUserAccount} disabled={isLoading} />
				<Label for="delete-user-account" class="text-sm font-medium">
					{m.delete_user_account_also()}
				</Label>
			</div>
			<Label class="text-xs text-muted-foreground">
				{m.delete_user_account_also_description()}
			</Label>

			<Button
				variant="destructive"
				disabled={isLoading || !canDelete}
				on:click={() => {
					isLoading = true;
					const promise = deleteUser(record.id, deleteUserAccount)
						.then(async (message) => {
							deleteUserOpen = false;
							deleteAllUserData = false;
							deleteUserAccount = false;
							$users = (await getAllUsers()) || [];
							return message;
						})
						.finally(() => {
							isLoading = false;
						});

					toast.promise(promise, {
						loading: deleteUserAccount ? m.deleting_all() : m.deleting_data(),
						success: (message) => message,
						error: (err) => (err instanceof Error ? err.message : 'Unknown error')
					});
				}}
			>
				{m.delete_button()}
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>

<QuickEdit {record} bind:open={quickEditOpen} />

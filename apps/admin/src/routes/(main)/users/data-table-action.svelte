<script lang="ts">
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import * as m from '$lib/paraglide/messages.js';
	import { Edit3, Mail, SquareArrowOutUpRight, SquareMenu, Trash2, User } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import {
		deleteUserAccount,
		deleteUserAssociated,
		deleteUserExsistance,
		getAllUsers
	} from './methods';
	import QuickEdit from './quick-edit.svelte';
	import { users } from './stores';
	import type { ExpandedUsersResponse } from './types';

	export let record: ExpandedUsersResponse;

	let deleteUserOpen = false;
	let quickEditOpen = false;
	let isLoading = false;
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
		<div class="flex flex-col gap-2">
			<Button
				variant="destructive"
				disabled={isLoading}
				on:click={() => {
					isLoading = true;
					toast.loading(m.deleting_data());
					deleteUserAssociated(record.id, async () => {
						deleteUserOpen = false;
						$users = (await getAllUsers()) || [];
						isLoading = false;
					});
				}}
			>
				{m.delete_just_data()}
			</Button>
			<Label class="text-muted-foreground ">
				{m.delete_data_description()}
			</Label>
		</div>
		<Separator />
		<div class="flex flex-col gap-2">
			<Button
				variant="destructive"
				disabled={isLoading}
				on:click={() => {
					isLoading = true;
					toast.loading(m.deleting_account());
					deleteUserAccount(record.id, async () => {
						deleteUserOpen = false;
						$users = (await getAllUsers()) || [];
						isLoading = false;
					});
				}}
			>
				{m.delete_just_account()}
			</Button>
			<Label class="text-muted-foreground ">
				{m.delete_account_description()}
			</Label>
		</div>
		<Separator />
		<div class="flex flex-col gap-2">
			<Button
				variant="destructive"
				disabled={isLoading}
				on:click={() => {
					isLoading = true;
					toast.loading(m.deleting_all());
					deleteUserExsistance(record.id, async () => {
						deleteUserOpen = false;
						$users = (await getAllUsers()) || [];
						isLoading = false;
					});
				}}
			>
				{m.delete_all()}
			</Button>
			<Label class="text-muted-foreground ">
				{m.delete_all_description()}
			</Label>
		</div>
	</Dialog.Content>
</Dialog.Root>

<QuickEdit {record} bind:open={quickEditOpen} />

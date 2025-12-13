<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import { setBreadcrumbs } from '$lib/breadcrumbs.js';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import * as m from '$lib/paraglide/messages.js';
	import { pb } from '$lib/pocketbase/client';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';
	import { addCollege, deleteCollege, syncColleges } from './methods';

	export let data: PageData;

	// Set breadcrumbs for settings page
	setBreadcrumbs([
		{
			text: m.settings(),
			href: `${PUBLIC_BASE_PATH}/settings`
		}
	]);

	let newCollege = {
		en: '',
		zh: ''
	};

	let isLoading = false;
	let isChangingPassword = false;
	let passwordData = {
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	};

	async function handleSync() {
		isLoading = true;
		try {
			await syncColleges();
			toast.success(m.colleges_synced());
			await invalidateAll();
		} catch (error) {
			toast.error(m.sync_failed());
		} finally {
			isLoading = false;
		}
	}

	async function handleAddCollege() {
		if (!newCollege.en || !newCollege.zh) {
			toast.error(m.validation_error());
			return;
		}

		try {
			await addCollege(newCollege);
			toast.success(m.college_added());
			newCollege = { en: '', zh: '' };
			await invalidateAll();
		} catch (error) {
			toast.error(m.failed_to_add_college());
		}
	}

	async function handleDeleteCollege(id: string) {
		try {
			await deleteCollege(id);
			toast.success(m.college_deleted());
			await invalidateAll();
		} catch (error) {
			toast.error(m.failed_to_delete_college());
		}
	}

	async function handleChangePassword() {
		if (
			!passwordData.currentPassword ||
			!passwordData.newPassword ||
			!passwordData.confirmPassword
		) {
			toast.error(m.validation_error());
			return;
		}

		if (passwordData.newPassword !== passwordData.confirmPassword) {
			toast.error(m.passwords_do_not_match());
			return;
		}

		if (passwordData.newPassword.length < 8) {
			toast.error(m.password_too_short());
			return;
		}

		isChangingPassword = true;
		try {
			await pb.collection('_superusers').update(data.admin.id, {
				oldPassword: passwordData.currentPassword,
				password: passwordData.newPassword,
				passwordConfirm: passwordData.confirmPassword
			});

			toast.success(m.password_changed());
			passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
		} catch (error) {
			toast.error(m.failed_to_change_password());
		} finally {
			isChangingPassword = false;
		}
	}
</script>

<div class="container mx-auto space-y-8 p-6">
	<h1 class="text-3xl font-bold">{m.settings()}</h1>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>{m.admin_account()}</CardTitle>
			<CardDescription>{m.admin_account_desc()}</CardDescription>
		</CardHeader>

		<CardContent>
			<div class="space-y-6">
				<div>
					<label class="text-sm font-medium">{m.admin_email()}</label>
					<div class="mt-1 text-sm text-muted-foreground">
						{data.admin.email || 'admin@example.com'}
					</div>
				</div>

				<div class="border-t pt-6">
					<h3 class="mb-4 text-lg font-medium">{m.change_password()}</h3>
					<div class="space-y-4">
						<div>
							<label for="current-password" class="mb-1 block text-sm font-medium"
								>{m.current_password()}</label
							>
							<Input
								id="current-password"
								type="password"
								bind:value={passwordData.currentPassword}
								placeholder="Enter current password"
							/>
						</div>
						<div>
							<label for="new-password" class="mb-1 block text-sm font-medium"
								>{m.new_password()}</label
							>
							<Input
								id="new-password"
								type="password"
								bind:value={passwordData.newPassword}
								placeholder="Enter new password"
							/>
						</div>
						<div>
							<label for="confirm-password" class="mb-1 block text-sm font-medium"
								>{m.confirm_password()}</label
							>
							<Input
								id="confirm-password"
								type="password"
								bind:value={passwordData.confirmPassword}
								placeholder="Confirm new password"
							/>
						</div>
						<Button variant="outline" on:click={handleChangePassword} disabled={isChangingPassword}>
							{#if isChangingPassword}
								<span class="mr-2 animate-spin">⟳</span>
							{/if}
							{m.change_password()}
						</Button>
					</div>
				</div>
			</div>
		</CardContent>
	</Card>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>{m.college_management()}</CardTitle>
			<CardDescription>{m.college_management_desc()}</CardDescription>
		</CardHeader>

		<CardContent>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-medium">{m.colleges()}</h3>
				<Button on:click={handleSync} disabled={isLoading}>
					{#if isLoading}
						<span class="mr-2 animate-spin">⟳</span>
					{/if}
					{m.sync_colleges()}
				</Button>
			</div>

			<div class="rounded-md border">
				<div class="h-[300px] overflow-y-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead class="w-[250px]">{m.english_name()}</TableHead>
								<TableHead class="w-[250px]">{m.chinese_name()}</TableHead>
								<TableHead class="w-[100px]">{m.actions()}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#if data.colleges && data.colleges.length > 0}
								{#each data.colleges as college}
									<TableRow>
										<TableCell>{college.en}</TableCell>
										<TableCell>{college.zh}</TableCell>
										<TableCell>
											<Button
												variant="destructive"
												size="sm"
												on:click={() => handleDeleteCollege(college.id)}
											>
												{m.del()}
											</Button>
										</TableCell>
									</TableRow>
								{/each}
							{:else}
								<TableRow>
									<TableCell class="py-4 text-center">{m.no_colleges_found()}</TableCell>
								</TableRow>
							{/if}
						</TableBody>
					</Table>
				</div>
			</div>
		</CardContent>

		<CardFooter class="flex flex-col space-y-4">
			<div class="w-full">
				<h3 class="mb-2 text-lg font-medium">{m.add_new_college()}</h3>
				<div class="mb-4 grid grid-cols-2 gap-4">
					<div>
						<label for="en" class="mb-1 block text-sm font-medium">{m.english_name()}</label>
						<Input id="en" bind:value={newCollege.en} placeholder="College of Science" />
					</div>
					<div>
						<label for="zh" class="mb-1 block text-sm font-medium">{m.chinese_name()}</label>
						<Input id="zh" bind:value={newCollege.zh} placeholder="理學院" />
					</div>
				</div>
				<Button variant="outline" on:click={handleAddCollege}>{m.add_college()}</Button>
			</div>
		</CardFooter>
	</Card>
</div>

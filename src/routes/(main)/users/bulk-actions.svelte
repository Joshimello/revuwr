<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import * as m from '$lib/paraglide/messages.js';
	import { pb } from '$lib/pocketbase/client';
	import { Building2, Download, Edit3, Mail, MapPin, Save, Users, X } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { getAllUsers } from './methods';
	import { users } from './stores';
	import type { ExpandedUsersResponse } from './types';

	export let selectedUsers: ExpandedUsersResponse[] = [];
	export let open = false;

	let activeTab: 'edit' | 'export' | 'notify' = 'edit';
	let isLoading = false;

	// Bulk edit form
	let bulkEditData = {
		occupation: '',
		country: '',
		department: '',
		dept: '',
		year: '',
		disableNotify: null as boolean | null
	};

	// Export options
	let exportFormat: 'csv' | 'json' = 'csv';
	let exportFields = {
		basic: true,
		contact: true,
		academic: true,
		applications: false
	};

	// Notification
	let emailSubject = '';
	let emailBody = '';

	const occupationOptions = [
		{ value: '', label: m.no_change() },
		{ value: 'student', label: m.students() },
		{ value: 'teacher', label: m.faculty() }
	];

	const notificationOptions = [
		{ value: null, label: m.no_change() },
		{ value: false, label: m.enable_notifications() },
		{ value: true, label: m.disable_notifications() }
	];

	async function applyBulkEdit() {
		if (selectedUsers.length === 0) return;

		isLoading = true;
		const updateData: Record<string, any> = {};

		// Only include fields that have values
		if (bulkEditData.occupation && bulkEditData.occupation !== '')
			updateData.occupation = bulkEditData.occupation;
		if (bulkEditData.country && bulkEditData.country !== '')
			updateData.country = bulkEditData.country;
		if (bulkEditData.department && bulkEditData.department !== '')
			updateData.department = bulkEditData.department;
		if (bulkEditData.dept && bulkEditData.dept !== '') updateData.dept = bulkEditData.dept;
		if (bulkEditData.year && bulkEditData.year !== '') updateData.year = bulkEditData.year;
		if (bulkEditData.disableNotify !== null) updateData.disableNotify = bulkEditData.disableNotify;

		if (Object.keys(updateData).length === 0) {
			toast.error(m.please_select_at_least_one_field());
			isLoading = false;
			return;
		}

		try {
			const promises = selectedUsers.map((user) =>
				pb.collection('users').update(user.id, updateData)
			);

			await Promise.all(promises);

			// Refresh users list
			$users = (await getAllUsers()) || [];

			toast.success(m.successfully_updated_users({ count: selectedUsers.length }));
			resetForm();
			open = false;
		} catch (error) {
			console.error('Error updating users:', error);
			toast.error(m.failed_to_update_users());
		} finally {
			isLoading = false;
		}
	}

	function exportUsers() {
		if (selectedUsers.length === 0) return;

		const data = selectedUsers.map((user) => {
			const exportUser: Record<string, any> = {};

			if (exportFields.basic) {
				exportUser.id = user.id;
				exportUser.username = user.username;
				exportUser.name = user.name;
				exportUser.nameEn = user.nameEn;
				exportUser.created = user.created;
			}

			if (exportFields.contact) {
				exportUser.email = user.email;
				exportUser.phone = user.phone;
				exportUser.country = user.country;
				exportUser.disableNotify = user.disableNotify;
			}

			if (exportFields.academic) {
				exportUser.occupation = user.occupation;
				exportUser.department = user.department;
				exportUser.dept = user.dept;
				exportUser.year = user.year;
			}

			if (exportFields.applications) {
				exportUser.applicationCount = user.applications?.length || 0;
			}

			return exportUser;
		});

		if (exportFormat === 'csv') {
			exportAsCSV(data);
		} else {
			exportAsJSON(data);
		}

		toast.success(m.exported_users({ count: selectedUsers.length }));
	}

	function exportAsCSV(data: Record<string, any>[]) {
		if (data.length === 0) return;

		const headers = Object.keys(data[0]);
		const csvContent = [
			headers.join(','),
			...data.map((row) =>
				headers.map((header) => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(',')
			)
		].join('\n');

		downloadFile(
			csvContent,
			`users-export-${new Date().toISOString().split('T')[0]}.csv`,
			'text/csv'
		);
	}

	function exportAsJSON(data: Record<string, any>[]) {
		const jsonContent = JSON.stringify(data, null, 2);
		downloadFile(
			jsonContent,
			`users-export-${new Date().toISOString().split('T')[0]}.json`,
			'application/json'
		);
	}

	function downloadFile(content: string, filename: string, mimeType: string) {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	function resetForm() {
		bulkEditData = {
			occupation: '',
			country: '',
			department: '',
			dept: '',
			year: '',
			disableNotify: null
		};
		emailSubject = '';
		emailBody = '';
	}

	function closeDialog() {
		resetForm();
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] max-w-4xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Users size="20" />
				{m.bulk_actions()}
				<Badge variant="secondary">{m.users_selected({ count: selectedUsers.length })}</Badge>
			</Dialog.Title>
			<Dialog.Description>{m.perform_batch_operations()}</Dialog.Description>
		</Dialog.Header>

		<!-- Tab Navigation -->
		<div class="flex gap-1 rounded-lg bg-muted p-1">
			<button
				class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors {activeTab ===
				'edit'
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
				on:click={() => (activeTab = 'edit')}
			>
				<Edit3 size="16" class="mr-2 inline" />
				{m.bulk_edit()}
			</button>
			<button
				class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors {activeTab ===
				'export'
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
				on:click={() => (activeTab = 'export')}
			>
				<Download size="16" class="mr-2 inline" />
				{m.export_data()}
			</button>
			<button
				class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors {activeTab ===
				'notify'
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
				on:click={() => (activeTab = 'notify')}
			>
				<Mail size="16" class="mr-2 inline" />
				{m.notify()}
			</button>
		</div>

		<div class="py-6">
			{#if activeTab === 'edit'}
				<!-- Bulk Edit Tab -->
				<div class="space-y-6">
					<div class="space-y-4">
						<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<Building2 size="16" />
							{m.academic_information()}
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label>{m.occupation()}</Label>
								<select
									value={bulkEditData.occupation}
									on:change={(e) => (bulkEditData.occupation = e.target.value)}
									class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{#each occupationOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</div>

							<div class="space-y-2">
								<Label>{m.year()}</Label>
								<Input
									value={bulkEditData.year}
									on:input={(e) => (bulkEditData.year = e.target.value)}
									placeholder={m.leave_empty_for_no_change()}
								/>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label>{m.college()}</Label>
								<Input
									value={bulkEditData.department}
									on:input={(e) => (bulkEditData.department = e.target.value)}
									placeholder={m.leave_empty_for_no_change()}
								/>
							</div>

							<div class="space-y-2">
								<Label>{m.department()}</Label>
								<Input
									value={bulkEditData.dept}
									on:input={(e) => (bulkEditData.dept = e.target.value)}
									placeholder={m.leave_empty_for_no_change()}
								/>
							</div>
						</div>
					</div>

					<Separator />

					<div class="space-y-4">
						<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<MapPin size="16" />
							{m.location_and_preferences()}
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label>{m.country()}</Label>
								<Input
									value={bulkEditData.country}
									on:input={(e) => (bulkEditData.country = e.target.value)}
									placeholder={m.leave_empty_for_no_change()}
								/>
							</div>

							<div class="space-y-2">
								<Label>{m.email_notifications()}</Label>
								<select
									value={bulkEditData.disableNotify}
									on:change={(e) =>
										(bulkEditData.disableNotify =
											e.target.value === 'null' ? null : e.target.value === 'true')}
									class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{#each notificationOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</div>
						</div>
					</div>

					<div class="rounded-lg bg-muted/50 p-4">
						<p class="text-sm text-muted-foreground">
							<strong>{m.note()}:</strong>
							{m.bulk_edit_note({ count: selectedUsers.length })}
						</p>
					</div>
				</div>
			{:else if activeTab === 'export'}
				<!-- Export Tab -->
				<div class="space-y-6">
					<div class="space-y-4">
						<Label class="text-base font-medium">{m.export_format()}</Label>
						<select
							value={exportFormat}
							on:change={(e) => (exportFormat = e.target.value)}
							class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="csv">CSV</option>
							<option value="json">JSON</option>
						</select>
					</div>

					<Separator />

					<div class="space-y-4">
						<Label class="text-base font-medium">{m.export_fields()}</Label>

						<div class="grid grid-cols-2 gap-4">
							<div class="flex items-center space-x-2">
								<Checkbox
									checked={exportFields.basic}
									onCheckedChange={(checked) => (exportFields.basic = checked)}
								/>
								<Label>{m.basic_information_fields()}</Label>
							</div>

							<div class="flex items-center space-x-2">
								<Checkbox
									checked={exportFields.contact}
									onCheckedChange={(checked) => (exportFields.contact = checked)}
								/>
								<Label>{m.contact_information_fields()}</Label>
							</div>

							<div class="flex items-center space-x-2">
								<Checkbox
									checked={exportFields.academic}
									onCheckedChange={(checked) => (exportFields.academic = checked)}
								/>
								<Label>{m.academic_information_fields()}</Label>
							</div>

							<div class="flex items-center space-x-2">
								<Checkbox
									checked={exportFields.applications}
									onCheckedChange={(checked) => (exportFields.applications = checked)}
								/>
								<Label>{m.application_count()}</Label>
							</div>
						</div>
					</div>

					<div class="rounded-lg bg-muted/50 p-4">
						<p class="text-sm text-muted-foreground">
							{m.export_will_include({ count: selectedUsers.length })}
						</p>
					</div>
				</div>
			{:else if activeTab === 'notify'}
				<!-- Notification Tab -->
				<div class="space-y-6">
					<div class="space-y-4">
						<div class="space-y-2">
							<Label>{m.email_subject()}</Label>
							<Input
								value={emailSubject}
								on:input={(e) => (emailSubject = e.target.value)}
								placeholder={m.enter_email_subject()}
							/>
						</div>

						<div class="space-y-2">
							<Label>{m.email_body()}</Label>
							<textarea
								value={emailBody}
								on:input={(e) => (emailBody = e.target.value)}
								placeholder={m.enter_email_message()}
								class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							></textarea>
						</div>
					</div>

					<div class="rounded-lg bg-muted/50 p-4">
						<p class="text-sm text-muted-foreground">
							<strong>{m.note()}:</strong>
							{m.email_client_note({ count: selectedUsers.length })}
						</p>
					</div>
				</div>
			{/if}
		</div>

		<Dialog.Footer class="gap-2">
			<Button variant="outline" on:click={closeDialog} disabled={isLoading}>
				<X size="16" />
				{m.cancel()}
			</Button>

			{#if activeTab === 'edit'}
				<Button on:click={applyBulkEdit} disabled={isLoading}>
					<Save size="16" />
					{isLoading ? m.updating() : m.update_users({ count: selectedUsers.length })}
				</Button>
			{:else if activeTab === 'export'}
				<Button on:click={exportUsers}>
					<Download size="16" />
					{m.export_users({ count: selectedUsers.length })}
				</Button>
			{:else if activeTab === 'notify'}
				<Button
					on:click={() => {
						const emails = selectedUsers
							.map((u) => u.email)
							.filter(Boolean)
							.join(';');
						const subject = encodeURIComponent(emailSubject);
						const body = encodeURIComponent(emailBody);
						window.open(`mailto:${emails}?subject=${subject}&body=${body}`);
					}}
					disabled={!emailSubject || !emailBody}
				>
					<Mail size="16" />
					{m.open_email_client()}
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

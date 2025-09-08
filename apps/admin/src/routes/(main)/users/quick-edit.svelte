<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Switch } from '$lib/components/ui/switch';
	import * as m from '$lib/paraglide/messages.js';
	import { pb } from '$lib/pocketbase/client';
	import { Building2, Calendar, Edit3, Mail, MapPin, Save, User, X } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { getAllUsers } from './methods';
	import { users } from './stores';
	import type { ExpandedUsersResponse } from './types';

	export let record: ExpandedUsersResponse;
	export let open = false;

	let isLoading = false;
	let formData = {
		name: '',
		nameEn: '',
		email: '',
		phone: '',
		country: '',
		department: '',
		dept: '',
		occupation: '',
		year: '',
		disableNotify: false
	};

	// Initialize form data when dialog opens or record changes
	$: if (record) {
		formData.name = record.name || '';
		formData.nameEn = record.nameEn || '';
		formData.email = record.email || '';
		formData.phone = record.phone || '';
		formData.country = record.country || '';
		formData.department = record.department || '';
		formData.dept = record.dept || '';
		formData.occupation = record.occupation || '';
		formData.year = record.year || '';
		formData.disableNotify = record.disableNotify || false;
	}

	const occupationOptions = [
		{ value: 'student', label: m.students() },
		{ value: 'teacher', label: m.faculty() }
	];

	async function saveChanges() {
		if (!record) return;

		isLoading = true;
		try {
			await pb.collection('users').update(record.id, {
				name: formData.name,
				nameEn: formData.nameEn,
				email: formData.email,
				phone: formData.phone,
				country: formData.country,
				department: formData.department,
				dept: formData.dept,
				occupation: formData.occupation,
				year: formData.year,
				disableNotify: formData.disableNotify
			});

			// Refresh users list
			$users = (await getAllUsers()) || [];

			toast.success(m.user_data_updated_successfully());
			open = false;
		} catch (error) {
			console.error('Error updating user:', error);
			toast.error(m.failed_to_update_user_data());
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			saveChanges();
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Edit3 size="20" />
				{m.quick_edit()}: {record?.name}
			</Dialog.Title>
			<Dialog.Description>
				{m.make_quick_changes_to_user_info()}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6 py-4" on:keydown={handleKeydown} role="none">
			<!-- Basic Information -->
			<div class="space-y-4">
				<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
					<User size="16" />
					{m.basic_information()}
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="name">{m.full_name()}</Label>
						<Input
							id="name"
							value={formData.name}
							on:input={(e) => (formData.name = e.target.value)}
							placeholder={m.enter_full_name()}
						/>
					</div>

					<div class="space-y-2">
						<Label for="nameEn">{m.english_name()}</Label>
						<Input
							id="nameEn"
							value={formData.nameEn}
							on:input={(e) => (formData.nameEn = e.target.value)}
							placeholder={m.enter_english_name()}
						/>
					</div>
				</div>
			</div>

			<Separator />

			<!-- Contact Information -->
			<div class="space-y-4">
				<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
					<Mail size="16" />
					{m.contact_information()}
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="email">{m.email()}</Label>
						<Input
							id="email"
							type="email"
							value={formData.email}
							on:input={(e) => (formData.email = e.target.value)}
							placeholder={m.enter_email()}
						/>
					</div>

					<div class="space-y-2">
						<Label for="phone">{m.phone()}</Label>
						<Input
							id="phone"
							value={formData.phone}
							on:input={(e) => (formData.phone = e.target.value)}
							placeholder={m.enter_phone_number()}
						/>
					</div>
				</div>
			</div>

			<Separator />

			<!-- Academic Information -->
			<div class="space-y-4">
				<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
					<Building2 size="16" />
					{m.academic_information()}
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="occupation">{m.occupation()}</Label>
						<select
							id="occupation"
							value={formData.occupation}
							on:change={(e) => (formData.occupation = e.target.value)}
							class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#each occupationOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>

					<div class="space-y-2">
						<Label for="year">{m.year()}</Label>
						<Input
							id="year"
							value={formData.year}
							on:input={(e) => (formData.year = e.target.value)}
							placeholder={m.enter_year()}
						/>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="department">{m.college()}</Label>
						<Input
							id="department"
							value={formData.department}
							on:input={(e) => (formData.department = e.target.value)}
							placeholder={m.enter_college()}
						/>
					</div>

					<div class="space-y-2">
						<Label for="dept">{m.department()}</Label>
						<Input
							id="dept"
							value={formData.dept}
							on:input={(e) => (formData.dept = e.target.value)}
							placeholder={m.enter_department()}
						/>
					</div>
				</div>
			</div>

			<Separator />

			<!-- Location & Preferences -->
			<div class="space-y-4">
				<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
					<MapPin size="16" />
					{m.location_and_preferences()}
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="country">{m.country()}</Label>
						<Input
							id="country"
							value={formData.country}
							on:input={(e) => (formData.country = e.target.value)}
							placeholder={m.enter_country()}
						/>
					</div>

					<div class="space-y-2">
						<Label for="notifications" class="text-sm font-medium">{m.email_notifications()}</Label>
						<div class="flex items-center space-x-2 pt-2">
							<Switch
								id="notifications"
								checked={formData.disableNotify}
								onCheckedChange={(checked) => (formData.disableNotify = checked)}
							/>
							<Label for="notifications" class="text-sm text-muted-foreground">
								{formData.disableNotify ? m.disabled() : m.enabled()}
							</Label>
						</div>
					</div>
				</div>
			</div>

			<!-- User Info -->
			{#if record}
				<div class="flex items-center gap-4 rounded-lg bg-muted/50 p-3">
					<div class="flex items-center gap-2 text-xs text-muted-foreground">
						<Calendar size="14" />
						{m.created()}: {new Date(record.created).toLocaleDateString()}
					</div>
					<Badge variant="outline" class="text-xs">
						{record.username}
					</Badge>
					<Badge variant="outline" class="font-mono text-xs">
						{record.id}
					</Badge>
				</div>
			{/if}
		</div>

		<Dialog.Footer class="gap-2">
			<Button variant="outline" on:click={() => (open = false)} disabled={isLoading}>
				<X size="16" />
				{m.cancel()}
			</Button>
			<Button on:click={saveChanges} disabled={isLoading}>
				<Save size="16" />
				{isLoading ? m.saving() : m.save_changes()}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	:global([role='none']) {
		outline: none;
	}
</style>

<script lang="ts">
	import {
		PUBLIC_USER_BIRTHDAY,
		PUBLIC_USER_COUNTRY,
		PUBLIC_USER_DEPARTMENT,
		PUBLIC_USER_OCCUPATION
	} from '$env/static/public';
	import CollegePicker from '$lib/components/college-picker.svelte';
	import CountryPicker from '$lib/components/country-picker.svelte';
	import DatePicker from '$lib/components/date-picker.svelte';
	import DepartmentPicker from '$lib/components/department-picker.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Switch } from '$lib/components/ui/switch';
	import { m } from '$lib/paraglide/messages.js';
	import { setLocale } from '$lib/paraglide/runtime.js';
	import { pb } from '$lib/pocketbase/client';
	import type {
		UsersLanguageOptions,
		UsersOccupationOptions,
		UsersResponse
	} from '$lib/pocketbase/pocketbase-types';
	import type { DateValue } from '@internationalized/date';
	import { parseDate } from '@internationalized/date';
	import { AlertTriangle, ChevronLeft, Upload, X } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	export let data;
	const { user } = data;

	let account: UsersResponse | null = user;
	let stringAccount: string | null = null;
	let avatarFileInput: HTMLInputElement;
	const phoneRegex = /^(?:\+8869\d{8}|09\d{8})$/;
	$: isPhoneValid = account?.phone ? phoneRegex.test(account.phone) : false;
	$: hasPhoneNumber = account?.phone && account.phone.trim() !== '';

	// Environment variable checks
	$: showCountry = PUBLIC_USER_COUNTRY === 'show';
	$: showOccupation = PUBLIC_USER_OCCUPATION === 'show';
	$: showDepartment = PUBLIC_USER_DEPARTMENT === 'show';
	$: showBirthday = PUBLIC_USER_BIRTHDAY === 'show';

	// Birthday handling - extract date part from ISO datetime string
	$: birthdayValue = account?.birthday
		? parseDate(account.birthday.split('T')[0].split(' ')[0])
		: undefined;

	const saveAccount = async () => {
		if (!account) return;
		if (JSON.stringify(account) === stringAccount) return;

		if (account.phone && !isPhoneValid) {
			toast.error('Please enter a valid phone number before saving.');
			return;
		}

		try {
			const updateData: Record<string, string | boolean | undefined> = {
				phone: account.phone,
				language: account.language,
				disableNotify: account.disableNotify
			};

			// Only include fields that should be shown based on env vars
			if (showCountry) updateData.country = account.country;
			if (showOccupation) updateData.occupation = account.occupation;
			if (showOccupation) updateData.college = account.department;
			if (showDepartment) updateData.dept = account.dept;
			if (showBirthday) updateData.birthday = account.birthday;

			account = await pb.collection('users').update(account.id, updateData);
			toast.success('Account saved.');
			stringAccount = JSON.stringify(account);
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred.');
			}
		}
	};

	const handleOccupationChange = (value: string) => {
		if (!account) return;
		account.occupation = value as UsersOccupationOptions;
		saveAccount();
	};

	const handleLanguageChange = (value: string) => {
		if (!account) return;
		account.language = value as UsersLanguageOptions;
		setLocale(value as 'en' | 'zh');
		saveAccount();
	};

	const handleNotifChange = (value: boolean) => {
		if (!account) return;
		account.disableNotify = value;
		saveAccount();
	};

	const handleBirthdayChange = (value: DateValue | undefined) => {
		if (!account) return;
		account.birthday = value ? value.toString() + 'T00:00:00.000Z' : '';
		saveAccount();
	};

	const handleAvatarChange = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file || !account) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file.');
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error('File size must be less than 5MB.');
			return;
		}

		try {
			const formData = new FormData();
			formData.append('avatar', file);

			account = await pb.collection('users').update(account.id, formData);
			toast.success('Avatar updated successfully');
			stringAccount = JSON.stringify(account);
		} catch (err) {
			console.error('Avatar upload error:', err);
			toast.error('Failed to update avatar');
		}
	};

	const handleAvatarRemove = async () => {
		if (!account) return;

		try {
			account = await pb.collection('users').update(account.id, {
				avatar: null
			});
			toast.success('Avatar removed successfully');
			stringAccount = JSON.stringify(account);
		} catch (err) {
			console.error('Avatar remove error:', err);
			toast.error('Failed to remove avatar');
		}
	};

	const getAvatarUrl = (user: UsersResponse) => {
		if (!user.avatar) return null;
		return pb.files.getURL(user, user.avatar);
	};
</script>

<div class="flex items-center gap-4">
	<Button variant="outline" size="icon" class="h-7 w-7" href="/">
		<ChevronLeft class="h-4 w-4" />
		<span class="sr-only">{m.settings_back()}</span>
	</Button>
	<h1 class="text-lg font-semibold md:text-2xl">{m.settings_title()}</h1>
</div>

{#if account}
	<div class="mt-6 flex">
		<div
			class="sticky top-20 hidden h-max w-64 flex-shrink-0 flex-col gap-4 text-sm text-muted-foreground md:flex"
		>
			<a href="#account">{m.account_title()}</a>
			<a href="#preferences">{m.preferences_title()}</a>
			<a href="#notifications">{m.notifications_title()}</a>
		</div>
		<div class="flex w-full flex-col gap-2">
			<span class="text-xs text-muted-foreground">{m.auto_save_notice()}</span>
			{#if !hasPhoneNumber}
				<Alert.Root variant="destructive">
					<AlertTriangle class="h-4 w-4" />
					<Alert.Title>{m.alert_phone_required_title()}</Alert.Title>
					<Alert.Description>{m.alert_phone_required_description()}</Alert.Description>
				</Alert.Root>
			{/if}

			<Card.Root id="account">
				<Card.Header>
					<Card.Title>{m.section_basic_details()}</Card.Title>
				</Card.Header>
				<Card.Content class="grid grid-cols-2 gap-4">
					<div class="col-span-2 flex flex-col items-center gap-4">
						<div class="flex flex-col items-center gap-2">
							<Label>{m.label_avatar()}</Label>
							<div class="relative">
								{#if account.avatar}
									<img
										src={getAvatarUrl(account)}
										alt="Avatar"
										class="h-20 w-20 rounded-full border-2 border-gray-200 object-cover"
									/>
								{:else}
									<div
										class="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gray-300 bg-gray-200"
									>
										<span class="text-sm text-gray-500">{m.avatar_no_avatar()}</span>
									</div>
								{/if}
							</div>
							<div class="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									on:click={() => avatarFileInput.click()}
									class="flex items-center gap-2"
								>
									<Upload class="h-4 w-4" />
									{m.avatar_change()}
								</Button>
								{#if account.avatar}
									<Button
										variant="outline"
										size="sm"
										on:click={handleAvatarRemove}
										class="flex items-center gap-2 text-destructive hover:text-destructive"
									>
										<X class="h-4 w-4" />
										{m.avatar_remove()}
									</Button>
								{/if}
							</div>
							<input
								type="file"
								accept="image/*"
								bind:this={avatarFileInput}
								on:change={handleAvatarChange}
								class="hidden"
							/>
						</div>
					</div>
					<div>
						<Label>{m.label_name()}</Label>
						<Input class="w-full" bind:value={account.name} on:blur={saveAccount} disabled />
					</div>
					<div>
						<Label>{m.label_student_staff_id()}</Label>
						<Input class="w-full" bind:value={account.username} on:blur={saveAccount} disabled />
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>{m.section_contact_details()}</Card.Title>
				</Card.Header>
				<Card.Content class="grid grid-cols-2 gap-2">
					<div>
						<Label>{m.label_email()}</Label>
						<Input class="w-full" bind:value={account.email} on:blur={saveAccount} disabled />
						<span class="text-xs text-muted-foreground">{m.cannot_be_changed()}</span>
					</div>
					<div>
						<Label
							>{m.label_phone_number()}
							{#if account.phone && !isPhoneValid}
								<span class="text-destructive">{m.phone_invalid()}</span>
							{/if}
						</Label>
						<Input
							class="w-full"
							bind:value={account.phone}
							on:blur={saveAccount}
							placeholder={m.phone_placeholder()}
						/>
						<span class="text-xs text-muted-foreground">{m.phone_mandatory_note()}</span>
					</div>
					{#if showCountry}
						<div>
							<Label>{m.label_country()}</Label>
							<CountryPicker
								bind:value={account.country}
								lang={'en'}
								onCountryChange={saveAccount}
							/>
						</div>
					{/if}
					{#if showBirthday}
						<div>
							<Label>Birthday</Label>
							<DatePicker bind:value={birthdayValue} onValueChange={handleBirthdayChange} />
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			{#if showOccupation}
				<Card.Root>
					<Card.Header>
						<Card.Title>{m.section_occupation_details()}</Card.Title>
					</Card.Header>
					<Card.Content class="grid grid-cols-2 gap-2">
						<div class="col-span-2 mb-3">
							<RadioGroup.Root value={account.occupation} onValueChange={handleOccupationChange}>
								<div class="flex items-center space-x-2">
									<RadioGroup.Item value="student" />
									<Label>{m.occupation_student()}</Label>
								</div>
								<div class="flex items-center space-x-2">
									<RadioGroup.Item value="teacher" />
									<Label>{m.occupation_teacher()}</Label>
								</div>
							</RadioGroup.Root>
						</div>
						{#if account.occupation === 'student'}
							<div class="col-span-2">
								<Label>{m.label_college_program()}</Label>
								<CollegePicker bind:value={account.department} onCollegeChange={saveAccount} />
							</div>
							{#if showDepartment}
								<div class="col-span-2">
									<Label>Department</Label>
									<DepartmentPicker bind:value={account.dept} onDepartmentChange={saveAccount} />
								</div>
							{/if}
						{:else if account.occupation === 'teacher'}
							<div class="col-span-2">
								<Label>{m.label_college_program()}</Label>
								<CollegePicker bind:value={account.department} onCollegeChange={saveAccount} />
							</div>
							{#if showDepartment}
								<div class="col-span-2">
									<Label>Department</Label>
									<DepartmentPicker bind:value={account.dept} onDepartmentChange={saveAccount} />
								</div>
							{/if}
						{/if}
					</Card.Content>
				</Card.Root>
			{/if}

			<Card.Root id="preferences">
				<Card.Header>
					<Card.Title>{m.section_language()}</Card.Title>
				</Card.Header>
				<Card.Content class="grid grid-cols-2 gap-2">
					<div class="col-span-2">
						<RadioGroup.Root value={account.language} onValueChange={handleLanguageChange}>
							<div class="flex items-center space-x-2">
								<RadioGroup.Item value="en" />
								<Label>{m.language_option_en()}</Label>
							</div>
							<div class="flex items-center space-x-2">
								<RadioGroup.Item value="zh" />
								<Label>{m.language_option_zh()}</Label>
							</div>
						</RadioGroup.Root>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root id="notifications">
				<Card.Header>
					<Card.Title>{m.section_notifications()}</Card.Title>
				</Card.Header>
				<Card.Content class="grid grid-cols-2 gap-2">
					<div class="col-span-2 flex items-center space-x-2">
						<Switch
							id="notify-email"
							checked={account.disableNotify}
							onCheckedChange={handleNotifChange}
						/>
						<Label for="notify-email">{m.disable_notify_label()}</Label>
					</div>
				</Card.Content>
			</Card.Root>

			<div class="h-screen"></div>
		</div>
	</div>
{/if}

<script lang="ts">
	import CountryPicker from '$lib/components/country-picker.svelte';
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
	import { AlertTriangle, ChevronLeft } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	export let data;
	const { user } = data;

	let account: UsersResponse | null = user;
	let stringAccount: string | null = null;
	const phoneRegex = /^(?:\+8869\d{8}|09\d{8})$/;
	$: isPhoneValid = account?.phone ? phoneRegex.test(account.phone) : false;
	$: hasPhoneNumber = account?.phone && account.phone.trim() !== '';

	const saveAccount = async () => {
		if (!account) return;
		if (JSON.stringify(account) === stringAccount) return;

		// If phone number is provided but invalid, don't save
		if (account.phone && !isPhoneValid) {
			toast.error('Please enter a valid phone number before saving.');
			return;
		}

		try {
			account = await pb.collection('users').update(account.id, {
				phone: account.phone,
				occupation: account.occupation,
				college: account.department,
				language: account.language,
				disableNotify: account.disableNotify,
				country: account.country // Add country field
			});
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
		setLocale(value);
		saveAccount();
	};

	const handleNotifChange = (value: boolean) => {
		if (!account) return;
		account.disableNotify = value;
		saveAccount();
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
				<Card.Content class="grid grid-cols-2 gap-2">
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
					<div>
						<Label>{m.label_country()}</Label>
						<CountryPicker
							bind:value={account.country}
							lang={account.language || 'en'}
							onCountryChange={saveAccount}
						/>
					</div>
				</Card.Content>
			</Card.Root>

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
							<DepartmentPicker bind:value={account.department} onDepartmentChange={saveAccount} />
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

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

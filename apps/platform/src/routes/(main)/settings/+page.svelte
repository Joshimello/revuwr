<script lang="ts">
	import DepartmentPicker from '$lib/components/department-picker.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Switch } from '$lib/components/ui/switch';
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
				disableNotify: account.disableNotify
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
		<span class="sr-only">Back</span>
	</Button>
	<h1 class="text-lg font-semibold md:text-2xl">Settings</h1>
</div>

{#if account}
	<div class="mt-6 flex">
		<div
			class="sticky top-20 hidden h-max w-64 flex-shrink-0 flex-col gap-4 text-sm text-muted-foreground md:flex"
		>
			<a href="#account">Account</a>
			<a href="#preferences">Preferences</a>
			<a href="#notifications">Notifications</a>
		</div>
		<div class="flex w-full flex-col gap-2">
			<span class="text-xs text-muted-foreground">* All changes are saved automatically.</span>
			{#if !hasPhoneNumber}
				<Alert.Root variant="destructive">
					<AlertTriangle class="h-4 w-4" />
					<Alert.Title>Phone number required</Alert.Title>
					<Alert.Description>
						Please add a valid phone number to complete your profile. This is required for important
						communications.
					</Alert.Description>
				</Alert.Root>
			{/if}

			<Card.Root id="account">
				<Card.Header>
					<Card.Title>Basic details</Card.Title>
				</Card.Header>
				<Card.Content class="grid grid-cols-2 gap-2">
					<div>
						<Label>Name</Label>
						<Input class="w-full" bind:value={account.name} on:blur={saveAccount} disabled />
					</div>
					<div>
						<Label>Student / Staff ID</Label>
						<Input class="w-full" bind:value={account.username} on:blur={saveAccount} disabled />
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Contact details</Card.Title>
				</Card.Header>
				<Card.Content class="grid grid-cols-2 gap-2">
					<div>
						<Label>Email</Label>
						<Input class="w-full" bind:value={account.email} on:blur={saveAccount} disabled />
						<span class="text-xs text-muted-foreground">Cannot be changed.</span>
					</div>
					<div>
						<Label>
							Phone number
							{#if account.phone && !isPhoneValid}
								<span class="text-destructive">(Invalid format)</span>
							{/if}
						</Label>
						<Input
							class="w-full"
							bind:value={account.phone}
							on:blur={saveAccount}
							placeholder="+886912345678 or 0912345678"
						/>
						<span class="text-xs text-muted-foreground"
							>* Phone number is mandatory for important communications.</span
						>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Occupation details</Card.Title>
				</Card.Header>
				<Card.Content class="grid grid-cols-2 gap-2">
					<div class="col-span-2 mb-3">
						<RadioGroup.Root value={account.occupation} onValueChange={handleOccupationChange}>
							<div class="flex items-center space-x-2">
								<RadioGroup.Item value="student" />
								<Label>Student</Label>
							</div>
							<div class="flex items-center space-x-2">
								<RadioGroup.Item value="teacher" />
								<Label>Teacher</Label>
							</div>
						</RadioGroup.Root>
					</div>
					{#if account.occupation === 'student'}
						<div class="col-span-2">
							<Label>College or Institute or Program</Label>
							<DepartmentPicker bind:value={account.department} onDepartmentChange={saveAccount} />
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root id="preferences">
				<Card.Header>
					<Card.Title>Language</Card.Title>
				</Card.Header>
				<Card.Content class="grid grid-cols-2 gap-2">
					<div class="col-span-2">
						<RadioGroup.Root value={account.language} onValueChange={handleLanguageChange}>
							<div class="flex items-center space-x-2">
								<RadioGroup.Item value="en" />
								<Label>English</Label>
							</div>
							<div class="flex items-center space-x-2">
								<RadioGroup.Item value="zh" />
								<Label>Chinese</Label>
							</div>
						</RadioGroup.Root>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root id="notifications">
				<Card.Header>
					<Card.Title>Notifications</Card.Title>
				</Card.Header>
				<Card.Content class="grid grid-cols-2 gap-2">
					<div class="col-span-2 flex items-center space-x-2">
						<Switch
							id="notify-email"
							checked={account.disableNotify}
							onCheckedChange={handleNotifChange}
						/>
						<Label for="notify-email">Disable sending notifications to email</Label>
					</div>
				</Card.Content>
			</Card.Root>

			<div class="h-screen"></div>
		</div>
	</div>
{/if}

<script lang="ts">
	import { PUBLIC_USER_BIRTHDAY, PUBLIC_USER_COUNTRY } from '$env/static/public';
	import CountryPicker from '$lib/components/country-picker.svelte';
	import DatePicker from '$lib/components/date-picker.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { m } from '$lib/paraglide/messages.js';
	import type { DateValue } from '@internationalized/date';

	export let values: {
		language: string;
		name: string;
		username: string;
		email: string;
		country: string;
		phone: string;
		birthday: DateValue | undefined;
		occupation: string;
		department: string;
		dept: string;
	};

	$: showCountry = PUBLIC_USER_COUNTRY === 'show';
	$: showBirthday = PUBLIC_USER_BIRTHDAY === 'show';

	const phoneRegex = /^(?:\+8869\d{8}|09\d{8})$/;
	$: isPhoneValid = phoneRegex.test(values.phone);
</script>

<div class="grid grid-cols-2 gap-6">
	<div class="flex-1">
		<Label>{m.onboard_fullname()}</Label>
		<Input type="text" bind:value={values.name} disabled />
	</div>
	<div class="flex-1">
		<Label>{m.onboard_student_staff_id()}</Label>
		<Input type="text" bind:value={values.username} disabled />
	</div>
	<div class="flex-1">
		<Label>{m.onboard_email()}</Label>
		<Input type="text" bind:value={values.email} disabled />
	</div>
	<div class="flex-1">
		<Label>
			{m.onboard_phone()}
			{#if values.phone && !isPhoneValid}
				<span class:text-destructive={true}>{m.onboard_phone_invalid()}</span>
			{/if}
		</Label>
		<Input type="text" bind:value={values.phone} />
	</div>
	{#if showCountry}
		<div class="flex-1">
			<Label>{m.onboard_country()}</Label>
			<CountryPicker bind:value={values.country} lang={'en'} />
		</div>
	{/if}
	{#if showBirthday}
		<div class="flex-1">
			<Label>Birthday</Label>
			<DatePicker bind:value={values.birthday} onValueChange={(v) => (values.birthday = v)} />
		</div>
	{/if}
</div>

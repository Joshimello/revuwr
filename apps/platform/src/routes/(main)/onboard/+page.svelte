<script lang="ts">
	import {
		PUBLIC_USER_COUNTRY,
		PUBLIC_USER_DEPARTMENT,
		PUBLIC_USER_OCCUPATION
	} from '$env/static/public';
	import CollegePicker from '$lib/components/college-picker.svelte';
	import CountryPicker from '$lib/components/country-picker.svelte';
	import DepartmentPicker from '$lib/components/department-picker.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, setLocale } from '$lib/paraglide/runtime.js';
	import { ArrowLeft, ArrowRight, Bird, BriefcaseBusiness, UserPen } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	export let data;
	const { user } = data;

	$: stages = [
		{
			title: m.onboard_welcome_title(),
			description: m.onboard_welcome_description(),
			icon: Bird
		},
		{
			title: m.onboard_basic_info_title(),
			description: m.onboard_basic_info_description(),
			icon: UserPen
		},
		{
			title: m.onboard_occupation_title(),
			description: m.onboard_occupation_description(),
			icon: BriefcaseBusiness
		}
	];

	let page = 0;

	$: showCountry = PUBLIC_USER_COUNTRY === 'show';
	$: showOccupation = PUBLIC_USER_OCCUPATION === 'show';
	$: showDepartment = PUBLIC_USER_DEPARTMENT === 'show';

	let values = {
		language: getLocale(),
		name: user?.name,
		username: user?.username,
		email: user?.email,
		country: '',
		phone: '',
		occupation: PUBLIC_USER_OCCUPATION === 'show' ? '' : 'student',
		department: '',
		dept: PUBLIC_USER_DEPARTMENT === 'show' ? '' : ''
	};

	let isLoading = false;

	const phoneRegex = /^(?:\+8869\d{8}|09\d{8})$/;
	$: isPhoneValid = phoneRegex.test(values.phone);
</script>

<Card.Root>
	<Card.Header>
		<svelte:component this={stages[page].icon} size="64" strokeWidth="1" class="my-6" />
		<Card.Title>
			{stages[page].title}
		</Card.Title>
		<Card.Description class="max-w-md">
			{#if page == 2 && !showOccupation}
				{m.onboard_occupation_description_general()}
			{:else}
				{stages[page].description}
			{/if}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if page == 0}
			<div class="flex w-full gap-6">
				<ToggleGroup.Root
					variant="outline"
					type="single"
					class="grid w-full grid-cols-2"
					bind:value={values.language}
					onValueChange={(v) => {
						if (getLocale() != v) {
							setLocale(v, {
								reload: true
							});
						}
					}}
				>
					<ToggleGroup.Item
						value="en"
						class="h-20 data-[state=on]:bg-foreground data-[state=on]:text-background"
					>
						{m.language_option_en()}
					</ToggleGroup.Item>
					<ToggleGroup.Item
						value="zh"
						class="h-20 data-[state=on]:bg-foreground data-[state=on]:text-background"
					>
						{m.language_option_zh()}
					</ToggleGroup.Item>
				</ToggleGroup.Root>
			</div>
		{:else if page == 1}
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
			</div>
		{:else if page == 2}
			<div class="flex w-full flex-col gap-6">
				{#if showOccupation}
					<ToggleGroup.Root
						variant="outline"
						type="single"
						class="grid w-full grid-cols-2"
						bind:value={values.occupation}
					>
						<ToggleGroup.Item
							value="student"
							class="h-20 data-[state=on]:bg-foreground data-[state=on]:text-background"
						>
							{m.onboard_student()}
						</ToggleGroup.Item>
						<ToggleGroup.Item
							value="teacher"
							class="h-20 data-[state=on]:bg-foreground data-[state=on]:text-background"
						>
							{m.onboard_staff()}
						</ToggleGroup.Item>
					</ToggleGroup.Root>
				{/if}
				{#if values.occupation == 'student'}
					<div class="grid grid-cols-1 gap-6">
						<div class="flex-1">
							<Label>{m.onboard_department()}</Label>
							<CollegePicker bind:value={values.department} />
						</div>
						{#if showDepartment}
							<div class="flex-1">
								<Label>Department</Label>
								<DepartmentPicker bind:value={values.dept} />
							</div>
						{/if}
					</div>
				{:else if values.occupation == 'teacher'}
					<div class="grid grid-cols-1 gap-6">
						<div class="flex-1">
							<Label>{m.onboard_department()}</Label>
							<CollegePicker bind:value={values.department} />
						</div>
						{#if showDepartment}
							<div class="flex-1">
								<Label>Department</Label>
								<DepartmentPicker bind:value={values.dept} />
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</Card.Content>
	<Card.Footer class="flex justify-end gap-2">
		{#if page == 0}
			<Button
				class="flex w-full items-center gap-2 md:w-auto"
				disabled={!values.language}
				on:click={() => (page = 1)}
			>
				{m.onboard_next()}
				<ArrowRight size="16" />
			</Button>
		{:else if page == 1}
			<Button class="flex items-center gap-2" on:click={() => (page = 0)}>
				<ArrowLeft size="16" />
				{m.onboard_back()}
			</Button>
			<Button
				class="flex w-full items-center gap-2 md:w-auto"
				disabled={!(
					values.name &&
					values.username &&
					isPhoneValid &&
					values.email &&
					(showCountry ? values.country : true)
				)}
				on:click={() => (page = 2)}
			>
				{m.onboard_next()}
				<ArrowRight size="16" />
			</Button>
		{:else if page == 2}
			<Button class="flex items-center gap-2" on:click={() => (page = 1)}>
				<ArrowLeft size="16" />
				{m.onboard_back()}
			</Button>
			<form
				action=""
				method="post"
				on:submit={() => {
					isLoading = true;
					toast.loading(m.onboard_updating_profile());
				}}
			>
				<input type="hidden" value={values.language} name="language" />
				<input type="hidden" value={values.phone} name="phone" />
				<input type="hidden" value={values.country} name="country" />
				<input type="hidden" value={values.occupation} name="occupation" />
				<input type="hidden" value={values.department} name="department" />
				<input type="hidden" value={values.dept} name="dept" />
				<Button
					type="submit"
					class="flex w-full items-center gap-2 md:w-auto"
					disabled={isLoading ||
						(showOccupation && !values.occupation) ||
						!values.department ||
						(showDepartment && !values.dept)}
				>
					{m.onboard_finish()}
					<ArrowRight size="16" />
				</Button>
			</form>
		{/if}
	</Card.Footer>
</Card.Root>

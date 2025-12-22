<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { m } from '$lib/paraglide/messages.js';
	import { ArrowLeft, ArrowRight, Bird, BriefcaseBusiness, UserPen } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { toast } from 'svelte-sonner';

	import {
		PUBLIC_USER_BIRTHDAY,
		PUBLIC_USER_COUNTRY,
		PUBLIC_USER_DEPARTMENT,
		PUBLIC_USER_OCCUPATION
	} from '$env/static/public';
	import type { DateValue } from '@internationalized/date';
	import BasicInfoStep from './basic-info-step.svelte';
	import LanguageStep from './language-step.svelte';
	import OccupationStep from './occupation-step.svelte';

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

	const dispatch = createEventDispatcher<{
		submit: typeof values;
	}>();

	let currentStep = 0;
	let isLoading = false;

	// Step validation states - computed reactively
	$: canProceedFromBasicInfo =
		values.name &&
		values.username &&
		/^(?:\+8869\d{8}|09\d{8})$/.test(values.phone) &&
		values.email &&
		(PUBLIC_USER_COUNTRY === 'show' ? values.country : true) &&
		(PUBLIC_USER_BIRTHDAY === 'show' ? values.birthday : true);

	$: canProceedFromOccupation =
		(PUBLIC_USER_OCCUPATION === 'show' ? !!values.occupation : true) &&
		!!values.department &&
		(PUBLIC_USER_DEPARTMENT === 'show' ? !!values.dept : true);

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
			description:
				PUBLIC_USER_OCCUPATION === 'show'
					? m.onboard_occupation_description()
					: m.onboard_occupation_description_general(),
			icon: BriefcaseBusiness
		}
	];

	function nextStep() {
		if (currentStep < stages.length - 1) {
			currentStep++;
		}
	}

	function previousStep() {
		if (currentStep > 0) {
			currentStep--;
		}
	}

	function handleSubmit() {
		isLoading = true;
		toast.loading(m.onboard_updating_profile());
		dispatch('submit', values);
	}

	// Validation computed properties
	$: canProceedFromLanguage = !!values.language;
	$: canSubmit = canProceedFromOccupation;
</script>

<Card.Root>
	<Card.Header>
		<svelte:component this={stages[currentStep].icon} size="64" strokeWidth="1" class="my-6" />
		<Card.Title>
			{stages[currentStep].title}
		</Card.Title>
		<Card.Description class="max-w-md">
			{stages[currentStep].description}
		</Card.Description>
	</Card.Header>

	<Card.Content>
		{#if currentStep === 0}
			<LanguageStep bind:value={values.language} />
		{:else if currentStep === 1}
			<BasicInfoStep bind:values />
		{:else if currentStep === 2}
			<OccupationStep bind:values />
		{/if}
	</Card.Content>

	<Card.Footer class="flex justify-end gap-2">
		{#if currentStep === 0}
			<Button
				class="flex w-full items-center gap-2 md:w-auto"
				disabled={!canProceedFromLanguage}
				on:click={nextStep}
			>
				{m.onboard_next()}
				<ArrowRight size="16" />
			</Button>
		{:else if currentStep === 1}
			<Button class="flex items-center gap-2" on:click={previousStep}>
				<ArrowLeft size="16" />
				{m.onboard_back()}
			</Button>
			<Button
				class="flex w-full items-center gap-2 md:w-auto"
				disabled={!canProceedFromBasicInfo}
				on:click={nextStep}
			>
				{m.onboard_next()}
				<ArrowRight size="16" />
			</Button>
		{:else if currentStep === 2}
			<Button class="flex items-center gap-2" on:click={previousStep}>
				<ArrowLeft size="16" />
				{m.onboard_back()}
			</Button>
			<Button
				type="button"
				class="flex w-full items-center gap-2 md:w-auto"
				disabled={isLoading || !canSubmit}
				on:click={handleSubmit}
			>
				{m.onboard_finish()}
				<ArrowRight size="16" />
			</Button>
		{/if}
	</Card.Footer>
</Card.Root>

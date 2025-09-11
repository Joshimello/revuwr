<script lang="ts">
	import { PUBLIC_USER_DEPARTMENT, PUBLIC_USER_OCCUPATION } from '$env/static/public';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import OnboardingStepper from './components/onboarding-stepper.svelte';

	export let data;
	const { user } = data;

	let values = {
		language: getLocale(),
		name: user?.name || '',
		username: user?.username || '',
		email: user?.email || '',
		country: '',
		phone: '',
		birthday: undefined,
		occupation: PUBLIC_USER_OCCUPATION === 'show' ? '' : 'student',
		department: '',
		dept: PUBLIC_USER_DEPARTMENT === 'show' ? '' : ''
	};

	function handleSubmit(event: CustomEvent) {
		// Create form element and submit
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '';

		// Add form data
		const formData = event.detail;
		Object.entries(formData).forEach(([key, value]) => {
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = key;
			// Convert DateValue to ISO string for birthday field
			if (key === 'birthday' && value) {
				input.value = value.toString();
			} else {
				input.value = String(value);
			}
			form.appendChild(input);
		});

		document.body.appendChild(form);
		form.submit();
	}
</script>

<OnboardingStepper bind:values on:submit={handleSubmit} />

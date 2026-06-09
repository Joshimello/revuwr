<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Dialog from '$lib/components/ui/dialog';
	import { m } from '$lib/paraglide/messages';
	import { redirectToLogin } from '$lib/utils/redirect';
	import { toast } from 'svelte-sonner';
	import type { Event, User } from './types';

	export let event: Event;
	export let user: User;
	export let disabled = false;
	export let size: 'default' | 'sm' | 'lg' = 'lg';

	const notStarted = new Date(event.startDate) > new Date();
	const isEnded = new Date(+new Date(event.endDate) + 86400000) < new Date();
	const canApply =
		(notStarted && event.beforeStartDate == 'allow') ||
		(isEnded && event.afterStartDate == 'allow') ||
		(!notStarted && !isEnded);

	let isCreating = false;
	let termsOpen = false;
	let checked: boolean[] = [];

	$: isAllChecked = checked.every((i) => i === true);
	$: hasTerms = event.terms && event.terms.length > 0;

	const handleLogin = () => {
		redirectToLogin($page.url.pathname);
	};

	const submitApplication = () => {
		isCreating = true;
		toast.loading(m.create_creating_application(), {
			duration: Number.POSITIVE_INFINITY
		});
		// Create a form element and submit it
		const form = document.createElement('form');
		form.method = 'post';
		form.action = '';
		document.body.appendChild(form);
		form.submit();
	};

	const handleApplyClick = () => {
		if (!user) {
			handleLogin();
		} else if (hasTerms) {
			termsOpen = true;
		} else {
			submitApplication();
		}
	};

	const getButtonText = () => {
		if (notStarted && event.beforeStartDate == 'disallow') {
			return m.create_event_not_started();
		} else if (isEnded && event.afterStartDate == 'disallow') {
			return m.create_event_ended();
		} else if (!user) {
			return m.create_login_to_continue();
		} else {
			return m.create_apply_now();
		}
	};
</script>

<Button
	{size}
	type="submit"
	disabled={disabled || isCreating || (!canApply && !!user)}
	on:click={handleApplyClick}
	class="w-full"
>
	{getButtonText()}
</Button>

<Dialog.Root bind:open={termsOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{m.create_terms_title()}</Dialog.Title>
			<Dialog.Description>
				{m.create_terms_description()}
			</Dialog.Description>
		</Dialog.Header>
		<div class="flex flex-col gap-2">
			{#each event.terms || [] as term, index}
				<div class="flex gap-2">
					<Checkbox bind:checked={checked[index]} class="mr-2 mt-2" />
					<div>
						<!-- eslint-disable-next-line -->
						<p class="font-semibold">{@html term.title}</p>
						<!-- eslint-disable-next-line -->
						<p>{@html term.description}</p>
					</div>
				</div>
			{/each}
		</div>
		<Dialog.Footer>
			<Button
				class="mt-6"
				size="lg"
				disabled={isCreating || !canApply || !isAllChecked || !user}
				on:click={submitApplication}
			>
				{#if notStarted && event.beforeStartDate == 'disallow'}
					{m.create_event_not_started()}
				{:else if isEnded && event.afterStartDate == 'disallow'}
					{m.create_event_ended()}
				{:else}
					{m.create_apply_now()}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<script lang="ts">
	import { page } from '$app/stores';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { m } from '$lib/paraglide/messages.js';
	import { pbImage } from '$lib/pocketbase/client';
	import { redirectToLogin } from '$lib/utils/redirect';
	import { CircleAlertIcon } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	export let data, form;
	const { event, user } = data;
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
</script>

{#if form}
	<Alert.Root variant="destructive">
		<CircleAlertIcon class="size-4" />

		<Alert.Title>{m.error_unable_to_create_application()}</Alert.Title>
		<Alert.Description>
			{form.message}
		</Alert.Description>
	</Alert.Root>
{/if}

<Card.Root>
	{#if event.image}
		<div class="h-64 w-full p-2">
			<img
				src={pbImage(event.collectionId, event.id, event.image)}
				alt={event.name}
				class="h-full w-full rounded-lg border object-cover"
			/>
		</div>
	{/if}
	<Card.Header class="pt-2">
		<Card.Title class="text-2xl">
			{event.name}
		</Card.Title>
		<Card.Description class="whitespace-pre-line">
			{event.description}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<Table.Root class="border">
			<Table.Header>
				<Table.Row>
					<Table.Head>{m.create_event_target()}</Table.Head>
					<Table.Head>{m.create_event_duration()}</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				<Table.Row>
					<Table.Cell class="capitalize">{event.targetAudience}</Table.Cell>
					<Table.Cell>
						{new Date(event.startDate).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						})} &nbsp; -> &nbsp;
						{new Date(event.endDate).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						})}
					</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
		<div class="mt-6">
			<span>{m.create_more_info()} &nbsp; -> &nbsp;&nbsp;</span>
			<a
				href={event.moreInfo}
				target="_blank"
				rel="noopener noreferrer"
				class="text-blue-500 underline"
				>{event.moreInfo}
			</a>
		</div>
	</Card.Content>
	<Card.Footer class="justify-end">
		<Button
			size="lg"
			type="submit"
			disabled={isCreating || (!canApply && !!user)}
			on:click={handleApplyClick}
		>
			{#if notStarted && event.beforeStartDate == 'disallow'}
				{m.create_event_not_started()}
			{:else if isEnded && event.afterStartDate == 'disallow'}
				{m.create_event_ended()}
			{:else if !user}
				{m.create_login_to_continue()}
			{:else}
				{m.create_apply_now()}
			{/if}
		</Button>
	</Card.Footer>
</Card.Root>

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
						<p class="font-semibold">{@html term.title}</p>
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

<script lang="ts">
	import Status from '$lib/components/status.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { pbImage } from '$lib/pocketbase/client';
	import { ChevronLeft, CircleAlertIcon, ExternalLinkIcon } from 'lucide-svelte';
	import ApplyButton from './apply-button.svelte';

	export let data, form;
	const { event, user, applications } = data;

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	const formatDateTime = (date: string) => {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	// Date logic from apply-button
	const notStarted = new Date(event.startDate) > new Date();
	const isEnded = new Date(+new Date(event.endDate) + 86400000) < new Date();
	const getCurrentPhase = () => {
		if (notStarted) return 'before';
		if (isEnded) return 'after';
		return 'during';
	};

	const getRegistrationStatus = () => {
		const phase = getCurrentPhase();
		if (phase === 'before' && event.beforeStartDate === 'allow') {
			return { text: m.create_registration_open(), color: 'blue', active: true };
		}
		if (phase === 'during') {
			return { text: m.create_registration_in_progress(), color: 'blue', active: true };
		}
		if (phase === 'after' && event.afterStartDate === 'allow') {
			return { text: m.create_late_registration_open(), color: 'yellow', active: true };
		}
		return { text: m.create_registration_closed(), color: 'gray', active: false };
	};

	const registrationStatus = getRegistrationStatus();
</script>

<div class="mb-6 flex items-center gap-4">
	<Button variant="outline" size="icon" class="h-7 w-7" href="/">
		<ChevronLeft class="h-4 w-4" />
		<span class="sr-only">Back</span>
	</Button>
</div>

<!-- Header Section -->
<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
	<!-- Event Image -->
	{#if event.image}
		<div class="lg:col-span-1">
			<div class="aspect-square overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-900/10">
				<img
					src={pbImage(event.collectionId, event.id, event.image)}
					alt={event.name}
					class="h-full w-full object-cover"
				/>
			</div>
		</div>
	{/if}

	<!-- Event Details -->
	<div class={event.image ? 'lg:col-span-2' : 'lg:col-span-3'}>
		<div class="flex flex-col space-y-6">
			<!-- Title -->
			<h1 class="text-2xl font-bold text-slate-900 sm:text-4xl">
				{event.name}
			</h1>

			<!-- Description -->
			<div class="prose prose-slate max-w-none">
				<p class="whitespace-pre-line text-slate-600">
					{event.description}
				</p>
			</div>
		</div>
	</div>
</div>

<!-- More Info Section -->
{#if event.moreInfo}
	<Card.Root class="mt-4">
		<Card.Header>
			<Card.Title>{m.create_more_info()}</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="flex items-center space-x-3">
				<ExternalLinkIcon class="h-5 w-5 text-slate-400" />
				<a
					href={event.moreInfo}
					target="_blank"
					rel="noopener noreferrer"
					class="font-medium text-blue-600 underline underline-offset-2 transition-colors hover:text-blue-800"
				>
					{event.moreInfo}
				</a>
			</div>
		</Card.Content>
	</Card.Root>
{/if}

<!-- Event Timeline/Details -->
<Card.Root class="mt-4">
	<Card.Header>
		<Card.Title>{m.create_event_timeline()}</Card.Title>
	</Card.Header>
	<Card.Content>
		<div class="space-y-4">
			<!-- Registration Status -->
			<div class="flex items-center space-x-4">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full {registrationStatus.color ===
					'blue'
						? 'bg-blue-100'
						: registrationStatus.color === 'yellow'
							? 'bg-yellow-100'
							: 'bg-gray-100'}"
				>
					<div
						class="h-2 w-2 rounded-full {registrationStatus.color === 'blue'
							? 'bg-blue-600'
							: registrationStatus.color === 'yellow'
								? 'bg-yellow-600'
								: 'bg-gray-600'}"
					></div>
				</div>
				<div>
					<p class="font-medium text-slate-900">{registrationStatus.text}</p>
					<p class="text-sm text-slate-500">
						{#if registrationStatus.active}
							{m.create_applications_currently_accepted()}
						{:else if notStarted && event.beforeStartDate === 'disallow'}
							{m.create_applications_open_when_event_starts()}
						{:else if isEnded && event.afterStartDate === 'disallow'}
							{m.create_applications_closed_when_event_ended()}
						{:else}
							{m.create_applications_not_available()}
						{/if}
					</p>
				</div>
			</div>

			<!-- Event Start -->
			<div class="flex items-center space-x-4">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full {notStarted
						? 'bg-gray-100'
						: isEnded
							? 'bg-green-100'
							: 'bg-green-100'}"
				>
					<div
						class="h-2 w-2 rounded-full {notStarted
							? 'bg-gray-600'
							: isEnded
								? 'bg-green-600'
								: 'bg-green-600'}"
					></div>
				</div>
				<div>
					<p class="font-medium text-slate-900">
						{#if notStarted}
							{m.create_registration_opens()}
						{:else if isEnded}
							{m.create_registration_period_ended()}
						{:else}
							{m.create_registration_in_progress_label()}
						{/if}
					</p>
					<p class="text-sm text-slate-500">
						{#if notStarted}
							{m.create_opens_on({ date: formatDate(event.startDate) })}
						{:else if isEnded}
							{m.create_ended({ date: formatDate(event.endDate) })}
						{:else}
							{m.create_started({ date: formatDate(event.startDate) })}
							<span
								class="ml-1 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
							>
								{m.create_badge_open()}
							</span>
						{/if}
					</p>
				</div>
			</div>

			<!-- Event End -->
			<div class="flex items-center space-x-4">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full {isEnded
						? 'bg-gray-100'
						: 'bg-gray-100'}"
				>
					<div class="h-2 w-2 rounded-full bg-gray-600"></div>
				</div>
				<div>
					<p class="font-medium text-slate-900">
						{#if isEnded}
							{m.create_registration_closed_label()}
						{:else}
							{m.create_registration_closes()}
						{/if}
					</p>
					<p class="text-sm text-slate-500">
						{#if isEnded}
							{m.create_closed({ date: formatDate(event.endDate) })}
							<span
								class="ml-1 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
							>
								{m.create_badge_closed()}
							</span>
						{:else}
							{m.create_closes({ date: formatDate(event.endDate) })}
						{/if}
					</p>
				</div>
			</div>
		</div>
	</Card.Content>
</Card.Root>

<!-- User Applications -->
{#if user && applications && applications.length > 0}
	<Card.Root class="mt-4">
		<Card.Header>
			<Card.Title>{m.create_your_applications()}</Card.Title>
			<Card.Description>{m.create_your_applications_description()}</Card.Description>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>{m.application_name()}</Table.Head>
						<Table.Head>{m.create_application_status()}</Table.Head>
						<Table.Head>{m.create_application_created()}</Table.Head>
						<Table.Head>{m.create_application_updated()}</Table.Head>
						<Table.Head class="text-right">{m.create_application_actions()}</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each applications as application}
						<Table.Row>
							<Table.Cell class="font-medium">
								{application.reprAnswer || ''}
							</Table.Cell>
							<Table.Cell>
								<Status type={application.status} />
							</Table.Cell>
							<Table.Cell>
								<relative-time
									datetime={application.created}
									tense="past"
									lang={getLocale() === 'zh' ? 'zh-Hant' : 'en-US'}
								>
									{application.created}
								</relative-time>
							</Table.Cell>
							<Table.Cell>
								<relative-time
									datetime={application.updated}
									tense="past"
									lang={getLocale() === 'zh' ? 'zh-Hant' : 'en-US'}
								>
									{application.created}
								</relative-time>
							</Table.Cell>
							<Table.Cell class="text-right">
								<Button variant="outline" size="sm" href="/application/{application.id}">
									{m.create_application_view()}
								</Button>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
{:else if user && applications && applications.length === 0}
	<Card.Root class="mt-4">
		<Card.Header>
			<Card.Title>{m.create_your_applications()}</Card.Title>
			<Card.Description>{m.create_your_applications_description()}</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="py-8 text-center">
				<div class="mb-2 text-slate-400">
					<CircleAlertIcon class="mx-auto h-12 w-12" />
				</div>
				<h3 class="mb-1 text-lg font-medium text-slate-900">{m.create_no_applications()}</h3>
				<p class="text-slate-500">{m.create_no_applications_description()}</p>
			</div>
		</Card.Content>
	</Card.Root>
{/if}

<!-- Error Alert -->
{#if form}
	<div class="mx-auto max-w-7xl px-6 py-6 lg:px-8">
		<Alert.Root variant="destructive" class="mb-6">
			<CircleAlertIcon class="size-4" />
			<Alert.Title>{m.error_unable_to_create_application()}</Alert.Title>
			<Alert.Description>
				{form.message}
			</Alert.Description>
		</Alert.Root>
	</div>
{/if}

<div class="mt-4">
	<ApplyButton {event} {user} />
</div>

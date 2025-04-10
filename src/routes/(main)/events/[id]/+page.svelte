<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_BASE_PATH, PUBLIC_PLATFORM_URL } from '$env/static/public';
	import Status from '$lib/components/status.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Table from '$lib/components/ui/table';
	import * as m from '$lib/paraglide/messages.js';
	import { pb } from '$lib/pocketbase/client';
	import type {
		ApplicationsResponse,
		EventsResponse,
		ReviewsResponse,
		UsersResponse
	} from '$lib/pocketbase/pocketbase-types';
	import {
		ArrowUpRight,
		ChevronLeft,
		CirclePlus,
		Grid2x2Check,
		Link2,
		ListChecks,
		ListPlus,
		Mail,
		Settings,
		SquareArrowOutUpRight
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	type ExpandedApplications = ApplicationsResponse<{
		responder: UsersResponse;
	}>;

	type ExpandedReviews = ReviewsResponse<Record<string, { status: string; comment: string }>>;

	let id = $page.params.id;
	let event: EventsResponse | null = null;
	let applications: ExpandedApplications[] = [];
	let reviews: ExpandedReviews[] = [];

	const handleCopyFormURL = () => {
		const formURL = `${PUBLIC_PLATFORM_URL}/create/${id}`;
		navigator.clipboard.writeText(formURL);
		toast.success('Form URL copied to clipboard');
	};

	onMount(async () => {
		try {
			event = await pb.collection('events').getOne(id);
			applications = (
				await pb.collection('applications').getList<ExpandedApplications>(1, 7, {
					sort: '-created',
					filter: `event="${id}"`,
					expand: 'responder'
				})
			).items;
			reviews = await pb.collection('reviews').getFullList<ExpandedReviews>({
				filter: `applications.event?~"${$page.params.id}"`,
				sort: '-created'
			});
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
				console.error(err);
			}
		}
	});
</script>

<div class="flex items-center gap-4">
	<Button variant="outline" size="icon" class="h-7 w-7" href="{PUBLIC_BASE_PATH}/events">
		<ChevronLeft class="h-4 w-4" />
		<span class="sr-only">Back</span>
	</Button>
	<h1 class="text-lg font-semibold md:text-2xl">
		{#if event}
			{event.name}
		{:else}
			<Skeleton class="h-7 w-72 md:h-8" />
		{/if}
	</h1>
</div>

<div class="flex flex-col-reverse gap-x-8 gap-y-4 lg:flex-row">
	<div class="flex flex-1 flex-col gap-4 lg:gap-8">
		<Card.Root class="xl:col-span-2">
			<Card.Header class="flex flex-row items-center">
				<div class="grid gap-2">
					<Card.Title>
						{m.event_responses()}
					</Card.Title>
					<Card.Description>
						{m.event_responses_desc()}
					</Card.Description>
				</div>
				<Button
					href={event ? `${PUBLIC_BASE_PATH}/events/${event.id}/responses` : ''}
					size="sm"
					class="ml-auto gap-1"
				>
					{m.view_all()}
					<ArrowUpRight class="h-4 w-4" />
				</Button>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>
								{m.serial_id()}
							</Table.Head>
							<Table.Head class="">
								{m.user()}
							</Table.Head>
							<Table.Head class="">
								{m.status()}
							</Table.Head>
							<Table.Head class="text-right">
								{m.updated()}
							</Table.Head>
							<Table.Head class="w-0"></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each applications as application}
							<Table.Row>
								<Table.Cell>
									<div class="font-medium">
										{#if application.serial}
											{`${event?.responsePrefix}${application.serial.toString().padStart(3, '0')}`}
										{/if}
									</div>
									<div class="text-xs text-muted-foreground">
										{application.id}
									</div>
								</Table.Cell>
								<Table.Cell>
								<div class="font-medium">
									{application.expand?.responder?.name || 'Unknown user'}
								</div>
								<div class="hidden text-xs text-muted-foreground md:inline">
									{application.expand?.responder?.email || 'No email'}
								</div>
								</Table.Cell>
								<Table.Cell class="">
									<Status type={application.status} />
								</Table.Cell>
								<Table.Cell class="text-right text-xs">
									{new Date(application.updated).toLocaleString('en-US', {
										year: 'numeric',
										month: 'short',
										day: 'numeric',
										hour: 'numeric',
										minute: 'numeric',
										hour12: true
									})}
								</Table.Cell>
								<Table.Cell class="text-right">
									<Button
										size="icon"
										variant="ghost"
										href={`${PUBLIC_BASE_PATH}/response/${application.id}`}
									>
										<SquareArrowOutUpRight size="16" />
									</Button>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>

		<Card.Root class="xl:col-span-2">
			<Card.Header class="flex flex-row items-center">
				<div class="grid gap-2">
					<Card.Title>
						{m.review_requests()}
					</Card.Title>
					<Card.Description>
						{m.review_requests_desc()}
					</Card.Description>
				</div>
				<Button
					href={event ? `${PUBLIC_BASE_PATH}/events/${event.id}/overview` : ''}
					size="sm"
					class="ml-auto gap-1"
				>
					<Grid2x2Check size="16" />
					{m.review_overview()}
				</Button>
				<Button
					href={event ? `${PUBLIC_BASE_PATH}/events/${event.id}/reviews/new` : ''}
					size="sm"
					class="ml-1 gap-1"
				>
					<CirclePlus size="16" />
					{m.new_review()}
				</Button>
				<Button
					href={event ? `${PUBLIC_BASE_PATH}/events/${event.id}/reviews` : ''}
					size="sm"
					class="ml-1 gap-1"
				>
					{m.view_all()}
					<ArrowUpRight size="16" />
				</Button>
			</Card.Header>
			<Card.Content class="overflow-auto">
				<Table.Root class="">
					<Table.Header>
						<Table.Row>
							<Table.Head>
								{m.reviewer()}
							</Table.Head>
							<Table.Head>
								{m.status()}
							</Table.Head>
							<Table.Head>
								{m.stats()}
							</Table.Head>
							<Table.Head class="text-right">
								{m.created()}
							</Table.Head>
							<Table.Head class="w-0"></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each reviews as review}
							<Table.Row>
								<Table.Cell>
								<div class="font-medium">{review.reviewerEmail || 'Unknown reviewer'}</div>
								</Table.Cell>
								<Table.Cell>
									<Status type={review.status} />
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-1">
									<Badge class="flex w-6 justify-end bg-lime-200 p-1" variant="outline">
										{Object.values(review.review || {}).filter((i) => i?.status === 'approved')
											.length}
									</Badge>
									<Badge class="flex w-6 justify-end bg-orange-200 p-1" variant="outline">
										{Object.values(review.review || {}).filter(
											(i) => i?.status === 'editsRequested'
										).length}
									</Badge>
									<Badge class="flex w-6 justify-end bg-red-200 p-1" variant="outline">
										{Object.values(review.review || {}).filter((i) => i?.status === 'rejected')
											.length}
									</Badge>
									<Badge class="flex w-6 justify-end p-1" variant="outline">
										{(review.applications || []).filter((i) => !Object.keys(review.review || {}).includes(i)).length}
									</Badge>
									</div>
								</Table.Cell>
								<Table.Cell class="text-right text-xs">
									{new Date(review.created).toLocaleString('en-US', {
										year: 'numeric',
										month: 'short',
										day: 'numeric',
										hour: 'numeric',
										minute: 'numeric',
										hour12: true
									})}
								</Table.Cell>
								<Table.Cell>
									<Button
										size="icon"
										variant="ghost"
										on:click={() => {
											navigator.clipboard.writeText(`${PUBLIC_PLATFORM_URL}/review/${review.id}`);
											toast.success('Link copied ' + `${PUBLIC_PLATFORM_URL}/review/${review.id}`);
										}}
									>
										<Link2 size="16" />
									</Button>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</div>
	<div class="flex-shrink-0 lg:w-64">
		<Card.Root>
			<Card.Content class="grid grid-cols-2 gap-2 pt-6 lg:grid-cols-1">
				<Button
					class="flex w-full items-center justify-start gap-2"
					href={event ? `${PUBLIC_BASE_PATH}/events/${event.id}/settings` : ''}
				>
					<Settings size="18" />
					{m.settings()}
				</Button>
				<Button
					class="flex w-full items-center justify-start gap-2"
					href={event ? `${PUBLIC_BASE_PATH}/events/${event.id}/questions` : ''}
				>
					<ListPlus size="18" />
					{m.questions()}
					<Badge variant="secondary" class="ml-3">
						{event ? event.questions.length : 0}
					</Badge>
				</Button>
				<Button
					class="flex w-full items-center justify-start gap-2"
					href={event ? `${PUBLIC_BASE_PATH}/events/${event.id}/terms` : ''}
				>
					<ListChecks size="18" />
					{m.terms()}
				</Button>
				<Button
					class="flex w-full items-center justify-start gap-2"
					href={event ? `${PUBLIC_BASE_PATH}/events/${event.id}/mailing` : ''}
				>
					<Mail size="18" />
					Mailing
				</Button>
				<Button
					class="flex w-full items-center justify-start gap-2"
					variant="secondary"
					on:click={handleCopyFormURL}
				>
					<Link2 size="18" />
					{m.copy_form_url()}
				</Button>
			</Card.Content>
		</Card.Root>
	</div>
</div>

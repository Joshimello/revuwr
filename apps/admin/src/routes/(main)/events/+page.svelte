<script lang="ts">
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as m from '$lib/paraglide/messages.js';
	import { pb, pbImage } from '$lib/pocketbase/client';
	import type { EventsResponse } from '$lib/pocketbase/pocketbase-types';
	import {
		CirclePlus,
		ClipboardCheck,
		ListPlus,
		MessageSquareReply,
		Settings2
	} from 'lucide-svelte';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let events: EventsResponse[] = [];
	let isLoading: boolean = true;

	onMount(async () => {
		try {
			events = await pb.collection('events').getFullList();
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
				console.error(err);
			}
		}
		isLoading = false;
	});
</script>

<div class="flex items-center">
	<h1 class="text-lg font-semibold md:text-2xl">
		{m.events()}
	</h1>
</div>

<Tabs.Root value="active">
	<div class="flex items-center">
		<Tabs.List>
			<Tabs.Trigger value="active">
				{m.active()}
			</Tabs.Trigger>
			<Tabs.Trigger value="archived">
				{m.archived()}
			</Tabs.Trigger>
		</Tabs.List>
		<div class="ml-auto flex items-center gap-2">
			<Button size="sm" class="h-7 gap-1" href="{PUBLIC_BASE_PATH}/events/new">
				<CirclePlus class="h-3.5 w-3.5" />
				<span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
					{m.new_event()}
				</span>
			</Button>
		</div>
	</div>

	<Tabs.Content value="active">
		<Card.Root>
			<Card.Content class="pt-6">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="hidden w-[100px] sm:table-cell">
								<span class="sr-only">Image</span>
							</Table.Head>
							<Table.Head>
								{m.event_name()}
							</Table.Head>
							<Table.Head>
								{m.event_period()}
							</Table.Head>
							<Table.Head>
								{m.last_updated()}
							</Table.Head>
							<Table.Head>
								<span class="sr-only">Actions</span>
							</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if isLoading}
							<Table.Row>
								<Table.Cell class="hidden sm:table-cell">
									<Skeleton class="aspect-square h-16 w-16 rounded-md" />
								</Table.Cell>
								<Table.Cell class="font-medium">
									<Skeleton class="h-6 w-24" />
								</Table.Cell>
								<Table.Cell>
									<Badge variant="outline">
										<Skeleton class="my-1 h-2 w-16" />
									</Badge>
									-->
									<Badge variant="outline">
										<Skeleton class="my-1 h-2 w-16" />
									</Badge>
								</Table.Cell>
								<Table.Cell class="hidden md:table-cell">
									<Skeleton class="h-6 w-12" />
								</Table.Cell>
								<Table.Cell>
									<Skeleton class="h-6 w-32" />
								</Table.Cell>
								<Table.Cell>
									<Button aria-haspopup="true" size="icon" variant="ghost">
										<Ellipsis class="h-4 w-4" />
										<span class="sr-only">Toggle menu</span>
									</Button>
								</Table.Cell>
							</Table.Row>
						{/if}

						{#each events.filter((i) => i.status == 'active') as event}
							<Table.Row>
								<Table.Cell class="hidden sm:table-cell">
									{#if event.image}
										<img
											src={pbImage(event.collectionId, event.id, event.image)}
											alt=""
											class="aspect-square h-16 w-16 rounded-md"
										/>
									{:else}
										<div class="aspect-square h-16 w-16 rounded-md bg-gray-200"></div>
									{/if}
								</Table.Cell>
								<Table.Cell class="font-medium underline">
									<a href={`${PUBLIC_BASE_PATH}/events/${event.id}`}>
										{event.name}
									</a>
								</Table.Cell>
								<Table.Cell>
									<Badge variant="outline">
										{new Date(event.startDate).toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'short',
											day: 'numeric'
										})}
									</Badge>
									-->
									<Badge variant="outline">
										{new Date(event.endDate).toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'short',
											day: 'numeric'
										})}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									{new Date(event.updated).toLocaleString('en-US', {
										year: 'numeric',
										month: 'short',
										day: 'numeric',
										hour: 'numeric',
										minute: 'numeric',
										hour12: true
									})}
								</Table.Cell>
								<Table.Cell>
									<DropdownMenu.Root>
										<DropdownMenu.Trigger asChild let:builder>
											<Button aria-haspopup="true" size="icon" variant="ghost" builders={[builder]}>
												<Ellipsis class="h-4 w-4" />
												<span class="sr-only">Toggle menu</span>
											</Button>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Label>
												{m.actions()}
											</DropdownMenu.Label>
											<DropdownMenu.Item href={`${PUBLIC_BASE_PATH}/events/${event.id}/settings`}>
												<Settings2 size="16" class="mr-2" />
												{m.modify_settings()}
											</DropdownMenu.Item>
											<DropdownMenu.Item href={`${PUBLIC_BASE_PATH}/events/${event.id}/questions`}>
												<ListPlus size="16" class="mr-2" />
												{m.edit_questions()}
											</DropdownMenu.Item>
											<DropdownMenu.Item href={`${PUBLIC_BASE_PATH}/events/${event.id}/responses`}>
												<MessageSquareReply size="16" class="mr-2" />
												{m.view_responses()}
											</DropdownMenu.Item>
											<DropdownMenu.Item href={`${PUBLIC_BASE_PATH}/events/${event.id}/reviews`}>
												<ClipboardCheck size="16" class="mr-2" />
												{m.manage_reviews()}
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</Tabs.Content>
	<Tabs.Content value="archived">
		<Card.Root>
			<Card.Content class="pt-6">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="hidden w-[100px] sm:table-cell">
								<span class="sr-only">Image</span>
							</Table.Head>
							<Table.Head>
								{m.event_name()}
							</Table.Head>
							<Table.Head>
								{m.event_period()}
							</Table.Head>
							<Table.Head>
								{m.last_updated()}
							</Table.Head>
							<Table.Head>
								<span class="sr-only">Actions</span>
							</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if isLoading}
							<Table.Row>
								<Table.Cell class="hidden sm:table-cell">
									<Skeleton class="aspect-square h-16 w-16 rounded-md" />
								</Table.Cell>
								<Table.Cell class="font-medium">
									<Skeleton class="h-6 w-24" />
								</Table.Cell>
								<Table.Cell>
									<Badge variant="outline">
										<Skeleton class="my-1 h-2 w-16" />
									</Badge>
									-->
									<Badge variant="outline">
										<Skeleton class="my-1 h-2 w-16" />
									</Badge>
								</Table.Cell>
								<Table.Cell class="hidden md:table-cell">
									<Skeleton class="h-6 w-12" />
								</Table.Cell>
								<Table.Cell>
									<Skeleton class="h-6 w-32" />
								</Table.Cell>
								<Table.Cell>
									<Button aria-haspopup="true" size="icon" variant="ghost">
										<Ellipsis class="h-4 w-4" />
										<span class="sr-only">Toggle menu</span>
									</Button>
								</Table.Cell>
							</Table.Row>
						{/if}

						{#each events.filter((i) => i.status == 'archived') as event}
							<Table.Row>
								<Table.Cell class="hidden sm:table-cell">
									{#if event.image}
										<img
											src={pbImage(event.collectionId, event.id, event.image)}
											alt=""
											class="aspect-square h-16 w-16 rounded-md"
										/>
									{:else}
										<div class="aspect-square h-16 w-16 rounded-md bg-gray-200"></div>
									{/if}
								</Table.Cell>
								<Table.Cell class="font-medium underline">
									<a href={`${PUBLIC_BASE_PATH}/events/${event.id}`}>
										{event.name}
									</a>
								</Table.Cell>
								<Table.Cell>
									<Badge variant="outline">
										{new Date(event.startDate).toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'short',
											day: 'numeric'
										})}
									</Badge>
									-->
									<Badge variant="outline">
										{new Date(event.endDate).toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'short',
											day: 'numeric'
										})}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									{new Date(event.updated).toLocaleString('en-US', {
										year: 'numeric',
										month: 'short',
										day: 'numeric',
										hour: 'numeric',
										minute: 'numeric',
										hour12: true
									})}
								</Table.Cell>
								<Table.Cell>
									<DropdownMenu.Root>
										<DropdownMenu.Trigger asChild let:builder>
											<Button aria-haspopup="true" size="icon" variant="ghost" builders={[builder]}>
												<Ellipsis class="h-4 w-4" />
												<span class="sr-only">Toggle menu</span>
											</Button>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Label>
												{m.actions()}
											</DropdownMenu.Label>
											<DropdownMenu.Item href={`${PUBLIC_BASE_PATH}/events/${event.id}/settings`}>
												<Settings2 size="16" class="mr-2" />
												{m.modify_settings()}
											</DropdownMenu.Item>
											<DropdownMenu.Item href={`${PUBLIC_BASE_PATH}/events/${event.id}/questions`}>
												<ListPlus size="16" class="mr-2" />
												{m.edit_questions()}
											</DropdownMenu.Item>
											<DropdownMenu.Item href={`${PUBLIC_BASE_PATH}/events/${event.id}/responses`}>
												<MessageSquareReply size="16" class="mr-2" />
												{m.view_responses()}
											</DropdownMenu.Item>
											<DropdownMenu.Item href={`${PUBLIC_BASE_PATH}/events/${event.id}/reviews`}>
												<ClipboardCheck size="16" class="mr-2" />
												{m.manage_reviews()}
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</Tabs.Content>
</Tabs.Root>

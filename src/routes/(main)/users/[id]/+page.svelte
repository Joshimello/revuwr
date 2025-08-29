<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import Status from '$lib/components/status.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import * as Table from '$lib/components/ui/table';
	import { pb } from '$lib/pocketbase/client';
	import {
		Building2,
		Calendar,
		ChevronLeft,
		ExternalLink,
		Hash,
		Languages,
		Mail,
		Phone,
		User
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { ExpandedUsersResponse } from '../types';

	let record: ExpandedUsersResponse | null = null;
	let loading = true;

	onMount(async () => {
		try {
			record = await pb.collection('users').getOne<ExpandedUsersResponse>($page.params.id, {
				expand: 'applications.event'
			});
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('Unknown error');
				console.error(err);
			}
		} finally {
			loading = false;
		}
	});

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="mb-4 flex items-center gap-4">
	<Button
		variant="outline"
		size="icon"
		class="h-7 w-7"
		on:click={() => {
			window.history.back();
		}}
	>
		<ChevronLeft class="h-4 w-4" />
		<span class="sr-only">Back</span>
	</Button>
	<h1 class="text-lg font-semibold md:text-2xl">
		{#if record}
			{record.name || record.nameEn || 'Unnamed User'}
		{:else if loading}
			Loading...
		{:else}
			User Not Found
		{/if}
	</h1>
</div>

{#if record}
	<div class="flex flex-col gap-4">
		<!-- User Information Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title>User Information</Card.Title>
				<Card.Description>Basic details about the user</Card.Description>
			</Card.Header>
			<Card.Content class="grid gap-4">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<!-- Username & ID -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<User class="h-4 w-4" />
							<span>Username</span>
						</div>
						<p class="font-mono">{record.username}</p>
					</div>

					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Hash class="h-4 w-4" />
							<span>User ID</span>
						</div>
						<p class="font-mono text-xs">{record.id}</p>
					</div>

					<!-- Name -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<User class="h-4 w-4" />
							<span>Name</span>
						</div>
						<p>{record.name || 'Not provided'}</p>
						{#if record.nameEn}
							<p class="text-sm text-muted-foreground">{record.nameEn}</p>
						{/if}
					</div>

					<!-- Language -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Languages class="h-4 w-4" />
							<span>Language</span>
						</div>
						<p>{record.language || 'Not specified'}</p>
					</div>

					<!-- Email -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Mail class="h-4 w-4" />
							<span>Email</span>
						</div>
						<p class="break-all">{record.email}</p>
						<div class="flex items-center gap-2">
							{#if record.verified}
								<Badge variant="outline" class="bg-green-500 text-white">Verified</Badge>
							{:else}
								<Badge variant="outline" class="bg-yellow-500 text-white">Unverified</Badge>
							{/if}
							{#if record.emailVisibility}
								<Badge variant="outline">Visible</Badge>
							{:else}
								<Badge variant="outline">Hidden</Badge>
							{/if}
						</div>
					</div>

					<!-- Phone -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Phone class="h-4 w-4" />
							<span>Phone</span>
						</div>
						<p>{record.phone || 'Not provided'}</p>
					</div>

					<!-- Occupation -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Building2 class="h-4 w-4" />
							<span>Occupation</span>
						</div>
						<p>{record.occupation || 'Not provided'}</p>
					</div>

					<!-- Department -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Building2 class="h-4 w-4" />
							<span>Department</span>
						</div>
						<p>{record.department || 'Not provided'}</p>
					</div>

					<!-- Country -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Building2 class="h-4 w-4" />
							<span>Country</span>
						</div>
						<p>{record.country || 'Not provided'}</p>
					</div>

					<!-- Year -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Calendar class="h-4 w-4" />
							<span>Year</span>
						</div>
						<p>{record.year || 'Not provided'}</p>
					</div>

					<!-- Created Date -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Calendar class="h-4 w-4" />
							<span>Created</span>
						</div>
						<p class="text-sm">{formatDate(record.created)}</p>
					</div>

					<!-- Updated Date -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Calendar class="h-4 w-4" />
							<span>Last Updated</span>
						</div>
						<p class="text-sm">{formatDate(record.updated)}</p>
					</div>
				</div>

				<Separator />

				<!-- Settings -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="flex flex-col gap-1">
						<div class="text-sm text-muted-foreground">Notifications</div>
						<div>
							{#if record.disableNotify}
								<Badge variant="outline" class="bg-red-500 text-white">Disabled</Badge>
							{:else}
								<Badge variant="outline" class="bg-green-500 text-white">Enabled</Badge>
							{/if}
						</div>
					</div>

					<div class="flex flex-col gap-1">
						<div class="text-sm text-muted-foreground">Initialization</div>
						<div>
							{#if record.init}
								<Badge variant="outline" class="bg-green-500 text-white">Initialized</Badge>
							{:else}
								<Badge variant="outline" class="bg-yellow-500 text-white">Not Initialized</Badge>
							{/if}
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Applications Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Applications</Card.Title>
				<Card.Description>
					{#if record.expand?.applications}
						{record.expand.applications.length} application{record.expand.applications.length !== 1
							? 's'
							: ''} found
					{:else}
						No applications found
					{/if}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if record.expand?.applications && record.expand.applications.length > 0}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Application ID</Table.Head>
								<Table.Head>Event</Table.Head>
								<Table.Head>Status</Table.Head>
								<Table.Head>Serial</Table.Head>
								<Table.Head>Created</Table.Head>
								<Table.Head>Updated</Table.Head>
								<Table.Head class="text-right">Actions</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each record.expand.applications as application}
								<Table.Row>
									<Table.Cell class="font-mono text-xs">
										{application.id}
									</Table.Cell>
									<Table.Cell>
										{#if application.expand?.event}
											<a
												href={`${PUBLIC_BASE_PATH}/events/${application.event}`}
												class="flex items-center gap-1 text-blue-600 hover:underline"
											>
												{application.expand.event.name || 'Unnamed Event'}
												<ExternalLink class="h-3 w-3" />
											</a>
										{:else}
											<span class="text-muted-foreground">Event ID: {application.event}</span>
										{/if}
									</Table.Cell>
									<Table.Cell>
										<Status type={application.status} />
									</Table.Cell>
									<Table.Cell>
										{#if application.serial}
											<span class="font-mono">{application.serial}</span>
										{:else}
											<span class="text-muted-foreground">-</span>
										{/if}
									</Table.Cell>
									<Table.Cell class="text-sm">
										{new Date(application.created).toLocaleDateString()}
									</Table.Cell>
									<Table.Cell class="text-sm">
										{new Date(application.updated).toLocaleDateString()}
									</Table.Cell>
									<Table.Cell class="text-right">
										<Button
											size="sm"
											variant="outline"
											href={`${PUBLIC_BASE_PATH}/response/${application.id}`}
										>
											View
											<ExternalLink class="ml-1 h-3 w-3" />
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{:else}
					<div class="py-8 text-center text-muted-foreground">
						No applications found for this user
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
{:else if !loading}
	<Card.Root>
		<Card.Content class="pt-6">
			<div class="py-8 text-center text-muted-foreground">
				User not found or an error occurred while loading user data.
			</div>
		</Card.Content>
	</Card.Root>
{/if}

<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import Status from '$lib/components/status.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import * as Table from '$lib/components/ui/table';
	import * as m from '$lib/paraglide/messages.js';
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
				toast.error(m.unknown_error());
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

	const getAvatarUrl = (user: ExpandedUsersResponse) => {
		if (!user.avatar) return null;
		return pb.files.getUrl(user, user.avatar);
	};

	const getInitials = (name: string) => {
		if (!name) return '?';
		return name
			.split(' ')
			.map((word) => word.charAt(0))
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};
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
		<span class="sr-only">{m.back()}</span>
	</Button>

	{#if record}
		<div class="flex items-center gap-4">
			{#if getAvatarUrl(record)}
				<img
					src={getAvatarUrl(record)}
					alt="{record.name}'s avatar"
					class="h-12 w-12 rounded-full border-2 border-border/20 object-cover"
				/>
			{:else}
				<div
					class="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border/20 bg-gradient-to-br from-primary/20 to-primary/10 text-lg font-medium text-primary"
				>
					{getInitials(record.name || record.nameEn || record.username)}
				</div>
			{/if}
			<h1 class="text-lg font-semibold md:text-2xl">
				{record.name || record.nameEn || m.unnamed_user()}
			</h1>
		</div>
	{:else}
		<h1 class="text-lg font-semibold md:text-2xl">
			{#if loading}
				{m.loading()}
			{:else}
				{m.user_not_found()}
			{/if}
		</h1>
	{/if}
</div>

{#if record}
	<div class="flex flex-col gap-4">
		<!-- User Information Card -->
		<Card.Root>
			<Card.Header>
				<div class="flex items-center gap-4">
					{#if getAvatarUrl(record)}
						<img
							src={getAvatarUrl(record)}
							alt="{record.name}'s avatar"
							class="h-16 w-16 rounded-full border-2 border-border/20 object-cover"
						/>
					{:else}
						<div
							class="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border/20 bg-gradient-to-br from-primary/20 to-primary/10 text-xl font-medium text-primary"
						>
							{getInitials(record.name || record.nameEn || record.username)}
						</div>
					{/if}
					<div>
						<Card.Title>{m.user_information()}</Card.Title>
						<Card.Description>{m.basic_details_about_user()}</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content class="grid gap-4">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<!-- Avatar -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<User class="h-4 w-4" />
							<span>Avatar</span>
						</div>
						{#if record.avatar}
							<div class="flex items-center gap-3">
								<img
									src={getAvatarUrl(record)}
									alt="{record.name}'s avatar"
									class="h-10 w-10 rounded-full border border-border/20 object-cover"
								/>
								<span class="text-sm text-muted-foreground">Profile picture uploaded</span>
							</div>
						{:else}
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full border border-border/20 bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-medium text-primary"
								>
									{getInitials(record.name || record.nameEn || record.username)}
								</div>
								<span class="text-sm text-muted-foreground">Using initials</span>
							</div>
						{/if}
					</div>

					<!-- Username & ID -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<User class="h-4 w-4" />
							<span>{m.username()}</span>
						</div>
						<p class="font-mono">{record.username}</p>
					</div>

					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Hash class="h-4 w-4" />
							<span>{m.user_id()}</span>
						</div>
						<p class="font-mono text-xs">{record.id}</p>
					</div>

					<!-- Name -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<User class="h-4 w-4" />
							<span>{m.name()}</span>
						</div>
						<p>{record.name || m.not_provided()}</p>
						{#if record.nameEn}
							<p class="text-sm text-muted-foreground">{record.nameEn}</p>
						{/if}
					</div>

					<!-- Language -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Languages class="h-4 w-4" />
							<span>{m.language()}</span>
						</div>
						<p>{record.language || m.not_specified()}</p>
					</div>

					<!-- Email -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Mail class="h-4 w-4" />
							<span>{m.email()}</span>
						</div>
						<p class="break-all">{record.email}</p>
						<div class="flex items-center gap-2">
							{#if record.verified}
								<Badge variant="outline" class="bg-green-500 text-white">{m.verified()}</Badge>
							{:else}
								<Badge variant="outline" class="bg-yellow-500 text-white">{m.unverified()}</Badge>
							{/if}
							{#if record.emailVisibility}
								<Badge variant="outline">{m.visible()}</Badge>
							{:else}
								<Badge variant="outline">{m.hidden()}</Badge>
							{/if}
						</div>
					</div>

					<!-- Phone -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Phone class="h-4 w-4" />
							<span>{m.phone()}</span>
						</div>
						<p>{record.phone || m.not_provided()}</p>
					</div>

					<!-- Occupation -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Building2 class="h-4 w-4" />
							<span>{m.occupation()}</span>
						</div>
						<p>{record.occupation || m.not_provided()}</p>
					</div>

					<!-- College -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Building2 class="h-4 w-4" />
							<span>{m.college()}</span>
						</div>
						<p>{record.department || m.not_provided()}</p>
					</div>

					<!-- Department -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Building2 class="h-4 w-4" />
							<span>{m.department()}</span>
						</div>
						<p>{record.dept || m.not_provided()}</p>
					</div>

					<!-- Country -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Building2 class="h-4 w-4" />
							<span>{m.country()}</span>
						</div>
						<p>{record.country || m.not_provided()}</p>
					</div>

					<!-- Year -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Calendar class="h-4 w-4" />
							<span>{m.year()}</span>
						</div>
						<p>{record.year || m.not_provided()}</p>
					</div>

					<!-- Created Date -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Calendar class="h-4 w-4" />
							<span>{m.created()}</span>
						</div>
						<p class="text-sm">{formatDate(record.created)}</p>
					</div>

					<!-- Updated Date -->
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Calendar class="h-4 w-4" />
							<span>{m.last_updated()}</span>
						</div>
						<p class="text-sm">{formatDate(record.updated)}</p>
					</div>
				</div>

				<Separator />

				<!-- Settings -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="flex flex-col gap-1">
						<div class="text-sm text-muted-foreground">{m.notifications()}</div>
						<div>
							{#if record.disableNotify}
								<Badge variant="outline" class="bg-red-500 text-white">{m.disabled()}</Badge>
							{:else}
								<Badge variant="outline" class="bg-green-500 text-white">{m.enabled()}</Badge>
							{/if}
						</div>
					</div>

					<div class="flex flex-col gap-1">
						<div class="text-sm text-muted-foreground">{m.initialization()}</div>
						<div>
							{#if record.init}
								<Badge variant="outline" class="bg-green-500 text-white">{m.initialized()}</Badge>
							{:else}
								<Badge variant="outline" class="bg-yellow-500 text-white"
									>{m.not_initialized()}</Badge
								>
							{/if}
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Applications Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title>{m.applications()}</Card.Title>
				<Card.Description>
					{#if record.expand?.applications}
						{m.applications_found({ count: record.expand.applications.length })}
					{:else}
						{m.no_applications_found()}
					{/if}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if record.expand?.applications && record.expand.applications.length > 0}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>{m.application_id()}</Table.Head>
								<Table.Head>{m.event()}</Table.Head>
								<Table.Head>{m.status()}</Table.Head>
								<Table.Head>{m.serial()}</Table.Head>
								<Table.Head>{m.created()}</Table.Head>
								<Table.Head>{m.updated()}</Table.Head>
								<Table.Head class="text-right">{m.actions()}</Table.Head>
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
												{application.expand.event.name || m.unnamed_event()}
												<ExternalLink class="h-3 w-3" />
											</a>
										{:else}
											<span class="text-muted-foreground">{m.event_id()}: {application.event}</span>
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
											{m.view()}
											<ExternalLink class="ml-1 h-3 w-3" />
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{:else}
					<div class="py-8 text-center text-muted-foreground">
						{m.no_applications_found_for_user()}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
{:else if !loading}
	<Card.Root>
		<Card.Content class="pt-6">
			<div class="py-8 text-center text-muted-foreground">
				{m.user_not_found_or_error()}
			</div>
		</Card.Content>
	</Card.Root>
{/if}

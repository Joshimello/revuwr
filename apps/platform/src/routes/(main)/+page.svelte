<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_ACME } from '$env/static/public';
	import Status from '$lib/components/status.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Tabs from '$lib/components/ui/tabs';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { pb } from '$lib/pocketbase/client';
	import type {
		AnswersResponse,
		ApplicationsResponse,
		EventsResponse
	} from '$lib/pocketbase/pocketbase-types';
	import { redirectToLogin } from '$lib/utils/redirect';
	import { ArrowUpRight, RefreshCcw } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { format, register } from 'timeago.js';
	import zh_TW from 'timeago.js/lib/lang/zh_TW';

	register('zh_TW', zh_TW);

	type ExpandedApplications = ApplicationsResponse<{
		response: AnswersResponse[];
		event: EventsResponse;
	}>;

	let applications: ExpandedApplications[] = [];
	let loading = true;

	const getApplications = async () => {
		loading = true;
		pb.authStore.loadFromCookie(document.cookie);
		try {
			applications = await pb.collection('applications').getFullList<ExpandedApplications>({
				expand: 'response,event'
			});
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred.');
			}
		} finally {
			loading = false;
		}
	};

	onMount(async () => {
		getApplications();
	});

	$: activeApplications = applications.filter((a) => a.expand?.event.status == 'active');
	$: archivedApplications = applications.filter((a) => a.expand?.event.status == 'archived');
	$: editableApplications = activeApplications.filter((a) => editableStatus.includes(a.status));
	$: otherApplications = activeApplications.filter((a) => !editableStatus.includes(a.status));
	const editableStatus = ['draft', 'editsRequested'];

	export let data;
	$: ({ user } = data);
</script>

{#if user}
	<div class="flex flex-col-reverse gap-2 md:flex-row">
		<div class="flex flex-1 flex-col gap-6">
			<Tabs.Root value="active">
				<div class="flex items-center justify-between">
					<Tabs.List>
						<Tabs.Trigger value="active">{m.tabs_active()}</Tabs.Trigger>
						<Tabs.Trigger value="archived">{m.tabs_archived()}</Tabs.Trigger>
					</Tabs.List>
					<div class="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							class="flex h-7 items-center gap-2"
							on:click={getApplications}
						>
							<RefreshCcw size="14" />
							{m.button_refresh()}
						</Button>
					</div>
				</div>

				<Tabs.Content value="active">
					{#if editableApplications.length > 0}
						<div class="flex flex-col pb-6">
							<div class="mx-2 mb-4 mt-2 flex flex-col">
								<span class="text-2xl">{m.applications_in_progress_title()}</span>
								<span class="text-sm text-muted-foreground">
									{m.applications_in_progress_description({ count: editableApplications.length })}
								</span>
							</div>
							<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
								{#each editableApplications as application}
									<Card.Root>
										<Card.Header>
											{#if application.serial}
												<span class="text-lg font-bold leading-3">
													{application.expand?.event.responsePrefix}{application.serial
														.toString()
														.padStart(3, '0')}
												</span>
											{/if}
											<span class="text-xl">
												{application.expand?.event.name}
											</span>
											<div>
												<Status type={application.status} />
												<Badge variant="outline"
													>{m.badge_updated({
														time: format(
															application.updated,
															getLocale() === 'zh' ? 'zh_TW' : 'en_US'
														)
													})}</Badge
												>
											</div>
										</Card.Header>
										<Card.Content>
											<div class="flex items-end gap-2">
												<div class="flex w-full flex-col gap-1">
													<div class="flex items-center gap-1">
														<Badge variant="secondary" class="text-muted-foreground"
															>{m.badge_completed({
																completed:
																	application.expand?.response.filter((i) => i.valid).length ?? 0,
																total: application.response.length
															})}
														</Badge>
													</div>
													<Progress
														value={((application.expand?.response.filter((i) => i.valid).length ??
															0) /
															application.response.length) *
															100}
													/>
												</div>
												<!-- <Button size="icon" variant="outline" class="shrink-0">
                      <Ellipsis size="16" />
                    </Button> -->
												<Button
													size="icon"
													variant="default"
													class="shrink-0"
													href={`/application/${application.id}`}
												>
													<ArrowUpRight size="16" />
												</Button>
											</div>
										</Card.Content>
									</Card.Root>
								{/each}
							</div>
						</div>
					{/if}

					{#if otherApplications.length > 0}
						<div class="flex flex-col pb-12">
							<div class="mx-2 mb-4 mt-2 flex flex-col">
								<span class="text-2xl">{m.other_active_applications_title()}</span>
								<span class="text-sm text-muted-foreground">
									{m.other_active_applications_description()}
								</span>
							</div>
							<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
								{#each otherApplications as application}
									<Card.Root>
										<Card.Header>
											{#if application.serial}
												<span class="text-lg font-bold leading-3">
													{application.expand?.event.responsePrefix}{application.serial
														.toString()
														.padStart(3, '0')}
												</span>
											{/if}
											<span class="text-xl">
												{application.expand?.event.name}
											</span>
											<div>
												<Status type={application.status} />
												<Badge variant="outline"
													>{m.updated()}
													{format(
														application.updated,
														getLocale() === 'zh' ? 'zh_TW' : 'en_US'
													)}</Badge
												>
											</div>
										</Card.Header>
										<Card.Content>
											<div class="flex items-end justify-end gap-2">
												<!-- <Button size="icon" variant="outline" class="shrink-0">
                      <Ellipsis size="16" />
                    </Button> -->
												<!-- <Button size="icon" variant="default" class="shrink-0" href={`/application/${application.id}`}>
                      <ArrowUpRight size="16" />
                    </Button> -->
											</div>
										</Card.Content>
									</Card.Root>
								{/each}
							</div>
						</div>
					{/if}

					{#if loading}
						<div class="flex flex-col pb-6">
							<div class="mx-2 mb-4 mt-2 flex flex-col">
								<Skeleton class="mb-2 h-8 w-64" />
								<Skeleton class="h-4 w-96" />
							</div>
							<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
								{#each Array(2) as _}
									<Card.Root>
										<Card.Header class="space-y-3">
											<Skeleton class="h-4 w-20" />
											<Skeleton class="h-5 w-48" />
											<div class="flex gap-2">
												<Skeleton class="h-6 w-16" />
												<Skeleton class="h-6 w-24" />
											</div>
										</Card.Header>
										<Card.Content>
											<div class="flex items-end gap-2">
												<div class="flex w-full flex-col gap-2">
													<Skeleton class="h-4 w-20" />
													<Skeleton class="h-2 w-full" />
												</div>
												<Skeleton class="size-9 shrink-0" />
											</div>
										</Card.Content>
									</Card.Root>
								{/each}
							</div>
						</div>
					{:else if activeApplications.length == 0}
						<div class="flex flex-col items-center gap-1">
							<h3 class="text-2xl font-bold tracking-tight">{m.no_applications_found_title()}</h3>
							<p class="text-sm text-muted-foreground">
								{m.no_applications_found_description()}
							</p>
						</div>
					{/if}
				</Tabs.Content>
				<Tabs.Content value="archived">
					{#if archivedApplications.length > 0}
						<div class="flex flex-col pb-6">
							<div class="mx-2 mb-4 mt-2 flex flex-col">
								<span class="text-2xl">{m.archived_applications_title()}</span>
								<span class="text-sm text-muted-foreground">
									{m.archived_applications_description({ count: archivedApplications.length })}
								</span>
							</div>
							<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
								{#each archivedApplications as application}
									<Card.Root>
										<Card.Header>
											{#if application.serial}
												<span class="text-lg font-bold leading-3">
													{application.expand?.event.responsePrefix}{application.serial
														.toString()
														.padStart(3, '0')}
												</span>
											{/if}
											<span class="text-xl leading-4">
												{application.expand?.event.name}
											</span>
											<div>
												<Status type={application.status} />
												<Badge variant="outline"
													>{m.updated()}
													{format(
														application.updated,
														getLocale() === 'zh' ? 'zh_TW' : 'en_US'
													)}</Badge
												>
											</div>
										</Card.Header>
										<Card.Content>
											<div class="flex items-end gap-2">
												<div class="flex w-full flex-col gap-1">
													<div class="flex items-center gap-1">
														<Badge variant="secondary" class="text-muted-foreground">
															<span class="text-foreground"
																>{application.expand?.response.filter((i) => i.valid).length}</span
															>/{application.response.length}
															{m.completed()}
														</Badge>
													</div>
													<Progress
														value={((application.expand?.response.filter((i) => i.valid).length ??
															0) /
															application.response.length) *
															100}
													/>
												</div>
												<!-- <Button size="icon" variant="outline" class="shrink-0">
                      <Ellipsis size="16" />
                    </Button> -->
												<Button
													size="icon"
													variant="default"
													class="shrink-0"
													href={`/application/${application.id}`}
												>
													<ArrowUpRight size="16" />
												</Button>
											</div>
										</Card.Content>
									</Card.Root>
								{/each}
							</div>
						</div>
					{/if}

					{#if loading}
						<div class="flex flex-col pb-6">
							<div class="mx-2 mb-4 mt-2 flex flex-col">
								<Skeleton class="mb-2 h-8 w-64" />
								<Skeleton class="h-4 w-80" />
							</div>
							<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
								{#each Array(4) as _}
									<Card.Root>
										<Card.Header class="space-y-3">
											<Skeleton class="h-4 w-20" />
											<Skeleton class="h-5 w-48" />
											<div class="flex gap-2">
												<Skeleton class="h-6 w-16" />
												<Skeleton class="h-6 w-24" />
											</div>
										</Card.Header>
										<Card.Content>
											<div class="flex items-end gap-2">
												<div class="flex w-full flex-col gap-2">
													<Skeleton class="h-4 w-20" />
													<Skeleton class="h-2 w-full" />
												</div>
												<Skeleton class="size-9 shrink-0" />
											</div>
										</Card.Content>
									</Card.Root>
								{/each}
							</div>
						</div>
					{:else if archivedApplications.length == 0}
						<div class="flex flex-col items-center gap-1">
							<h3 class="text-2xl font-bold tracking-tight">
								{m.no_archived_applications_found_title()}
							</h3>
							<p class="text-sm text-muted-foreground">
								{m.no_archived_applications_found_description()}
							</p>
						</div>
					{/if}
				</Tabs.Content>
			</Tabs.Root>
		</div>
	</div>
{:else}
	<div
		class="flex h-full flex-1 items-center justify-center rounded-lg border border-dashed py-16 shadow-sm"
	>
		<div class="flex flex-col items-center gap-1 text-center">
			<h3 class="text-2xl font-bold tracking-tight">
				{m.login_welcome({ name: PUBLIC_ACME })}
			</h3>
			<p class="mb-4 text-sm text-muted-foreground">{m.login_prompt()}</p>
			<div class="flex gap-2">
				<Button on:click={() => redirectToLogin($page.url.pathname)}>{m.login_button()}</Button>
				<Button href="/login" variant="outline">{m.login_with_username()}</Button>
			</div>
		</div>
	</div>
{/if}

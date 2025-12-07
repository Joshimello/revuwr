<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_ACME } from '$env/static/public';
	import RefreshButton from '$lib/components/refresh-button.svelte';
	import { Button } from '$lib/components/ui/button';

	import * as Tabs from '$lib/components/ui/tabs';
	import { m } from '$lib/paraglide/messages.js';
	import { redirectToLogin } from '$lib/utils/redirect';
	import { register } from 'timeago.js';
	import zh_TW from 'timeago.js/lib/lang/zh_TW';
	import ApplicationCard from './application-card.svelte';

	register('zh_TW', zh_TW);

	export let data;
	$: ({ user, applications } = data);

	$: activeApplications = applications?.filter((a) => a.expand?.event.status == 'active') || [];
	$: archivedApplications = applications?.filter((a) => a.expand?.event.status == 'archived') || [];
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
						<RefreshButton />
					</div>
				</div>

				<Tabs.Content value="active">
					{#if activeApplications.length > 0}
						<div class="flex flex-col pb-6">
							<div class="mx-2 mb-4 mt-2 flex flex-col">
								<span class="text-2xl">{m.active_applications_title()}</span>
							</div>
							<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
								{#each activeApplications as application}
									<ApplicationCard {application} />
								{/each}
							</div>
						</div>
					{:else}
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
								<span class="text-2xl">{m.archived_applications_simple_title()}</span>
							</div>
							<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
								{#each archivedApplications as application}
									<ApplicationCard {application} />
								{/each}
							</div>
						</div>
					{/if}

					{#if archivedApplications.length == 0}
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

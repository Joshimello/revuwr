<script lang="ts">
	import Status from '$lib/components/status.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Progress } from '$lib/components/ui/progress';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import type {
		AnswersResponse,
		ApplicationsResponse,
		EventsResponse
	} from '$lib/pocketbase/pocketbase-types';
	import { ArrowUpRight, Ellipsis, Trash2, X } from 'lucide-svelte';
	import { format } from 'timeago.js';

	type ExpandedApplication = ApplicationsResponse<{
		response: AnswersResponse[];
		event: EventsResponse;
	}>;

	export let application: ExpandedApplication;

	// Determine if event is archived based on event status
	$: isEventArchived = application.expand?.event.status === 'archived';

	// For active events, determine viewability and menu options
	$: isViewable =
		!isEventArchived &&
		['draft', 'approved', 'editsRequested', 'rejected'].includes(application.status);
	$: showProgress = !isEventArchived && ['draft', 'editsRequested'].includes(application.status);

	// Menu button logic for active events
	$: showMenuButton =
		!isEventArchived &&
		(application.status === 'draft' || // Will show "Discard Draft"
			['submitted', 'resubmitted'].includes(application.status)); // Will show "Withdraw Application"

	// For archived events, no menu or view buttons, no progress
	$: showViewButton = isEventArchived ? false : isViewable;

	$: completedCount = application.expand?.response.filter((i) => i.valid).length ?? 0;
	$: totalCount = application.response.length;
	$: completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

	let withdrawForm: HTMLFormElement;
</script>

<Card.Root>
	<Card.Header>
		{#if application.serial}
			<span class="text-lg font-bold leading-3">
				{application.expand?.event.responsePrefix}{application.serial.toString().padStart(3, '0')}
			</span>
		{/if}
		<span class="text-xl">
			{application.expand?.event.name}
		</span>
		<div>
			{#if isEventArchived}
				<Badge variant="secondary">Archived</Badge>
			{/if}
			<Status type={application.status} />
			<Badge variant="outline">
				{m.badge_updated({
					time: format(application.updated, getLocale() === 'zh' ? 'zh_TW' : 'en_US')
				})}
			</Badge>
		</div>
	</Card.Header>
	<Card.Content>
		<div class="flex items-end gap-2" class:justify-end={!showProgress}>
			{#if showProgress}
				<div class="flex w-full flex-col gap-1">
					<div class="flex items-center gap-1">
						<Badge variant="secondary" class="text-muted-foreground">
							{m.badge_completed({
								completed: completedCount,
								total: totalCount
							})}
						</Badge>
					</div>
					<Progress value={completionPercentage} />
				</div>
			{/if}

			{#if showMenuButton}
				<form method="POST" action="?/withdraw" bind:this={withdrawForm}>
					<input type="hidden" name="applicationId" value={application.id} />

					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild let:builder>
							<Button builders={[builder]} size="icon" variant="outline" class="shrink-0">
								<Ellipsis size="16" />
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end">
							<DropdownMenu.Label>{m.application_actions()}</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Group>
								<DropdownMenu.Item
									class="w-full cursor-pointer justify-start text-destructive"
									on:click={() => {
										withdrawForm.requestSubmit();
									}}
								>
									{#if application.status === 'draft'}
										<Trash2 class="mr-2 h-4 w-4 flex-shrink-0" />
										<span>{m.menu_discard_draft()}</span>
									{:else if ['submitted', 'resubmitted'].includes(application.status)}
										<X class="mr-2 h-4 w-4 flex-shrink-0" />
										<span>{m.menu_withdraw_application()}</span>
									{/if}
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</form>
			{/if}

			{#if showViewButton}
				<Button
					size="icon"
					variant="default"
					class="shrink-0"
					href={`/application/${application.id}`}
				>
					<ArrowUpRight size="16" />
				</Button>
			{/if}
		</div>
	</Card.Content>
</Card.Root>

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import DatePicker from '$lib/components/date-picker.svelte';
	import { Button } from '$lib/components/ui/button';
	import { pb } from '$lib/pocketbase/client';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type {
		ApplicationsResponse,
		EventsResponse,
		QuestionsResponse
	} from '$lib/pocketbase/pocketbase-types';
	import { Badge } from '$lib/components/ui/badge';
	import { Trash, X } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Switch } from '$lib/components/ui/switch';
  import * as Table from "$lib/components/ui/table"
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import * as m from '$lib/paraglide/messages.js';

	type ExpandedEvent = EventsResponse<{
		questions: QuestionsResponse[];
	}>;

	let applications: ApplicationsResponse[] = [];
	let event: ExpandedEvent | null = null;
  
  let shareResponder = false;
	let selectedApplications = $page.url.searchParams.get('ids')?.split(',') || [];
	let selectedQuestions: string[] = [];
  let reviewers: {
    email: string;
    endDate: Date | null;
  }[] = [];

  let newReviewer = {
    email: '',
    endDate: null as Date | null
  };

	onMount(async () => {
		try {
			event = await pb.collection('events').getOne<ExpandedEvent>($page.params.id, {
				expand: `questions`
			});
			applications = await pb.collection('applications').getFullList({
				filter: `event="${$page.params.id}"`
			});
			selectedApplications = selectedApplications.filter((id) =>
				applications.find((app) => app.id === id)
			);
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	});

  const handleCreateReviews = async () => {
		const promises = reviewers.map(async (reviewer) => 
			pb.collection('reviews').create({
				applications: selectedApplications,
				questions: selectedQuestions,
				shareResponder: shareResponder,
				reviewerEmail: reviewer.email,
				endDate: reviewer.endDate,
				review: {},
				status: 'draft',
			}, {
				requestKey: reviewer.email
			})
		)
		try {
			await Promise.all(promises);
			toast.success('Review requests created');
			goto(`${PUBLIC_BASE_PATH}/events/${$page.params.id}/reviews`);
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
  };

</script>

<div class="flex items-center">
	<h1 class="text-lg font-semibold md:text-2xl">
		{m.new_review_request()}
	</h1>
</div>

<Card.Root class="max-w-3xl">
	<Card.Header>
		<Card.Title>
			{m.targeted_applications()}
		</Card.Title>
		<Card.Description>
			{m.targeted_applications_desc()}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="mb-2 flex flex-wrap gap-2">
			{#each selectedApplications as selectedApplication}
				{@const application = applications.find((i) => i.id == selectedApplication)}
				<Badge variant="secondary">
					<Button
						size="icon"
						class="h-5 w-5 text-black"
						variant="ghost"
						on:click={() => {
							selectedApplications = selectedApplications.filter((id) => id != application?.id);
						}}
					>
						<X size="12" />
					</Button>
					{#if application?.serial}
						{event?.responsePrefix}{application.serial.toString().padStart(3, '0')}
					{:else}
						{application?.id}
					{/if}
				</Badge>
			{/each}
		</div>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger let:builder asChild>
				<Button size="sm" builders={[builder]}>
					{m.add_application()}
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Group>
					{#each applications.filter((i) => !selectedApplications.includes(i.id)) as application}
						<DropdownMenu.Item
							on:click={() => {
								selectedApplications = [...selectedApplications, application.id];
							}}
						>
							{#if application?.serial}
								{event?.responsePrefix}{application.serial.toString().padStart(3, '0')}
							{:else}
								{application?.id}
							{/if}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Card.Content>
</Card.Root>

<Card.Root class="max-w-3xl">
	<Card.Header>
		<Card.Title>
			{m.reviewable_fields()}
		</Card.Title>
		<Card.Description>
			{m.reviewable_fields_desc()}
    </Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="mb-2 flex flex-wrap gap-2">
			{#each event?.expand?.questions || [] as question}
				<Button
          size="sm"
          class="h-max py-0.5 px-1.5 overflow-hidden"
					variant={selectedQuestions.includes(question.id) ? 'default' : 'secondary'}
					on:click={() => {
						selectedQuestions = selectedQuestions.includes(question.id)
							? selectedQuestions.filter((i) => i != question.id)
							: [...selectedQuestions, question.id];
					}}
				>
					{@html question.title}
				</Button>
			{/each}
		</div>
    <div class="flex items-center gap-2 mt-6">
      <Switch bind:checked={shareResponder} />
      <Label>
				{m.share_responder_details_with_reviewer()}
			</Label>
    </div>
	</Card.Content>
</Card.Root>

<Card.Root class="max-w-3xl">
	<Card.Header>
		<Card.Title>
			{m.reviewers()}
		</Card.Title>
		<Card.Description>
			{m.reviewers_desc()}
		</Card.Description>
	</Card.Header>
	<Card.Content>

    {#if reviewers.length > 0}
      <Table.Root class="border mb-6">
        <Table.Header>
          <Table.Row>
            <Table.Head>
							{m.reviewer_email()}
						</Table.Head>
            <Table.Head>
							{m.end_date()}
						</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each reviewers as reviewer}
            <Table.Row>
              <Table.Cell>{reviewer.email}</Table.Cell>
              <Table.Cell>
                {#if reviewer.endDate}
                  {reviewer.endDate.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                {:else}
                  -
                {/if}
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/if}

    <div class="flex gap-2 items-end">
      <div class="flex flex-col gap-2 w-full">
        <Label>
					{m.reviewer_email()}
				</Label>
        <Input bind:value={newReviewer.email} class="w-full"/>
      </div>
      <div class="flex flex-col gap-2">
        <Label>
					{m.end_date()}
				</Label>
        <DatePicker onValueChange={v => {
          newReviewer.endDate = v?.toDate("Asia/Singapore") || null;
        }} />
      </div>
      <Button size="icon" class="shrink-0" on:click={() => {
        reviewers = [...reviewers, newReviewer];
        newReviewer = {
          email: '',
          endDate: null
        };
      }}>
        +
      </Button>
    </div>

	</Card.Content>
</Card.Root>

<Button class="max-w-3xl py-8" on:click={handleCreateReviews}>
	{m.create_review_requests()}
</Button>
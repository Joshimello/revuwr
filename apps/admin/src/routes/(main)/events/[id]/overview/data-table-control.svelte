<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { FileCheck, FileOutput, FileX } from "lucide-svelte";
  import * as Dialog from "$lib/components/ui/dialog"
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Switch } from "$lib/components/ui/switch";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import type { AnswersResponse, ApplicationsResponse, EventsResponse, QuestionsResponse, UsersResponse } from "$lib/pocketbase/pocketbase-types";
	import { toast } from "svelte-sonner";
	import { PUBLIC_PLATFORM_URL } from "$env/static/public";
	import { pb } from "$lib/pocketbase/client";
  import * as m from '$lib/paraglide/messages.js'
  import { reviewRequests } from "./stores";

  type Tresponse = string | number | string[] | number[] | Record<string, any> | null;
  type Toptions = Record<string, any>;

  type ExpandedApplication = ApplicationsResponse<{
		responder: UsersResponse;
		response: AnswersResponse[];
	}>;

  export let record: ExpandedApplication;
  export let event: EventsResponse;

  let approveOpen = false;
  let requestEditOpen = false;
  let rejectOpen = false;
  let isMailResponder = false;

  const handleApprove = async () => {
		if (!record || !event) return;
		try {
			const updatedEvent = await pb.collection('events').update(event.id, {
				'approvedCount+': 1
			});
			const application = await pb.collection('applications').update(record.id, {
				status: 'approved',
				serial: updatedEvent.approvedCount
			});
			await pb.collection('notifications').create({
				application: application.id,
				target: application.responder,
				message: `${updatedEvent.responsePrefix}${application.serial.toString().padStart(3, '0')} has been approved.`
			});
			toast.success('Application approved');
			record.status = 'approved';
			record.serial = updatedEvent.approvedCount;
			approveOpen = false;
      $reviewRequests = $reviewRequests
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};

	const handleRequestEdit = async () => {
		if (!record || !event) return;
		try {
			const application = await pb.collection('applications').update(record.id, {
				status: 'editsRequested'
			});
			await pb.collection('notifications').create({
				application: application.id,
				target: application.responder,
				message: `Application for ${event.name} has been returned for edits.`,
				link: `${PUBLIC_PLATFORM_URL}/application/${application.id}`
			});
			toast.success('Edits requested');
			record.status = 'editsRequested';
			requestEditOpen = false;
      $reviewRequests = $reviewRequests
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};

	const handleReject = async () => {
		if (!record || !event) return;
		try {
			const application = await pb.collection('applications').update(record.id, {
				status: 'rejected'
			});
			await pb.collection('notifications').create({
				application: application.id,
				target: application.responder,
				message: `Application for ${event.name} has been rejected.`
			});
			toast.success('Application rejected');
			record.status = 'rejected';
			rejectOpen = false;
      $reviewRequests = $reviewRequests
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};

</script>

<div class="flex gap-1">
  <Button
    class="flex items-center gap-1 bg-green-500 text-white"
    size="icon"
    variant="default"
    on:click={() => (approveOpen = true)}
  >
    <FileCheck size="14" strokeWidth="3" />
  </Button>
  <Button
    class="flex items-center gap-1 bg-amber-500 text-white"
    size="icon"
    variant="default"
    on:click={() => (requestEditOpen = true)}
  >
    <FileOutput size="14" strokeWidth="3" />
  </Button>
  <Button
    class="flex items-center gap-1 bg-red-500 text-white"
    size="icon"
    variant="default"
    on:click={() => (rejectOpen = true)}
  >
    <FileX size="14" strokeWidth="3" />
  </Button>
</div>

<Dialog.Root bind:open={approveOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        {m.approving_application()}
        <span class="font-mono font-normal">{record.id}</span>
      </Dialog.Title>
    </Dialog.Header>
    <div class="flex flex-col">
      <Label class="text-muted-foreground">
        {m.new_given_id_will_be()}
      </Label>
      <span>{event.responsePrefix}{(event.approvedCount + 1).toString().padStart(3, '0')}</span>
    </div>
    <div class="flex flex-col gap-2">
      <Label class="text-muted-foreground">
        {m.mail_the_responder()}
      </Label>
      <div class="flex items-center space-x-2">
        <Switch bind:checked={isMailResponder} /><Label>
          {m.mail_responder()}
        </Label>
      </div>
      {#if isMailResponder}
        <Textarea class="h-32" placeholder={m.extra_mail_content()} />
      {/if}
    </div>
    <Dialog.Footer>
      <Button class="bg-green-500 text-white" variant="outline" on:click={handleApprove}>
        {m.approve()}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={requestEditOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        {m.requesting_edits_for_application()}
        <span class="font-mono font-normal">{record.id}</span>
      </Dialog.Title>
      <Dialog.Description>
        {m.requesting_edits_desc()}
      </Dialog.Description>
    </Dialog.Header>
    <div class="flex flex-col gap-2">
      <Label class="text-muted-foreground">
        {m.mail_the_responder()}
      </Label>
      <div class="flex items-center space-x-2">
        <Switch bind:checked={isMailResponder} /><Label>
          {m.mail_responder()}
        </Label>
      </div>
      {#if isMailResponder}
        <Textarea class="h-32" placeholder={m.extra_mail_content()} />
      {/if}
    </div>
    <Dialog.Footer>
      <Button class="bg-amber-500 text-white" variant="outline" on:click={handleRequestEdit}>
        {m.return_for_edits()}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={rejectOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        {m.rejecting_application()}
        <span class="font-mono font-normal">{record.id}</span>
      </Dialog.Title>
    </Dialog.Header>
    <div class="flex flex-col gap-2">
      <Label class="text-muted-foreground">
        {m.mail_the_responder()}
      </Label>
      <div class="flex items-center space-x-2">
        <Switch bind:checked={isMailResponder} /><Label>
          {m.mail_responder()}
        </Label>
      </div>
      {#if isMailResponder}
        <Textarea class="h-32" placeholder={m.extra_mail_content()} />
      {/if}
    </div>
    <Dialog.Footer>
      <Button class="bg-red-500 text-white" variant="outline" on:click={handleReject}>
        {m.reject()}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
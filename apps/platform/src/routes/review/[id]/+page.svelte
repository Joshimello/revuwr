<script lang="ts">
  import { page } from '$app/stores';
  import { onDestroy, onMount } from 'svelte';
  import { pb, pbImage } from '$lib/pocketbase/client';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';
  import { Badge } from '$lib/components/ui/badge';
  import Status, { statuses } from '$lib/components/status.svelte';
  import { Button } from '$lib/components/ui/button';
	import type { AnswersResponse, ApplicationsResponse, EventsResponse, QuestionsResponse, ReviewsResponse } from '$lib/pocketbase/pocketbase-types';
  import * as Table from "$lib/components/ui/table"
  import * as Card from "$lib/components/ui/card"
	import { FileCheck2, FileClock, FileSearch2, FileX2, Check, PencilLine, X, MessageCircle, Download } from 'lucide-svelte';
  import * as Tooltip from "$lib/components/ui/tooltip"
  import * as Dialog from "$lib/components/ui/dialog"
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from "$lib/components/ui/label"
  import ActivityTable from './activity-table.svelte';
  import MemberTable from './member-table.svelte';

  type ExpandedReviews = ReviewsResponse<
    Record<string, { status: string, comment: string }>, 
    { 
      applications: ApplicationsResponse<{
        event: EventsResponse;
        response: AnswersResponse<any, {
          question: QuestionsResponse<any>;
        }>[]
      }>[]
    }
  >

  type ExpandedApplication = ApplicationsResponse<{
    event: EventsResponse;
    response: AnswersResponse<any, {
      question: QuestionsResponse<any>;
    }>[]
  }>

  let reviewRequest: ExpandedReviews | null = null;

  onMount(async () => {
    try {
      reviewRequest = await pb.collection('reviews').getOne<ExpandedReviews>($page.params.id, {
        expand: 'applications'
      })
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error('An error occurred')
      }
      return
    }

    if (!reviewRequest) return

    try {
      await pb.collection('reviewers').create({
        email: reviewRequest.reviewerEmail,
        password: reviewRequest.reviewerEmail,
        passwordConfirm: reviewRequest.reviewerEmail
      })
    }
    catch (err) {
      null
    }

    try {
      await pb.collection('reviewers').authWithPassword(reviewRequest.reviewerEmail, reviewRequest.reviewerEmail)
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error('An error occurred')
      }
    }

    try {
      reviewRequest = await pb.collection('reviews').getOne<ExpandedReviews>($page.params.id, {
        expand: 'applications,applications.event,applications.response,applications.response.question'
      })
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error('An error occurred')
      }
    }
  })

  const handleSubmitReviews = async () => {
    if (!reviewRequest) return
    try {
      await pb.collection('reviews').update(reviewRequest.id, {
        status: 'submitted'
      })
      toast.success('Reviews submitted successfully')
      pb.authStore.clear()
      goto('/review/completed')
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error('An error occurred')
      }
    }
  }

  let rejectComment = ''
  let requestEditsComment = ''
  let approveComment = ''

  let rejectOpen = false
  const rejectApplication = async (id: string) => {
    if (!reviewRequest) return
    try {
      reviewRequest = await pb.collection('reviews').update<ExpandedReviews>(reviewRequest.id, {
        review: {
          ...reviewRequest.review,
          [id]: {
            status: 'rejected',
            comment: rejectComment
          }
        }
      }, {
        expand: 'applications,applications.event,applications.response,applications.response.question'
      })
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error('An error occurred')
      }
    }
  }
  
  let requestEditsOpen = false
  const requestEdits = async (id: string) => {
    if (!reviewRequest) return
    try {
      reviewRequest = await pb.collection('reviews').update<ExpandedReviews>(reviewRequest.id, {
        review: {
          ...reviewRequest.review,
          [id]: {
            status: 'editsRequested',
            comment: requestEditsComment
          }
        }
      }, {
        expand: 'applications,applications.event,applications.response,applications.response.question'
      })
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error('An error occurred')
      }
    }
  }

  let approveOpen = false
  const approveApplication = async (id: string) => {
    if (!reviewRequest) return
    try {
      reviewRequest = await pb.collection('reviews').update<ExpandedReviews>(reviewRequest.id, {
        review: {
          ...reviewRequest.review,
          [id]: {
            status: 'approved',
            comment: approveComment
          }
        }
      }, {
        expand: 'applications,applications.event,applications.response,applications.response.question'
      })
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error('An error occurred')
      }
    }
  }

  let openedApplication: ExpandedApplication | null = null

  let viewOpen = false
  let submitOpen = false

</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Hi, {reviewRequest?.reviewerEmail}</Card.Title>
    <Card.Description>
      You have been requested to review the following applications.
      There are {reviewRequest?.applications.length} applications to review below.
      Please review each application and provide a status and a optional comment for each.
      You may return to this page URL at any time to update your review.
      {#if reviewRequest?.endDate}
      This review request will be closed on 
      {new Date(reviewRequest?.endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })} or after submission.
      {/if}
      Thank you for your time and effort.
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <div class="flex flex-col gap-1">
      Tips while reviewing:
      <div class="flex gap-2 text-sm text-muted-foreground">
        <Button class="bg-green-500 h-5 w-5" size="icon" disabled><Check size="16"/></Button>
        -> Approve application as it is
      </div>
      <div class="flex gap-2 text-sm text-muted-foreground">
        <Button class="bg-amber-500 h-5 w-5" size="icon" disabled><PencilLine size="16"/></Button>
        -> Approve application with suggested edits
      </div>
      <div class="flex gap-2 text-sm text-muted-foreground">
        <Button class="bg-red-500 h-5 w-5" size="icon" disabled><X size="16"/></Button>
        -> Reject application
      </div>
      <span class="flex gap-2 text-muted-foreground text-sm items-center pl-0.5">
        <MessageCircle size="16" />
        You can also leave a comment for the applicant to see.
      </span>
      <span class="flex gap-2 text-muted-foreground text-sm items-center pl-0.5">
        <Download size="16" />
        You can download all applications as a PDF below.
      </span>
    </div>
    
    <div class="flex justify-end mt-6">
      <Button variant="outline">
        Download all as PDF
      </Button>
    </div>
    
  </Card.Content>
</Card.Root>

{#if reviewRequest?.review}
<Card.Root class="mt-2">
  <Card.Header>
    <Card.Title>
      <div class="flex items-center gap-1 flex-wrap">
        <Badge class="bg-lime-100 text-lime-600" variant="outline">
          {Object.values(reviewRequest.review).filter(i => i.status === 'approved').length}
          <FileCheck2 class="ml-1" size="14" />
          <span class="ml-1 font-normal">Approved</span>
        </Badge>
        <Badge class="bg-orange-100 text-orange-600" variant="outline">
          {Object.values(reviewRequest.review).filter(i => i.status === 'editsRequested').length}
          <FileSearch2 class="ml-1" size="14" />
          <span class="ml-1 font-normal">Requested Edits</span>
        </Badge>
        <Badge class="bg-red-100 text-red-500" variant="outline">
          {Object.values(reviewRequest.review).filter(i => i.status === 'rejected').length}
          <FileX2 class="ml-1" size="14" />
          <span class="ml-1 font-normal">Rejected</span>
        </Badge>
        <Badge class="bg-sky-100 text-sky-500" variant="outline">
          {reviewRequest.applications.filter(i => !Object.keys(reviewRequest?.review || {}).includes(i)).length}
          <FileClock class="ml-1" size="14" />
          <span class="ml-1 font-normal">Unreviewed</span>
        </Badge>
      </div>      
    </Card.Title>
  </Card.Header>
  <Card.Content>

    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-44">Serial ID</Table.Head>
          <Table.Head>Status</Table.Head>
          <Table.Head>Comment</Table.Head>
          <Table.Head class="w-0">View</Table.Head>
          <Table.Head class="text-end w-0">Actions</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each reviewRequest.expand?.applications || [] as application}
          <Table.Row>
            <Table.Cell class="font-medium font-mono">
              {#if application.serial}
                {application.expand?.event.responsePrefix}{application.serial.toString().padStart(3, '0')}
              {:else}
                {application.id}
              {/if}
            </Table.Cell>
            <Table.Cell>
              {#if reviewRequest.review?.[application.id]}
                <Status type={reviewRequest.review?.[application.id]?.status} />
              {:else}
                <Badge variant="outline">Unreviewed</Badge>
              {/if} 
            </Table.Cell>
            <Table.Cell>
              {reviewRequest.review?.[application.id]?.comment ?? ''}
            </Table.Cell>
            <Table.Cell>
              <Button variant="outline" on:click={() => {
                viewOpen = true
                openedApplication = application
              }}>
                View Application
              </Button>
            </Table.Cell>
            <Table.Cell class="flex justify-end gap-1">

              <Tooltip.Root>
                <Tooltip.Trigger>
                  <Button size="icon" class="bg-red-500 hover:bg-red-700" on:click={() => {
                    rejectOpen = true
                    openedApplication = application
                  }}>
                    <X size="16" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content class="bg-black">
                  <p>Reject application</p>
                </Tooltip.Content>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger>
                  <Button size="icon" class="bg-amber-500 hover:bg-amber-700" on:click={() => {
                    requestEditsOpen = true
                    openedApplication = application
                  }}>
                    <PencilLine size="16" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content class="bg-black">
                  <p>Request edits</p>
                </Tooltip.Content>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger>
                  <Button size="icon" class="bg-green-500 hover:bg-green-700" on:click={() => {
                    approveOpen = true
                    openedApplication = application
                  }}>
                    <Check size="16" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content class="bg-black">
                  <p>Approve application</p>
                </Tooltip.Content>
              </Tooltip.Root>
              
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>

  </Card.Content>
  <Card.Footer class="flex justify-end">
    <Button on:click={() => {
      submitOpen = true
    }}>
      Submit Reviews
    </Button>
  </Card.Footer>
</Card.Root>

<Dialog.Root bind:open={rejectOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title class="text-red-500">
        Rejecting
        <span class="font-mono">
          {#if openedApplication?.serial}
            {openedApplication?.expand?.event.responsePrefix}{openedApplication.serial.toString().padStart(3, '0')}
          {:else}
            {openedApplication?.id}
          {/if}
        </span>
      </Dialog.Title>
      <Dialog.Description>
        You are about to reject the application.
        If possible, please provide a reason for this rejection,
        helping the applicant understand why their application was rejected.
      </Dialog.Description>
      
    </Dialog.Header>
    <div>
      <Label>Comment</Label>
      <Textarea bind:value={rejectComment} />
    </div>
    <Dialog.Footer>
      <Button variant="outline" on:click={() => {
        rejectOpen = false
        openedApplication = null
      }}>
        Cancel
      </Button>
      <Button class="bg-red-500" on:click={() => {
        if (!openedApplication) return
        rejectApplication(openedApplication.id)
        rejectOpen = false
        openedApplication = null
      }}>
        Reject Application
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={requestEditsOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title class="text-amber-500">
        Requesting Edits
        <span class="font-mono">
          {#if openedApplication?.serial}
            {openedApplication?.expand?.event.responsePrefix}{openedApplication.serial.toString().padStart(3, '0')}
          {:else}
            {openedApplication?.id}
          {/if}
        </span>
      </Dialog.Title>
      <Dialog.Description>
        You are about to make suggestions for edits to the application,
        which the applicant can then make and resubmit for admins to review.
        Please provide comments explaining what edits are needed.
      </Dialog.Description>
      
    </Dialog.Header>
    <div>
      <Label>Comment</Label>
      <Textarea bind:value={requestEditsComment} />
    </div>
    <Dialog.Footer>
      <Button variant="outline" on:click={() => {
        requestEditsOpen = false
        openedApplication = null
      }}>
        Cancel
      </Button>
      <Button class="bg-amber-500" on:click={() => {
        if (!openedApplication) return
        requestEdits(openedApplication.id)
        requestEditsOpen = false
        openedApplication = null
      }}>
        Request Edits
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={approveOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title class="text-green-500">
        Approving
        <span class="font-mono">
          {#if openedApplication?.serial}
            {openedApplication?.expand?.event.responsePrefix}{openedApplication.serial.toString().padStart(3, '0')}
          {:else}
            {openedApplication?.id}
          {/if}
        </span>
      </Dialog.Title>
      <Dialog.Description>
        You are about to approve the application.
        It is not necessary to provide a comment, but you may do so if you wish.
      </Dialog.Description>
      
    </Dialog.Header>
    <div>
      <Label>Comment</Label>
      <Textarea bind:value={approveComment} />
    </div>
    <Dialog.Footer>
      <Button variant="outline" on:click={() => {
        approveOpen = false
        openedApplication = null
      }}>
        Cancel
      </Button>
      <Button class="bg-green-500" on:click={() => {
        if (!openedApplication) return
        approveApplication(openedApplication.id)
        approveOpen = false
        openedApplication = null
      }}>
        Approve Application
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={viewOpen}>
  <Dialog.Content class="max-h-screen">
    <Dialog.Header>
      <Dialog.Title>
        Application
        <span class="font-mono">
          {#if openedApplication?.serial}
            {openedApplication?.expand?.event.responsePrefix}{openedApplication.serial.toString().padStart(3, '0')}
          {:else}
            {openedApplication?.id}
          {/if}
        </span>
      </Dialog.Title>
    </Dialog.Header>
    <div class="flex flex-col gap-2">
      {#each openedApplication?.expand?.response || [] as answer}
        <div>
          <Label>{@html answer.expand?.question.title}</Label>
          <div class="text-sm text-muted-foreground">
            {#if !answer.response && !['image', 'file'].includes(answer.expand?.question.type ?? '')}
								<span>-</span>
							{:else if answer.expand?.question.type == 'radio'}
								{#if answer.response?.selected == answer.expand?.question.options?.choices.length}
									<span>{answer.response?.others}</span>
								{:else}
									<span
										>{answer.expand?.question.options?.choices[
											answer.response?.selected ?? '0'
										]}</span
									>
								{/if}
							{:else if answer.expand?.question.type == 'member'}
								<MemberTable value={answer.response} />
							{:else if answer.expand?.question.type == 'activity'}
								<ActivityTable value={answer.response} />
							{:else if answer.expand?.question.type == 'file'}
								<div class="flex flex-col">
									{#each answer.files as file}
										<a
											class="text-blue-500 underline"
											href={pbImage(answer.collectionId, answer.id, file)}
											target="_blank">{file}</a
										>
									{/each}
								</div>
							{:else}
								<span>{answer.response}</span>
							{/if}
          </div>
        </div>
      {/each}
    </div>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={submitOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        Submitting Reviews
      </Dialog.Title>
      <Dialog.Description>
        You are about to submit your reviews for all applications.
        You will still be able to edit your reviews until the review request is closed.
        Once submitted, you will not be able to change your reviews.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" on:click={() => {
        submitOpen = false
      }}>
        Cancel
      </Button>
      <Button on:click={() => {
        submitOpen = false
        handleSubmitReviews()
      }}>
        Submit Reviews
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

{/if}
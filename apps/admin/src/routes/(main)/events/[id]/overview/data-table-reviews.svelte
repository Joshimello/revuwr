<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Eye } from "lucide-svelte";
  import * as Dialog from "$lib/components/ui/dialog"
  import Status from "$lib/components/status.svelte"
  import * as m from '$lib/paraglide/messages.js'
  
  type Review = {
    reviewId: string;
    reviewer: string;
    status: string | undefined;
    comment: string | undefined;
  }

  export let reviews: Review[]

  let open = false
</script>
<div class="flex gap-2">
  <div>
    <div class="font-medium text-muted-foreground font-mono flex">
      <span class="text-green-500">{reviews.filter(i=>i.status=='approved').length}</span> /
      <span class="text-yellow-500">{reviews.filter(i=>i.status=='editsRequested').length}</span> /
      <span class="text-red-500">{reviews.filter(i=>i.status=='rejected').length}</span> /
      <span>{reviews.filter(i=>!i.status).length}</span>
    </div>
    <div class="text-muted-foreground text-xs">
      {reviews.length} {m.reviews()}
    </div>
  </div>
  <Button variant="ghost" size="icon" on:click={() => open = true}>
    <Eye size="20" class="text-muted-foreground" />
  </Button>
</div>

<Dialog.Root bind:open={open}>
  <Dialog.Content class="max-h-screen overflow-auto">
    <Dialog.Header>
      <Dialog.Title>
        {m.comments_by_reviewers()}
      </Dialog.Title>
    </Dialog.Header>
    <div class="space-y-1">
      {#each reviews as review}
        <div class="flex flex-col border rounded-md p-2">
          <div class="flex gap-2 items-center">
            <Status type={review.status ?? 'draft'} />
            <span class="text-xs">{review.reviewer}</span>
          </div>
          {#if review.comment}
            <div class="text-sm">{review.comment}</div>
          {/if}
        </div>
      {/each}
    </div>
  </Dialog.Content>
</Dialog.Root>
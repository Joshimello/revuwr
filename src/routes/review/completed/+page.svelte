<script lang="ts">
  import { onMount } from 'svelte'
  import { pb } from '$lib/pocketbase/client'

  onMount(() => {
    try {
      pb.authStore.clear()
    }
    catch (err) {}
  });
</script>

<div class="flex items-center gap-4">
  <h1 class="text-lg font-semibold md:text-2xl">
    Reviews submitted
  </h1>
</div>

<span class="text-muted-foreground">
  <p>Your reviews has been submitted successfully. (or review period has ended)</p>
  <p>Thank you for your feedbacks, you can now close this page.</p>
</span>
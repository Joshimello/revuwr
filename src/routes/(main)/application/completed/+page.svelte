<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { ChevronLeft } from "lucide-svelte";
  import { onMount } from "svelte";
</script>

<div class="flex items-center gap-4">
  <Button variant="outline" size="icon" class="h-7 w-7" href="/">
    <ChevronLeft class="h-4 w-4" />
    <span class="sr-only">Back</span>
  </Button>
  <h1 class="text-lg font-semibold md:text-2xl">
    Application submitted
  </h1>
</div>

<span class="text-muted-foreground">
  <p>Your application has been submitted successfully!</p>
  <p>You will be notified once it has been reviewed.</p>
  <p>Any updates will be sent to your email.
  <p>Thank you for applying!</p>
</span>
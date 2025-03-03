<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import { Checkbox } from "$lib/components/ui/checkbox";

  export let options: {

  }

  export let isEditing: boolean;
  export let required: boolean;
</script>

{#if options && isEditing}
  <Input placeholder="0987654321" />

  <div class="mt-6">

  </div>
{/if}

{#if options && !isEditing}
  <Input placeholder="0987654321" disabled />
  <span class="text-muted-foreground text-xs">
    {#if required}
      <span class="text-destructive">Required</span>
    {:else}
      <span>Optional</span>
    {/if}
  </span>
{/if}
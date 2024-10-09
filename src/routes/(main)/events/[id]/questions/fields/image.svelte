<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import { Checkbox } from "$lib/components/ui/checkbox";

  export let options: {
    isMaxFiles: boolean,
    maxFiles: number,
  }

  export let isEditing: boolean;
  export let required: boolean;
</script>

{#if options && isEditing}
  <Input type="file" disabled />

  <div class="mt-6">
    <div class="flex items-center gap-2">
      <Checkbox bind:checked={options.isMaxFiles} />
      <span>Limit image count</span>
      {#if options.isMaxFiles}
        <Input type="number" bind:value={options.maxFiles} class="w-32 h-6" min="0" />
      {/if}
    </div>
  </div>
{/if}

{#if options && !isEditing}
  <Input type="file" disabled />
  <span class="text-muted-foreground text-xs">
    {#if required}
      <span class="text-destructive">Required</span>
    {:else}
      <span>Optional</span>
    {/if}
    {#if options.isMaxFiles}
      <span>| Image count limit: {options.maxFiles}</span>  
    {/if}
  </span>
{/if}
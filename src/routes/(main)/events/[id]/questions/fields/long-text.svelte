<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import { Checkbox } from "$lib/components/ui/checkbox";
  import { Textarea } from "$lib/components/ui/textarea";

  export let options: {
    placeholder: string,
    isMaxLength: boolean,
    maxLength: number,
  }

  export let isEditing: boolean;
  export let required: boolean;
</script>

{#if options && isEditing}
  <Textarea bind:value={options.placeholder} placeholder="Placeholder" />

  <div class="mt-6">
    <div class="flex items-center gap-2">
      <Checkbox bind:checked={options.isMaxLength} />
      <span>Limit characters</span>
      {#if options.isMaxLength}
        <Input type="number" bind:value={options.maxLength} class="w-32 h-6" min="0" />
      {/if}
    </div>
  </div>
{/if}

{#if options && !isEditing}
  <Textarea value={options.placeholder} placeholder="Placeholder" disabled />
  <span class="text-muted-foreground text-xs">
    {#if required}
      <span class="text-destructive">Required</span>
    {:else}
      <span>Optional</span>
    {/if}
    {#if options.isMaxLength}
      <span>| Character limit: {options.maxLength}</span>  
    {/if}
  </span>
{/if}
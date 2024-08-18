<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import { Checkbox } from "$lib/components/ui/checkbox";
  import * as Select from "$lib/components/ui/select";
	import type { Selected } from "bits-ui";

  export let options: {
    isMaxFiles: boolean,
    maxFiles: number,
    isSpecificTypes: boolean,
    specificTypes: Selected<string>[]
  }

  export let isEditing: boolean;
  export let required: boolean;
</script>

{#if options && isEditing}
  <Input type="file" disabled />

  <div class="mt-6">
    <div class="flex items-center gap-2">
      <Checkbox bind:checked={options.isMaxFiles} />
      <span>Limit file count</span>
      {#if options.isMaxFiles}
        <Input type="number" bind:value={options.maxFiles} class="w-32 h-6" min="0" />
      {/if}
    </div>
    <div class="flex items-center gap-2">
      <Checkbox bind:checked={options.isSpecificTypes} />
      <span>Limit file type</span>
      {#if options.isSpecificTypes}
        <Select.Root multiple bind:selected={options.specificTypes}>
          <Select.Trigger class="w-32 h-6">
            <Select.Value placeholder="Select type" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="pdf">PDF</Select.Item>
            <Select.Item value="image">Image</Select.Item>
            <Select.Item value="audio">Audio</Select.Item>
            <Select.Item value="video">Video</Select.Item>
            <Select.Item value="document">Document</Select.Item>
            <Select.Item value="spreadsheet">Spreadsheet</Select.Item>
            <Select.Item value="presentation">Presentation</Select.Item>
          </Select.Content>
        </Select.Root>
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
      <span>| File count limit: {options.maxFiles}</span>  
    {/if}
    {#if options.isSpecificTypes}
      <span>| File type limit: {options.specificTypes.map(type => type.value).join(', ')}</span>
    {/if}
  </span>
{/if}
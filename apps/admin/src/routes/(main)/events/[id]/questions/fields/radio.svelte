<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { Plus, Trash } from "lucide-svelte";
	import { Button } from "$lib/components/ui/button";
	import { Label } from "$lib/components/ui/label";
  import * as RadioGroup from "$lib/components/ui/radio-group"

  export let options: {
    choices: string[],
    isMaxSelections: boolean,
    maxSelections: number,
    isOthers: boolean,
  }

  export let isEditing: boolean;
  export let required: boolean;
</script>

{#if options && isEditing}
  
  <RadioGroup.Root class="gap-0">
    {#each options.choices || [] as choice, index}  
    <div class="flex items-center gap-3">
      <RadioGroup.Item disabled class="w-5 h-5" value="uwu" />
      <Label class="flex-1">
        <input class="bg-transparent outline-none text-xl w-full" placeholder="Choice" bind:value={options.choices[index]}/>
      </Label>
      <Button class="h-5 w-5" disabled={options.choices.length < 2} variant="ghost" size="icon" on:click={() => {
        options.choices.splice(index, 1)
        options.choices = [...options.choices]
      }}>
        <Trash size="16" />
      </Button>
    </div>
    {/each}
    {#if options.isOthers}
    <div class="flex items-center gap-3">
      <RadioGroup.Item disabled class="w-5 h-5" value="uwu" />
      <Label class="flex-1">
        <span class="text-xl w-full">Others</span>
      </Label>
    </div>
    {/if}
  </RadioGroup.Root>
  <Button variant="ghost" size="sm" class="px-1 w-max flex items-center gap-1" on:click={() => [
    options.choices = options.choices ? [...options.choices, ''] : ['']
  ]}>
    <Plus size="16"/>
    Add choice
  </Button>

  <div class="mt-6">
    <div class="flex items-center gap-2">
      <Checkbox bind:checked={options.isOthers} />
      <span>Others option</span>
    </div>
    <div class="flex items-center gap-2">
      <Checkbox bind:checked={options.isMaxSelections} />
      <span>Limit selections</span>
      {#if options.isMaxSelections}
        <Input type="number" bind:value={options.maxSelections} class="w-32 h-6" min="0" />
      {/if}
    </div>
  </div>
{/if}

{#if options && !isEditing}

  <RadioGroup.Root class="gap-0">
    {#each options.choices || [] as choice, index}  
    <div class="flex items-center gap-3">
      <RadioGroup.Item disabled class="w-5 h-5" value="uwu" />
      <Label class="flex-1">
        <span class="text-xl w-full">{choice}</span>
      </Label>
    </div>
    {/each}
    {#if options.isOthers}
    <div class="flex items-center gap-3">
      <RadioGroup.Item disabled class="w-5 h-5" value="uwu" />
      <Label class="flex-1">
        <span class="text-xl w-full">Others</span>
      </Label>
    </div>
    {/if}
  </RadioGroup.Root>

  <span class="text-muted-foreground text-xs">
    {#if required}
      <span class="text-destructive">Required</span>
    {:else}
      <span>Optional</span>
    {/if}
    {#if options.isMaxSelections}
      <span>| Selection limit: {options.maxSelections}</span>  
    {/if}
  </span>
{/if}
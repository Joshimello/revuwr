<script lang="ts">
	import { Label } from "$lib/components/ui/label";
  import * as RadioGroup from "$lib/components/ui/radio-group"
  import { onMount } from "svelte";

  export let options: {
    choices: string[],
    isMaxSelections: boolean,
    maxSelections: number,
    isOthers: boolean,
  }

  export let required: boolean;

  export let value: {
    selected: number | null,
    others: string | null,
  } = {
    selected: null,
    others: null,
  };

  export let isValid: boolean;
  export let handleSave: () => void;
  export let disabled: boolean;

  const checkValid = () => required && value.selected !== null && value.selected >= 0;

  onMount(() => {
    value = {
      selected: value?.selected ?? null,
      others: value?.others ?? null,
    };
    isValid = checkValid();
  });

</script>

{#if value}
  <RadioGroup.Root {disabled} class="gap-0" value={value.selected?.toString()} onValueChange={v => {
    value.selected = parseInt(v);
    isValid = checkValid();
    handleSave();
  }}>
    {#each options.choices || [] as choice, index}  
      <div class="flex items-center gap-3">
        <RadioGroup.Item class="w-5 h-5" value={index.toString()} />
        <Label class="flex-1">
          <span class="text-xl w-full">{choice}</span>
        </Label>
      </div>
    {/each}
    {#if options.isOthers}
      <div class="flex items-center gap-3">
        <RadioGroup.Item class="w-5 h-5" value={options.choices.length.toString()} />
        <Label class="flex-1">
          <input class="text-xl w-full bg-transparent outline-none" placeholder="Others" bind:value={value.others}>
        </Label>
      </div>
    {/if}
  </RadioGroup.Root>
{/if}
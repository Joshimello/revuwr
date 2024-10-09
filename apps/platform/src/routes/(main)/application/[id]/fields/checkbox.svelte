<script lang="ts">
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { Input } from "$lib/components/ui/input";
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
    selected: number[],
    others: string | null,
  } = {
    selected: [],
    others: null,
  };

  export let isValid: boolean;
  export let handleSave: () => void;
  export let disabled: boolean;

  const checkValid = () => ((required && value.selected.length > 0) || !required) &&
    (options.isMaxSelections ? value.selected.length <= options.maxSelections : true);

  onMount(() => {
    value = {
      selected: value?.selected ?? [],
      others: value?.others ?? null,
    };
    isValid = checkValid();
  });

</script>

{#if value}
  {#each options.choices || [] as choice, index}
  <div class="flex items-center gap-3">
    <Checkbox 
      class="h-5 w-5 flex items-center justify-center"
      checked={value.selected.includes(index)}
      onCheckedChange={v => {
        if (v) value.selected = [...value.selected, index].sort((a, b) => a - b);
        else value.selected = value.selected.filter(i => i !== index);
        isValid = checkValid();
        handleSave();
      }}  
    />
    <Label class="flex-1">
      <span class="text-xl w-full">{choice}</span>
    </Label>
  </div>
  {/each}
  {#if options.isOthers}
  <div class="flex items-center gap-3">
    <Checkbox 
      class="h-5 w-5 flex items-center justify-center"
      disabled={disabled}
      checked={value.selected.includes(options.choices.length)}
      onCheckedChange={v => {
        if (v) value.selected = [...value.selected, options.choices.length];
        else value.selected = value.selected.filter(i => i !== options.choices.length);
        isValid = checkValid();
        handleSave();
      }}
    />
    <Label class="flex-1">
      <input
        class="outline-none text-xl w-full bg-transparent"
        placeholder="Others"
        bind:value={value.others}
        disabled={disabled}
      />
    </Label>
  </div>
  {/if}

  <span class="text-muted-foreground text-xs">
    {#if options.isMaxSelections}
      <span class:text-destructive={value.selected.length > options.maxSelections}>
        {value.selected.length}/{options.maxSelections} selected
      </span>
    {/if}
  </span>
{/if}
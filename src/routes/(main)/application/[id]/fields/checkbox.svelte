<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { Label } from "$lib/components/ui/label";
	import type { QuestionsResponse } from "$lib/pocketbase/pocketbase-types";
	import { onMount } from "svelte";

  export let question: QuestionsResponse;
  const options = question.options as {
    choices: string[],
    isMaxSelections: boolean,
    maxSelections: number,
    isOthers: boolean
  }

  export let disabled = false;
  export let value: {
    selected: number[],
    others: string | null,
  } | null;

  export const checkValid = () => {
    if (value == null) {
      return [false, ""]
    }
    if (disabled) {
      return [true, ""];
    }
    if (options.isMaxSelections && value.selected.length > options.maxSelections) {
      return [false, `Please select at most ${options.maxSelections} options`];
    }
    if (value.selected.includes(options.choices.length) && !value.others) {
      return [false, "Please fill in the others field"];
    }
    if (question.required && value.selected.length === 0) {
      return [false, "Please select an option"];
    }
    return [true, ""];
  }

  onMount(() => {
    if(!value) {
      value = {
        selected: [],
        others: null
      }
    }
  })

</script>

{#if value}
  {#each options.choices || [] as choice, index}
  <div class="flex items-center gap-3">
    <Checkbox 
      class="h-5 w-5 flex items-center justify-center"
      checked={value.selected.includes(index)}
      disabled={disabled}
      onCheckedChange={v => {
        if (!value) return;
        if (v) value.selected = [...value.selected, index].sort((a, b) => a - b);
        else value.selected = value.selected.filter(i => i !== index);
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
        if (!value) return;
        if (v) value.selected = [...value.selected, options.choices.length];
        else value.selected = value.selected.filter(i => i !== options.choices.length);
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
{/if}
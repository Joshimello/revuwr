<script lang="ts">
	import { Input } from "$lib/components/ui/input";
  import { onMount } from "svelte";

  export let options: {
    placeholder: string,
    isMaxLength: boolean,
    maxLength: number,
  }

  export let required: boolean;

  export let value: string | null;

  export let isValid: boolean;
  export let handleSave: () => void;

  const whitespaceRegex = /^\s*$/;
  const checkValid = () => required && value != null && value.length > 0 && !whitespaceRegex.test(value)
    && (!options.isMaxLength || value.length <= options.maxLength) || (typeof value == 'number')

  onMount(() => {
    value = value ?? options.placeholder ?? null;
    isValid = checkValid();
  });

  const handleBlur = (e: FocusEvent) => {
    value = (e.target as HTMLInputElement).value;
    isValid = checkValid();
    handleSave();
  }

  const handleInput = (e: InputEvent) => {
    value = (e.target as HTMLInputElement).value;
    isValid = checkValid();
  }

  export let disabled: boolean;

</script>

<Input {disabled} value={value} on:blur={handleBlur} on:input={handleInput} />
<span class="text-muted-foreground text-xs">
  {#if options.isMaxLength}
    <span class:text-destructive={options.isMaxLength && value && value.length > options.maxLength} >Character limit: {options.maxLength}</span>  
  {/if}
</span>
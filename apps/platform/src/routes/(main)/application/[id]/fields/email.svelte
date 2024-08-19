<script lang="ts">
	import { Input } from "$lib/components/ui/input";
  import { onMount } from "svelte";

  export let options: {

  }

  options

  export let required: boolean;

  export let value: string | null;

  export let isValid: boolean;
  export let handleSave: () => void;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const checkValid = () => required && value != null && value.length > 0 && emailRegex.test(value);

  onMount(() => {
    value = value ?? null;
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
  {#if value && !emailRegex.test(value)}
    <span class:text-destructive={true} >Invalid email format</span>  
  {/if}
</span>
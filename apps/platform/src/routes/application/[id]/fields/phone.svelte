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

  const phoneRegex = /^(?:\+8869\d{8}|09\d{8})$/;
  const checkValid = () => required && value != null && value.length > 0 && phoneRegex.test(value);

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

  export let disabled

</script>

<Input {disabled} value={value} on:blur={handleBlur} on:input={handleInput} />
<span class="text-muted-foreground text-xs">
  {#if value && !phoneRegex.test(value)}
    <span class:text-destructive={true} >Invalid mobile number</span>  
  {/if}
</span>
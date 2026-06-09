<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import type { QuestionsResponse } from "$lib/pocketbase/pocketbase-types";
  import { onMount } from "svelte";

  export let question: QuestionsResponse;
  const options = question.options as {

  } 
  options

  export let disabled = false;
  export let value: string | null;

  const phoneRegex = /^(?:\+8869\d{8}|09\d{8})$/;

  export const checkValid = () => {
    if (value == null || disabled) {
      return [false, ""]
    }
    if (value.length > 0 && !value.match(phoneRegex)) {
      return [false, "Invalid phone number"];
    }
    if (question.required && value.match(/^\s*$/)) {
      return [false, "Please fill in this field"];
    }
    return [true, ""];
  }

  onMount(() => {
    if (!value) {
      value = "";
    }
  });

</script>

<Input class="text-xl h-16" {disabled} bind:value={value} />
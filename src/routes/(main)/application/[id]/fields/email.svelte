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

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  export const checkValid = () => {
    if (value == null || disabled) {
      return [false, ""]
    }
    if (value.length > 0 && !emailRegex.test(value)) {
      return [false, "Invalid email format"];
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
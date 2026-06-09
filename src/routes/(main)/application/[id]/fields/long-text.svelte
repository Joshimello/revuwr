<script lang="ts">
	import { Textarea } from "$lib/components/ui/textarea";
	import type { QuestionsResponse } from "$lib/pocketbase/pocketbase-types";
  import { onMount } from "svelte";

  export let question: QuestionsResponse;
  const options = question.options as {
    placeholder: string,
    isMaxLength: boolean,
    maxLength: number,
  }

  export let disabled = false;
  export let value: string | null;

  export const checkValid = () => {
    if (value == null || disabled) {
      return [false, ""]
    }
    if (options.isMaxLength && value.length > options.maxLength) {
      return [false, `Character limit of ${options.maxLength} exceeded`];
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

<Textarea class="h-32 text-lg" {disabled} bind:value={value} />
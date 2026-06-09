<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import type { QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
	import { onMount } from 'svelte';

	export let question: QuestionsResponse;
	const options = question.options as {
		placeholder: string;
		isMaxLength: boolean;
		maxLength: number;
	};

	export let disabled = false;
	export let value: string | null;

	export const checkValid = () => {
		if (value == null || disabled) {
			return [false, ''];
		}
		if (options.isMaxLength && value.length > options.maxLength) {
			return [false, `Character limit of ${options.maxLength} exceeded`];
		}
		if (question.required && value.toString().match(/^\s*$/)) {
			return [false, 'Please fill in this field'];
		}
		return [true, ''];
	};

	onMount(() => {
		if (!value) {
			value = '';
		}
	});
</script>

<div class="flex w-full flex-col">
	<Input class="h-16 text-xl" {disabled} bind:value />
</div>

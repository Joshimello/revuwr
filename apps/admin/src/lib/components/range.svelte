<script lang="ts">
	import { Button } from './ui/button';
	import Input from './ui/input/input.svelte';

	export let value: {
		input: number[];
		output: number[];
	} = {
		input: [0, 0],
		output: [0]
	};
</script>

<div class="flex gap-1">
	<div class="flex flex-col">
		{#each value.input as v, i}
			<Input type="number" bind:value={value.input[i]} class="h-6" />
		{/each}
	</div>
	<div class="flex flex-col items-center pt-3">
		{#each value.output as v, i}
			<span>-></span>
		{/each}
	</div>
	<div class="flex flex-col pt-3">
		{#each value.output as v, i}
			<Input type="number" bind:value={value.output[i]} class="h-6" />
		{/each}
	</div>
</div>
<div class="flex w-full gap-1">
	<Button
		class="h-6 w-full text-lg font-bold"
		size="sm"
		variant="secondary"
		disabled={value.input.length === 2}
		on:click={() => {
			value.input = value.input.slice(0, -1);
			value.output = value.output.slice(0, -1);
		}}>-</Button
	>
	<Button
		class="h-6 w-full text-lg"
		size="sm"
		variant="secondary"
		on:click={() => {
			value.input = [...value.input, 0];
			value.output = [...value.output, 0];
		}}>+</Button
	>
</div>

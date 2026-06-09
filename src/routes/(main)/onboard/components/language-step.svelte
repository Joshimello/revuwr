<script lang="ts">
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, setLocale } from '$lib/paraglide/runtime.js';

	export let value: string;

	function handleLanguageChange(newValue: string | undefined) {
		if (newValue) {
			value = newValue;
			if (getLocale() !== newValue) {
				setLocale(newValue as 'en' | 'zh', {
					reload: true
				});
			}
		}
	}
</script>

<div class="flex w-full gap-6">
	<ToggleGroup.Root
		variant="outline"
		type="single"
		class="grid w-full grid-cols-2"
		bind:value
		onValueChange={handleLanguageChange}
	>
		<ToggleGroup.Item
			value="en"
			class="h-20 data-[state=on]:bg-foreground data-[state=on]:text-background"
		>
			{m.language_option_en()}
		</ToggleGroup.Item>
		<ToggleGroup.Item
			value="zh"
			class="h-20 data-[state=on]:bg-foreground data-[state=on]:text-background"
		>
			{m.language_option_zh()}
		</ToggleGroup.Item>
	</ToggleGroup.Root>
</div>

<style>
	/* Add any component-specific styles here if needed */
</style>

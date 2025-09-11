<script lang="ts">
	import { PUBLIC_USER_DEPARTMENT, PUBLIC_USER_OCCUPATION } from '$env/static/public';
	import CollegePicker from '$lib/components/college-picker.svelte';
	import DepartmentPicker from '$lib/components/department-picker.svelte';
	import { Label } from '$lib/components/ui/label';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { m } from '$lib/paraglide/messages.js';
	import type { DateValue } from '@internationalized/date';

	export let values: {
		language: string;
		name: string;
		username: string;
		email: string;
		country: string;
		phone: string;
		birthday: DateValue | undefined;
		occupation: string;
		department: string;
		dept: string;
	};

	$: showOccupation = PUBLIC_USER_OCCUPATION === 'show';
	$: showDepartment = PUBLIC_USER_DEPARTMENT === 'show';
</script>

<div class="flex w-full flex-col gap-6">
	{#if showOccupation}
		<ToggleGroup.Root
			variant="outline"
			type="single"
			class="grid w-full grid-cols-2"
			bind:value={values.occupation}
		>
			<ToggleGroup.Item
				value="student"
				class="h-20 data-[state=on]:bg-foreground data-[state=on]:text-background"
			>
				{m.onboard_student()}
			</ToggleGroup.Item>
			<ToggleGroup.Item
				value="teacher"
				class="h-20 data-[state=on]:bg-foreground data-[state=on]:text-background"
			>
				{m.onboard_staff()}
			</ToggleGroup.Item>
		</ToggleGroup.Root>
	{/if}

	{#if values.occupation === 'student' || values.occupation === 'teacher' || !showOccupation}
		<div class="grid grid-cols-1 gap-6">
			<div class="flex-1">
				<Label>{m.onboard_department()}</Label>
				<CollegePicker bind:value={values.department} />
			</div>
			{#if showDepartment}
				<div class="flex-1">
					<Label>Department</Label>
					<DepartmentPicker bind:value={values.dept} />
				</div>
			{/if}
		</div>
	{/if}
</div>

<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';
	import { addCollege, deleteCollege, syncColleges } from './methods';

	export let data: PageData;

	let newCollege = {
		en: '',
		zh: ''
	};

	let isLoading = false;

	async function handleSync() {
		isLoading = true;
		try {
			await syncColleges();
			toast.success('Colleges synced');
			await invalidateAll();
		} catch (error) {
			toast.error('Sync failed');
		} finally {
			isLoading = false;
		}
	}

	async function handleAddCollege() {
		if (!newCollege.en || !newCollege.zh) {
			toast.error('Validation error');
			return;
		}

		try {
			await addCollege(newCollege);
			toast.success('College added');
			newCollege = { en: '', zh: '' };
			await invalidateAll();
		} catch (error) {
			toast.error('Failed to add college');
		}
	}

	async function handleDeleteCollege(id: string) {
		try {
			await deleteCollege(id);
			toast.success('College deleted');
			await invalidateAll();
		} catch (error) {
			toast.error('Failed to delete college');
		}
	}
</script>

<div class="container mx-auto space-y-8 p-6">
	<h1 class="text-3xl font-bold">Settings</h1>

	<Card class="w-full">
		<CardHeader>
			<CardTitle>College Management</CardTitle>
			<CardDescription>Manage the list of colleges available in the system</CardDescription>
		</CardHeader>

		<CardContent>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-medium">Colleges</h3>
				<Button on:click={handleSync} disabled={isLoading}>
					{#if isLoading}
						<span class="mr-2 animate-spin">⟳</span>
					{/if}
					Sync Colleges
				</Button>
			</div>

			<div class="rounded-md border">
				<div class="h-[300px] overflow-y-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead class="w-[250px]">English Name</TableHead>
								<TableHead class="w-[250px]">Chinese Name</TableHead>
								<TableHead class="w-[100px]">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#if data.colleges && data.colleges.length > 0}
								{#each data.colleges as college}
									<TableRow>
										<TableCell>{college.en}</TableCell>
										<TableCell>{college.zh}</TableCell>
										<TableCell>
											<Button
												variant="destructive"
												size="sm"
												on:click={() => handleDeleteCollege(college.id)}
											>
												Delete
											</Button>
										</TableCell>
									</TableRow>
								{/each}
							{:else}
								<TableRow>
									<TableCell class="py-4 text-center">No colleges found</TableCell>
								</TableRow>
							{/if}
						</TableBody>
					</Table>
				</div>
			</div>
		</CardContent>

		<CardFooter class="flex flex-col space-y-4">
			<div class="w-full">
				<h3 class="mb-2 text-lg font-medium">Add New College</h3>
				<div class="mb-4 grid grid-cols-2 gap-4">
					<div>
						<label for="en" class="mb-1 block text-sm font-medium">English Name</label>
						<Input id="en" bind:value={newCollege.en} placeholder="College of Science" />
					</div>
					<div>
						<label for="zh" class="mb-1 block text-sm font-medium">Chinese Name</label>
						<Input id="zh" bind:value={newCollege.zh} placeholder="理學院" />
					</div>
				</div>
				<Button variant="outline" on:click={handleAddCollege}>Add College</Button>
			</div>
		</CardFooter>
	</Card>
</div>

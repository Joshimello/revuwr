<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { pb } from '$lib/pocketbase/client';
	import { AlertTriangle } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	export let eventId: string;
	export let onEventEnded: () => void = () => {};

	let isOpen = false;
	let isLoading = false;
	let confirmationText = '';
	const requiredConfirmation = 'END EVENT';

	const handleEndEvent = async () => {
		if (confirmationText !== requiredConfirmation) {
			toast.error('Please type "END EVENT" to confirm');
			return;
		}

		isLoading = true;
		try {
			// Update event end date to today
			const today = new Date();
			await pb.collection('events').update(eventId, {
				endDate: today.toISOString()
			});

			// Get all applications for this event with status 'draft'
			const draftApplications = await pb.collection('applications').getFullList({
				filter: `event = "${eventId}" && status = "draft"`
			});

			// Update all draft applications to 'withdrawn' status
			const updatePromises = draftApplications.map((application) =>
				pb.collection('applications').update(application.id, {
					status: 'withdrawn'
				})
			);

			await Promise.all(updatePromises);

			toast.success(
				`Event ended successfully. ${draftApplications.length} draft applications were withdrawn.`
			);

			// Invalidate all data to refresh the page
			await invalidateAll();

			// Close dialog and notify parent
			isOpen = false;
			confirmationText = '';
			onEventEnded();
		} catch (err) {
			console.error('Error ending event:', err);
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('Failed to end event. Please try again.');
			}
		} finally {
			isLoading = false;
		}
	};

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			confirmationText = '';
		}
		isOpen = open;
	};
</script>

<div class="grid gap-3">
	<Label class="font-medium text-destructive">End Event Early</Label>
	<p class="text-sm text-muted-foreground">
		This will set the event end date to today and automatically withdraw all draft applications.
		This action cannot be undone.
	</p>

	<Dialog.Root bind:open={isOpen} onOpenChange={handleOpenChange}>
		<Dialog.Trigger asChild let:builder>
			<Button builders={[builder]} variant="destructive" class="w-72">
				<AlertTriangle class="mr-2 h-4 w-4" />
				End Event Now
			</Button>
		</Dialog.Trigger>

		<Dialog.Content class="max-w-md">
			<Dialog.Header>
				<Dialog.Title class="flex items-center gap-2 text-destructive">
					<AlertTriangle class="h-5 w-5" />
					End Event Early
				</Dialog.Title>
				<Dialog.Description>
					This action will immediately end the event and cannot be undone.
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-4">
				<div class="rounded-md border border-orange-200 bg-orange-50 p-3">
					<h4 class="mb-2 text-sm font-medium text-orange-800">What will happen:</h4>
					<ul class="space-y-1 text-sm text-orange-700">
						<li>• Event end date will be set to today</li>
						<li>• All draft applications will be withdrawn</li>
						<li>• No new applications can be submitted</li>
						<li>• This action cannot be reversed</li>
					</ul>
				</div>

				<div class="space-y-2">
					<Label for="confirmation" class="text-sm font-medium">Type "END EVENT" to confirm:</Label>
					<Input
						id="confirmation"
						type="text"
						placeholder="END EVENT"
						bind:value={confirmationText}
						disabled={isLoading}
					/>
				</div>
			</div>

			<Dialog.Footer class="gap-2">
				<Dialog.Close asChild let:builder>
					<Button builders={[builder]} variant="outline" disabled={isLoading}>Cancel</Button>
				</Dialog.Close>
				<Button
					on:click={handleEndEvent}
					variant="destructive"
					disabled={confirmationText !== requiredConfirmation || isLoading}
				>
					{#if isLoading}
						Ending Event...
					{:else}
						End Event Now
					{/if}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>

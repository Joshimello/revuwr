<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type {
		AnswersResponse,
		ApplicationsResponse,
		ReviewsResponse,
		UsersResponse
	} from '$lib/pocketbase/pocketbase-types';
	import { Link2, SquareArrowOutUpRight, SquareMenu } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { statuses, default as Status } from '$lib/components/status.svelte';
	import { pb } from '$lib/pocketbase/client';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import { toast } from 'svelte-sonner';
	import { PUBLIC_PLATFORM_URL } from '$env/static/public';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import DatePicker from '$lib/components/date-picker.svelte';
	import { fromDate } from '@internationalized/date';
	import * as m from '$lib/paraglide/messages.js'

	export let record: ReviewsResponse;

	const handleChangeStatus = async (status: string) => {
		try {
			record.status = status;
			await pb.collection('reviews').update(record.id, {
				status: status
			});
			toast.success('Status updated');
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};

	let editDetailsOpen = false;
	let newReviewerEmail = '';
	let newReviewEndDate: Date | null = null;

	const saveEditDetails = async () => {
		try {
			await pb.collection('reviews').update(record.id, {
				reviewerEmail: newReviewerEmail,
				endDate: newReviewEndDate
			});
			toast.success('Details updated');
			editDetailsOpen = false;
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};
</script>

<div class="flex">
	<Button
		variant="ghost"
		size="icon"
		on:click={() => {
			navigator.clipboard.writeText(`${PUBLIC_PLATFORM_URL}/review/${record.id}`);
			toast.success('Link copied ' + `${PUBLIC_PLATFORM_URL}/review/${record.id}`);
		}}
	>
		<Link2 size="20" class="text-muted-foreground" />
	</Button>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger asChild let:builder>
			<Button variant="ghost" size="icon" builders={[builder]}>
				<SquareMenu size="20" class="text-muted-foreground" />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<DropdownMenu.Group>
				<DropdownMenu.Item 
          href={`${PUBLIC_PLATFORM_URL}/review/${record.id}`} 
          target="_blank">
          {m.view_review()}
        </DropdownMenu.Item>
				<DropdownMenu.Item
					on:click={() => {
						editDetailsOpen = true;
						newReviewerEmail = record.reviewerEmail;
						newReviewEndDate = new Date(record.endDate);
					}}>
						{m.edit_details()}
					</DropdownMenu.Item
				>
				<DropdownMenu.Sub>
					<DropdownMenu.SubTrigger>
						{m.edit_status()}
					</DropdownMenu.SubTrigger>
					<DropdownMenu.SubContent class="w-max">
						{#each Object.entries(statuses) as [key, value]}
							<DropdownMenu.Item on:click={() => handleChangeStatus(key)}>
								<Status type={key} />
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.SubContent>
				</DropdownMenu.Sub>
				<DropdownMenu.Sub>
					<DropdownMenu.SubTrigger>
						{m.download()}
					</DropdownMenu.SubTrigger>
					<DropdownMenu.SubContent>
						<DropdownMenu.Item disabled href={`/export/pdf/${record.id}`} target="_blank"
							>PDF</DropdownMenu.Item
						>
						<DropdownMenu.Item disabled>CSV</DropdownMenu.Item>
					</DropdownMenu.SubContent>
				</DropdownMenu.Sub>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Label class="text-muted-foreground p-0 px-2 font-mono text-xs font-normal"
				>{record.id}</DropdownMenu.Label
			>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>

<Dialog.Root bind:open={editDetailsOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				{m.editing_details()}
			</Dialog.Title>
		</Dialog.Header>
		<div>
			<Label>
				{m.reviewer_email()}
			</Label>
			<Input bind:value={newReviewerEmail} />
		</div>
		<div class="flex flex-col gap-1">
			<Label>
				{m.end_date()}
			</Label>
			<DatePicker
				value={newReviewEndDate ? fromDate(newReviewEndDate, 'Asia/Singapore') : undefined}
				onValueChange={(v) => {
					newReviewEndDate = v?.toDate('Asia/Singapore') ?? null;
				}}
			/>
		</div>
		<Dialog.Footer>
			<Button on:click={saveEditDetails}>
				{m.save()}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

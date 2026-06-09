<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { ExpandedUsersResponse } from './types';

	export let record: ExpandedUsersResponse;
</script>

{#if record.expand?.applications}
	<div class="flex items-center gap-1">
		<Badge class="flex w-6 justify-end p-1" variant="outline">
			{record.expand?.applications.filter(
				(i) => !['approved', 'editsRequested', 'rejected'].includes(i.status)
			).length ?? 0}
		</Badge>
		<Badge class="flex w-6 justify-end bg-lime-200 p-1" variant="outline">
			{record.expand?.applications.filter((i) => i.status === 'approved').length ?? 0}
		</Badge>
		<Badge class="flex w-6 justify-end bg-orange-200 p-1" variant="outline">
			{record.expand?.applications.filter((i) => i.status === 'editsRequested').length ?? 0}
		</Badge>
		<Badge class="flex w-6 justify-end bg-red-200 p-1" variant="outline">
			{record.expand?.applications.filter((i) => i.status === 'rejected').length ?? 0}
		</Badge>
	</div>
{/if}

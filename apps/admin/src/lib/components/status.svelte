<script lang="ts" context="module">
	import * as m from '$lib/paraglide/messages.js';

	export const statuses: {
		[key: string]: {
			label: string;
			classes: string;
		};
	} = {
		draft: {
			label: m.draft(),
			classes: 'bg-white text-black'
		},
		approved: {
			label: m.approved(),
			classes: 'bg-green-500 text-white'
		},
		submitted: {
			label: m.submitted(),
			classes: 'bg-blue-500 text-white'
		},
		resubmitted: {
			label: m.resubmitted(),
			classes: 'bg-indigo-500 text-white'
		},
		editsRequested: {
			label: m.edits_requested(),
			classes: 'bg-amber-500 text-white'
		},
		followUpRequested: {
			label: m.follow_up_requested(),
			classes: 'bg-orange-500 text-white'
		},
		rejected: {
			label: m.rejected(),
			classes: 'bg-red-500 text-white'
		},
		withdrawn: {
			label: m.withdrawn(),
			classes: 'bg-gray-500 text-white'
		}
	};
</script>

<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	export let type: string;
</script>

{#if statuses[type]}
	<Badge class={statuses[type].classes} variant="outline">
		{statuses[type].label}
	</Badge>
{:else}
	<Badge class="bg-gray-500 text-white">
		{m.unknown()}
	</Badge>
{/if}

<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages.js';
	import { RefreshCcw } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let loading = false;

	const handleRefresh = async () => {
		loading = true;

		toast.promise(invalidateAll(), {
			loading: m.refresh_loading(),
			success: m.refresh_success(),
			error: m.refresh_error()
		});

		setTimeout(() => {
			loading = false;
		}, 1000);
	};
</script>

<Button
	variant="outline"
	size="sm"
	class="flex h-7 items-center gap-2"
	on:click={handleRefresh}
	disabled={loading}
>
	<RefreshCcw size="14" class={loading ? 'animate-spin' : ''} />
	{m.button_refresh()}
</Button>

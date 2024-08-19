<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { LogIn, LogOut } from 'lucide-svelte';
  import { PUBLIC_ACME } from "$env/static/public"
  import { pb } from "$lib/pocketbase/client";
	import { user, type ExtendedAuthStore } from "$lib/stores";
	import { onMount } from 'svelte';
	import type { UsersResponse } from '$lib/pocketbase/pocketbase-types';

	pb.authStore.onChange((auth) => {
    $user = pb.authStore as ExtendedAuthStore;
  })

	onMount(() => {
		$user = pb.authStore as ExtendedAuthStore;
	})

</script>


<div class="bg-muted/40 min-h-screen min-w-screen">
	<div class="px-2 md:py-6 py-2 mx-auto max-w-4xl w-full">
		<div class="flex justify-between items-center md:mb-6 mb-2">
			<span class="text-lg font-semibold md:text-2xl">
				Platform
			</span>
			{#if $user && $user.isValid && $user.model}
				<Button href="/auth/logout" class="flex items-center gap-2 ">
					Logout <LogOut size="16"/>
				</Button>
			{:else}
				<Button href="/auth" class="flex items-center gap-2">
					Login <LogIn size="16"/>
				</Button>
			{/if}
		</div>
		<slot>
	
		</slot>
	</div>
</div>
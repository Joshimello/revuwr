<script lang="ts">
	import { pb } from '$lib/pocketbase/client';
	import type { UsersResponse } from '$lib/pocketbase/pocketbase-types';

	export let user: UsersResponse | undefined;

	const getAvatarUrl = (user: UsersResponse) => {
		if (!user?.avatar) return null;
		return pb.files.getUrl(user, user.avatar);
	};

	const getInitials = (name: string | undefined) => {
		if (!name) return '?';
		return name
			.split(' ')
			.map((word) => word.charAt(0))
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};
</script>

{#if user}
	<div class="flex items-center gap-3">
		{#if getAvatarUrl(user)}
			<img
				src={getAvatarUrl(user)}
				alt="{user.name}'s avatar"
				class="h-8 w-8 rounded-full border border-border/20 object-cover"
			/>
		{:else}
			<div
				class="flex h-8 w-8 items-center justify-center rounded-full border border-border/20 bg-gradient-to-br from-primary/20 to-primary/10 text-xs font-medium text-primary"
			>
				{getInitials(user.name || user.username)}
			</div>
		{/if}
		<div class="flex flex-col">
			<div class="font-medium text-nowrap">
				{user.name || 'Unnamed User'}
			</div>
			<div class="text-muted-foreground text-xs text-nowrap font-mono">
				{user.username}
			</div>
		</div>
	</div>
{:else}
	<div class="text-muted-foreground text-sm">No user data</div>
{/if}

<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_ACME } from '$env/static/public';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Popover from '$lib/components/ui/popover';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { pb } from '$lib/pocketbase/client';
	import type { NotificationsResponse, UsersResponse } from '$lib/pocketbase/pocketbase-types.js';
	import { handleStoredRedirect, redirectToLogin } from '$lib/utils/redirect';
	import { Bell, LogIn, LogOut, Settings2 } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { format } from 'timeago.js';

	export let data;
	$: ({ user } = data);

	// Handle redirect after login (but not on onboard page)
	onMount(() => {
		if (user) {
			// Check if we just completed onboarding
			if ($page.url.searchParams.get('onboard') === 'complete') {
				// Remove the parameter from URL
				const url = new URL($page.url);
				url.searchParams.delete('onboard');
				window.history.replaceState({}, '', url.toString());

				// Handle stored redirect
				handleStoredRedirect();
			} else if ($page.url.pathname !== '/onboard') {
				// Normal redirect handling (but not on onboard page)
				handleStoredRedirect();
			}
		}
	});

	let notifications: NotificationsResponse[] = [];
	let isLoadingNotifications = false;
	const getNotifications = async () => {
		isLoadingNotifications = true;
		try {
			pb.authStore.loadFromCookie(document.cookie);
			notifications = await pb.collection('notifications').getFullList<NotificationsResponse>({
				sort: '-created'
			});
		} catch (err) {
			if (err instanceof Error) toast.error(err.message);
			else toast.error('An error occurred.');
		}
		isLoadingNotifications = false;
	};

	const getAvatarUrl = (user: UsersResponse) => {
		if (!user.avatar) return null;
		return pb.files.getUrl(user, user.avatar);
	};

	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((word) => word.charAt(0))
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};
</script>

<div class="min-w-screen min-h-screen bg-gradient-to-br from-muted/30 via-muted/40 to-muted/60">
	<div class="mx-auto w-full max-w-4xl px-2 py-2 md:py-6">
		<div class="mb-2 flex items-center justify-between md:mb-6">
			<span
				class="mr-auto bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-lg font-bold tracking-tight text-transparent md:text-2xl"
			>
				{PUBLIC_ACME}
			</span>

			{#if user}
				<div class="flex items-center gap-2">
					<!-- Notifications Bell -->
					<Popover.Root
						onOpenChange={(value) => {
							if (value) getNotifications();
						}}
					>
						<Popover.Trigger let:builder asChild>
							<Button
								variant="ghost"
								size="icon"
								builders={[builder]}
								class="relative h-9 w-9 rounded-full border border-border/50 bg-background/80 backdrop-blur-sm transition-all duration-200 hover:bg-accent/50 hover:shadow-md"
							>
								<Bell size="16" />
								{#if notifications.length > 0}
									<div
										class="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-background bg-red-500"
									></div>
								{/if}
							</Button>
						</Popover.Trigger>
						<Popover.Content class="w-80 p-0">
							<div class="border-b px-4 py-3">
								<h4 class="font-medium">Notifications</h4>
							</div>
							{#if isLoadingNotifications}
								<div class="py-8 text-center text-sm text-muted-foreground">Loading...</div>
							{:else if notifications.length == 0}
								<div class="py-8 text-center text-sm text-muted-foreground">No notifications</div>
							{:else}
								<ScrollArea class="h-96">
									{#each notifications as notification}
										<div
											class="flex flex-col border-b px-4 py-3 transition-colors hover:bg-muted/50"
										>
											<span class="text-sm">{notification.message}</span>
											<span class="mt-1 text-xs text-muted-foreground"
												>{format(notification.created)}</span
											>
											{#if notification.link}
												<Button size="sm" class="mt-2 h-6 w-max text-xs" href={notification.link}>
													View
												</Button>
											{/if}
										</div>
									{/each}
								</ScrollArea>
							{/if}
						</Popover.Content>
					</Popover.Root>

					<!-- User Avatar Dropdown -->
					<DropdownMenu.Root>
						<DropdownMenu.Trigger let:builder asChild>
							<Button
								variant="ghost"
								builders={[builder]}
								class="relative h-9 w-9 rounded-full border border-border/50 bg-background/80 p-0 backdrop-blur-sm transition-all duration-200 hover:bg-accent/50 hover:shadow-md"
							>
								{#if getAvatarUrl(user)}
									<img
										src={getAvatarUrl(user)}
										alt="{user.name}'s avatar"
										class="h-8 w-8 rounded-full object-cover"
									/>
								{:else}
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-xs font-medium text-primary"
									>
										{getInitials(user.name)}
									</div>
								{/if}
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-64" align="end">
							<DropdownMenu.Group>
								<div class="flex items-center gap-3 px-2 py-3">
									{#if getAvatarUrl(user)}
										<img
											src={getAvatarUrl(user)}
											alt="{user.name}'s avatar"
											class="h-10 w-10 rounded-full border-2 border-border/20 object-cover"
										/>
									{:else}
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border/20 bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-medium text-primary"
										>
											{getInitials(user.name)}
										</div>
									{/if}
									<div class="flex flex-col">
										<span class="text-sm font-medium">{user.name}</span>
										<span class="text-xs text-muted-foreground">@{user.username}</span>
									</div>
								</div>
								<DropdownMenu.Separator />
								<DropdownMenu.Item href="/settings" class="cursor-pointer">
									<Settings2 size="16" class="mr-2" />
									Settings
								</DropdownMenu.Item>
								<!-- <DropdownMenu.Item
									href="mailto:joshualeanjw@gmail.com?subject=[Revuwr System Help] (Replace me with issue encountered)"
									target="_blank"
									class="cursor-pointer"
								>
									<HelpCircle size="16" class="mr-2" />
									Help
								</DropdownMenu.Item> -->
								<DropdownMenu.Separator />
								<DropdownMenu.Item
									href="/api/auth/signout"
									class="cursor-pointer text-red-600 focus:text-red-600"
								>
									<LogOut size="16" class="mr-2" />
									Logout
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			{:else}
				<Button
					class="flex items-center gap-2 rounded-full"
					on:click={() => redirectToLogin($page.url.pathname)}
				>
					<LogIn size="16" />
					<span class="hidden md:inline">Sign In</span>
				</Button>
			{/if}
		</div>
		<slot></slot>
	</div>
</div>

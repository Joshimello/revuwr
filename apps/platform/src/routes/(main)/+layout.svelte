<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_ACME } from '$env/static/public';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Popover from '$lib/components/ui/popover';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { pb } from '$lib/pocketbase/client';
	import type { NotificationsResponse } from '$lib/pocketbase/pocketbase-types.js';
	import { handleStoredRedirect, redirectToLogin } from '$lib/utils/redirect';
	import { Bell, HelpCircle, LogIn, LogOut, Settings2, User } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { format } from 'timeago.js';

	export let data;
	$: ({ user } = data);

	// Handle redirect after login
	onMount(() => {
		if (user) {
			handleStoredRedirect();
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
</script>

<div class="min-w-screen min-h-screen bg-muted/40">
	<div class="mx-auto w-full max-w-4xl px-2 py-2 md:py-6">
		<div class="mb-2 flex items-center md:mb-6">
			<span class="mr-auto text-lg font-semibold md:text-2xl">
				{PUBLIC_ACME}
			</span>
			{#if user}
				<Popover.Root
					onOpenChange={(value) => {
						if (value) getNotifications();
					}}
				>
					<Popover.Trigger let:builder asChild>
						<Button variant="outline" size="icon" builders={[builder]} class="mr-2">
							<Bell size="16" />
						</Button>
					</Popover.Trigger>
					<Popover.Content class="p-0">
						{#if isLoadingNotifications}
							<div class="py-2 text-center">Loading...</div>
						{:else if notifications.length == 0}
							<div class="py-2 text-center">No notifications</div>
						{:else}
							<ScrollArea class="h-96 px-4 py-2">
								{#each notifications as notification}
									<div class="flex flex-col border-b py-3 text-xs">
										<span>{notification.message}</span>
										<span class="text-muted-foreground">{format(notification.created)}</span>
										{#if notification.link}
											<Button size="sm" class="mt-1 h-5 w-max" href={notification.link}>
												View
											</Button>
										{/if}
									</div>
								{/each}
							</ScrollArea>
						{/if}
					</Popover.Content>
				</Popover.Root>

				<DropdownMenu.Root>
					<DropdownMenu.Trigger let:builder asChild>
						<Button variant="outline" size="icon" builders={[builder]}>
							<User size="16" />
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.Group>
							<DropdownMenu.Label>
								{user.name} ({user.username})
							</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Item href="/settings">
								<Settings2 size="16" class="mr-2" />
								Settings
							</DropdownMenu.Item>
							<DropdownMenu.Item
								href="mailto:joshualeanjw@gmail.com?subject=[Revuwr System Help] (Replace me with issue encountered)"
								target="_blank"
							>
								<HelpCircle size="16" class="mr-2" />
								Help
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item href="/api/auth/signout">
								<LogOut size="16" class="mr-2" />
								Logout
							</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<!-- <Button href="/api/auth/signout" class="flex items-center gap-2" variant="outline">
					Logout <LogOut size="16"/>
				</Button> -->
			{:else}
				<Button
					size="icon"
					class="flex items-center gap-2"
					on:click={() => redirectToLogin($page.url.pathname)}
				>
					<LogIn size="16" />
				</Button>
			{/if}
		</div>
		<slot></slot>
	</div>
</div>

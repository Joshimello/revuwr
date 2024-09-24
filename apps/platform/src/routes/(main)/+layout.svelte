<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { LogIn, User, Settings2, HelpCircle, Bell } from 'lucide-svelte';
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu"	
	import * as Popover from "$lib/components/ui/popover"
	import type { NotificationsResponse } from '$lib/pocketbase/pocketbase-types.js';
	import { pb } from '$lib/pocketbase/client';
	import { toast } from 'svelte-sonner';
	import { format } from 'timeago.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { PUBLIC_ACME } from '$env/static/public';

	export let data
	$: ({ user } = data)

	let notifications: NotificationsResponse[] = []
	let isLoadingNotifications = false
	const getNotifications = async () => {
		isLoadingNotifications = true
		try {
			pb.authStore.loadFromCookie(document.cookie)
			notifications = await pb.collection("notifications").getFullList<NotificationsResponse>({
				sort: "-created"
			})
		}
		catch (err) {
      if (err instanceof Error) toast.error(err.message)
      else toast.error("An error occurred.")
    }
		isLoadingNotifications = false
	}

</script>

<div class="bg-muted/40 min-h-screen min-w-screen">
	<div class="px-2 md:py-6 py-2 mx-auto max-w-4xl w-full">
		<div class="flex items-center md:mb-6 mb-2">
			<span class="text-lg font-semibold md:text-2xl mr-auto">
				{PUBLIC_ACME}
			</span>
			{#if user}

				<Popover.Root onOpenChange={value => {
					if (value) getNotifications()
				}}>
					<Popover.Trigger let:builder asChild>
						<Button variant="outline" size="icon" builders={[builder]} class="mr-2">
							<Bell size="16" />
						</Button>
					</Popover.Trigger>
					<Popover.Content class="p-0">
						{#if isLoadingNotifications}
							<div class="text-center py-2">
								Loading...
							</div>
						{:else}
							{#if notifications.length == 0}
								<div class="text-center py-2">
									No notifications
								</div>
							{:else}
								<ScrollArea class="h-96 py-2 px-4">
									{#each notifications as notification}
										<div class="border-b py-3 text-xs flex flex-col">
											<span>{notification.message}</span>
											<span class="text-muted-foreground">{format(notification.created)}</span>
											{#if notification.link}
												<Button size="sm" class="h-5 w-max mt-1" href={notification.link}>
													View
												</Button>
											{/if}
										</div>
									{/each}
								</ScrollArea>
							{/if}
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
							<DropdownMenu.Item href="mailto:joshualeanjw@gmail.com?subject=[Revuwr System Help] (Replace me with issue encountered)" target="_blank">
								<HelpCircle size="16" class="mr-2" />
								Help
							</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<!-- <Button href="/api/auth/signout" class="flex items-center gap-2" variant="outline">
					Logout <LogOut size="16"/>
				</Button> -->
			{:else}
				<Button size="icon" href="/api/auth/signin" class="flex items-center gap-2">
					<LogIn size="16"/>
				</Button>
			{/if}
		</div>
		<slot>
	
		</slot>
	</div>
</div>
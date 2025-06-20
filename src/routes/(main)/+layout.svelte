<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import { Badge } from '$lib/components/ui/badge';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Popover from '$lib/components/ui/popover';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Slider } from '$lib/components/ui/slider';
	import { i18n } from '$lib/i18n.js';
	import * as m from '$lib/paraglide/messages.js';
	import { availableLanguageTags, languageTag } from '$lib/paraglide/runtime.js';
	import { pb } from '$lib/pocketbase/client';
	import type { EventsResponse } from '$lib/pocketbase/pocketbase-types';
	import {
		ALargeSmall,
		CalendarFold,
		CircleUser,
		Languages,
		LogOutIcon,
		Menu,
		PanelsTopLeft,
		Settings2Icon
	} from 'lucide-svelte';
	import { onMount } from 'svelte';

	const user = pb.authStore.record;
	let events: EventsResponse[] = [];

	let nav = [
		{ icon: PanelsTopLeft, text: m.overview(), href: `${PUBLIC_BASE_PATH}/`, badge: 0, path: '' },
		{
			icon: CalendarFold,
			text: m.events(),
			href: `${PUBLIC_BASE_PATH}/events`,
			badge: 0,
			path: 'events'
		},
		{
			icon: CircleUser,
			text: m.users(),
			href: `${PUBLIC_BASE_PATH}/users`,
			badge: 0,
			path: 'users'
		},
		{
			icon: Settings2Icon,
			text: m.settings(),
			href: `${PUBLIC_BASE_PATH}/settings`,
			badge: 0,
			path: 'settings'
		}
	];

	// Route to translation mapping
	const routeTranslations: Record<string, () => string> = {
		'': m.overview,
		events: m.events,
		users: m.users,
		settings: m.settings,
		admin: m.admin,
		new: m.new_event,
		questions: m.questions,
		responses: m.event_responses,
		reviews: m.reviews,
		edit: m.edit_details,
		overview: m.overview,
		terms: m.terms
	};

	// Function to get event title by ID
	const getEventTitle = (eventId: string) => {
		const event = events.find((e) => e.id === eventId);
		if (event && event.name) {
			// Truncate to 30 characters and add ellipsis if needed
			return event.name.length > 30 ? event.name.substring(0, 16) + '...' : event.name;
		}
		return eventId;
	};

	$: breadcrumbs = (() => {
		if (!$page.route.id) return [];
		const parts = $page.route.id.split('/').slice(1);

		// Replace dynamic parameters with actual values
		for (let param in $page.params) {
			const paramIndex = parts.indexOf(`[${param}]`);
			if (paramIndex !== -1) {
				parts[paramIndex] = $page.params[param];
			}
		}

		const paths = parts.map((text, i) => {
			const routePath = parts.slice(1, i + 1).join('/');

			// Check if this is a dynamic parameter (starts with number or is an ID)
			const isDynamicParam = /^[0-9]/.test(text) || Object.values($page.params).includes(text);

			// Get translation or fallback to original text
			let translatedText;
			if (isDynamicParam) {
				// Check if this is an event ID (previous part is 'events')
				if (i > 0 && parts[i - 1] === 'events') {
					translatedText = getEventTitle(text);
				} else {
					// For other dynamic parameters, keep the original value
					translatedText = text;
				}
			} else if (routeTranslations[text]) {
				translatedText = routeTranslations[text]();
			} else {
				// Fallback: capitalize first letter and replace hyphens/underscores with spaces
				translatedText = text.charAt(0).toUpperCase() + text.slice(1).replace(/[-_]/g, ' ');
			}

			return {
				text: translatedText,
				href: `${PUBLIC_BASE_PATH}/` + routePath
			};
		});

		// Set the first breadcrumb to "admin"
		paths[0] = { text: routeTranslations['admin'](), href: `${PUBLIC_BASE_PATH}/` };
		return paths;
	})();

	onMount(async () => {
		document.documentElement.style.setProperty(
			'--font-multiplier',
			localStorage.getItem('font-multiplier') || '1'
		);

		try {
			const eventsList = await pb.collection('events').getList(1, 50, {
				fields: 'id,name',
				requestKey: 'breadcrumbs'
			});
			events = eventsList.items;
		} catch (error) {
			console.error('Failed to fetch events:', error);
		}
	});
</script>

<div class="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
	<div class="hidden border-r bg-muted/40 md:block">
		<div class="flex h-full max-h-screen flex-col gap-2">
			<div class="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
				<a href="{PUBLIC_BASE_PATH}/" class="flex items-center gap-2 font-semibold">
					<span>
						{m.admin()}
					</span>
				</a>
			</div>
			<div class="flex-1">
				<nav class="grid items-start px-2 text-sm font-medium lg:px-4">
					{#each nav as { icon, text, href, badge }}
						<a
							{href}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
						>
							<svelte:component this={icon} class="h-4 w-4" />
							<span>
								{text}
							</span>
							{#if badge}
								<Badge
									class="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
								>
									{badge}
								</Badge>
							{/if}
						</a>
					{/each}
				</nav>
			</div>
		</div>
	</div>
	<div class="flex flex-col">
		<header class="flex h-14 items-center border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
			<Sheet.Root>
				<Sheet.Trigger let:builder>
					<Button variant="outline" size="icon" class="shrink-0 md:hidden" builders={[builder]}>
						<Menu class="h-5 w-5"></Menu>
					</Button>
				</Sheet.Trigger>
				<Sheet.Content side="left" class="flex flex-col">
					<nav class="grid gap-2 text-lg font-medium">
						<a href="{PUBLIC_BASE_PATH}/" class="flex items-center gap-2 text-lg font-semibold">
							<span>{m.admin()}</span>
						</a>

						{#each nav as { icon, text, href, badge }}
							<a
								{href}
								class="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
							>
								<svelte:component this={icon} class="h-4 w-4" />
								<span>
									{text}
								</span>
								{#if badge}
									<Badge
										class="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
									>
										{badge}
									</Badge>
								{/if}
							</a>
						{/each}
					</nav>
				</Sheet.Content>
			</Sheet.Root>

			<div class="hidden w-full flex-1 sm:block">
				{#if breadcrumbs}
					<Breadcrumb.Root>
						<Breadcrumb.List>
							{#each breadcrumbs as { text, href }, i}
								<Breadcrumb.Item>
									<Breadcrumb.Link {href}>{text}</Breadcrumb.Link>
								</Breadcrumb.Item>
								{#if i !== breadcrumbs.length - 1}
									<Breadcrumb.Separator></Breadcrumb.Separator>
								{/if}
							{/each}
						</Breadcrumb.List>
					</Breadcrumb.Root>
				{/if}
			</div>

			{#if user}
				<span class="ml-4">
					{user.email}
				</span>
			{/if}

			<Popover.Root>
				<Popover.Trigger asChild let:builder>
					<Button size="icon" variant="ghost" builders={[builder]} class="ml-4">
						<ALargeSmall size="16" />
					</Button>
				</Popover.Trigger>
				<Popover.Content>
					<Slider
						value={[parseFloat(localStorage.getItem('font-multiplier') || '1')]}
						min={0.5}
						max={2}
						step={0.5}
						onValueChange={(v) => {
							document.documentElement.style.setProperty('--font-multiplier', v[0].toString());
							localStorage.setItem('font-multiplier', v[0].toString());
						}}
					/>
				</Popover.Content>
			</Popover.Root>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild let:builder>
					<Button size="icon" variant="ghost" builders={[builder]}>
						<Languages size="16" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Group>
						{#each availableLanguageTags as lang}
							<DropdownMenu.Item
								href={i18n.route($page.url.pathname)}
								hreflang={lang}
								disabled={lang === languageTag()}
							>
								{#if lang === languageTag()}
									<span class="font-bold">{lang}</span>
								{:else}
									{lang}
								{/if}
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<Button
				size="icon"
				variant="ghost"
				on:click={() => {
					pb.authStore.clear();
					goto('/auth');
				}}
			>
				<LogOutIcon size="16" />
			</Button>
		</header>

		<ScrollArea class="max-h-[calc(100vh-3.5rem)] flex-1 lg:max-h-[calc(100vh-60px)]">
			<div class="flex flex-col gap-4 p-4 lg:max-h-[calc(100vh-60px)] lg:gap-6 lg:p-6">
				<slot></slot>
				<div class="min-h-16"></div>
			</div>
		</ScrollArea>
	</div>
</div>

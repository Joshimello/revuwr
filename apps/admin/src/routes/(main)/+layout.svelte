<script lang="ts">
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
	import {
		ALargeSmall,
		CalendarFold,
		CircleUser,
		Languages,
		Menu,
		PanelsTopLeft,
		Settings2Icon
	} from 'lucide-svelte';
	import { onMount } from 'svelte';

	const user = pb.authStore.model;

	let nav = [
		{ icon: PanelsTopLeft, text: m.overview(), href: `${PUBLIC_BASE_PATH}/`, badge: 0 },
		{ icon: CalendarFold, text: m.events(), href: `${PUBLIC_BASE_PATH}/events`, badge: 0 },
		{ icon: CircleUser, text: m.users(), href: `${PUBLIC_BASE_PATH}/users`, badge: 0 },
		{ icon: Settings2Icon, text: m.settings(), href: `${PUBLIC_BASE_PATH}/settings`, badge: 0 }
	];

	$: breadcrumbs = (() => {
		if (!$page.route.id) return [];
		const parts = $page.route.id.split('/').slice(1);
		for (let param in $page.params) {
			parts[parts.indexOf(`[${param}]`)] = $page.params[param];
		}
		const paths = parts.map((text, i) => ({
			text,
			href: `${PUBLIC_BASE_PATH}/` + parts.slice(1, i + 1).join('/')
		}));
		paths[0] = { text: 'admin', href: `${PUBLIC_BASE_PATH}/` };
		return paths;
	})();

	onMount(() => {
		document.documentElement.style.setProperty(
			'--font-multiplier',
			localStorage.getItem('font-multiplier') || '1'
		);
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
							<span>Admin</span>
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
		</header>

		<ScrollArea class="max-h-[calc(100vh-3.5rem)] flex-1 lg:max-h-[calc(100vh-60px)]">
			<div class="flex flex-col gap-4 p-4 lg:max-h-[calc(100vh-60px)] lg:gap-6 lg:p-6">
				<slot></slot>
				<div class="min-h-16"></div>
			</div>
		</ScrollArea>
	</div>
</div>

<script lang="ts">
  import { CircleUser, Bell, Menu, Search, PanelsTopLeft, CalendarFold, Languages } from 'lucide-svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Input } from '$lib/components/ui/input';
  import * as Sheet from '$lib/components/ui/sheet';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb';
  import { type ComponentType } from 'svelte';
  import { pb } from '$lib/pocketbase/client';
  import { page } from '$app/stores';
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import * as m from '$lib/paraglide/messages.js'
  import { availableLanguageTags, languageTag } from '$lib/paraglide/runtime.js'
  import { i18n } from '$lib/i18n.js'

  const user = pb.authStore.model;

  let nav = [
    { icon: PanelsTopLeft, text: m.overview(), href: '/', badge: 0 },
    { icon: CalendarFold, text: m.events(), href: '/events', badge: 0 },
    { icon: CircleUser, text: m.users(), href: '/users', badge: 0 }
  ]
  
  $: breadcrumbs = (() => {
    if (!$page.route.id) return [];
    const parts = $page.route.id.split('/').slice(1);
    for (let param in $page.params) {
      parts[parts.indexOf(`[${param}]`)] = $page.params[param];
    }
    const paths = parts.map((text, i) => ({ text, href: '/' + parts.slice(1, i + 1).join('/') }));
    paths[0] = { text: 'admin', href: '/' };
    return paths;
  })()

</script>

<div class="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
  <div class="bg-muted/40 hidden border-r md:block">
    <div class="flex h-full max-h-screen flex-col gap-2">
      <div class="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <a href="/" class="flex items-center gap-2 font-semibold">
          <span>
            {m.admin()}
          </span>
        </a>
      </div>
      <div class="flex-1">
        <nav class="grid items-start px-2 text-sm font-medium lg:px-4">
          {#each nav as { icon, text, href, badge }}
            <a {href} class="text-muted-foreground hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2 transition-all">
              <svelte:component this={icon} class="h-4 w-4" />
              <span>
                {text}
              </span>
              {#if badge}
                <Badge class="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
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
    <header class="bg-muted/40 flex h-14 items-center gap-4 border-b px-4 lg:h-[60px] lg:px-6">
      
      <Sheet.Root>
        <Sheet.Trigger let:builder>
          <Button variant="outline" size="icon" class="shrink-0 md:hidden" builders={[builder]}>
            <Menu class="h-5 w-5"></Menu>
          </Button>
        </Sheet.Trigger>
        <Sheet.Content side="left" class="flex flex-col">
          <nav class="grid gap-2 text-lg font-medium">
            <a href="/" class="flex items-center gap-2 text-lg font-semibold">
              <span>Admin</span>
            </a>

            {#each nav as { icon, text, href, badge }}
              <a {href} class="text-muted-foreground hover:text-foreground mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2">
                <svelte:component this={icon} class="h-4 w-4" />
                <span>
                  {text}
                </span>
                {#if badge}
                  <Badge class="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    {badge}
                  </Badge>
                {/if}
              </a>
            {/each}

          </nav>
        </Sheet.Content>
      </Sheet.Root>

      <div class="w-full flex-1 hidden sm:block">
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
        {user.email}
      {/if}

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

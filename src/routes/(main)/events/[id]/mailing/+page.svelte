<script lang="ts">
  import * as m from '$lib/paraglide/messages.js'
  import { ChevronLeft } from 'lucide-svelte'
  import { page } from '$app/stores'
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import Editor from '$lib/components/editor.svelte';
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  
</script>

<div class="flex items-center gap-4">
  <Button variant="outline" size="icon" class="h-7 w-7" href="{PUBLIC_BASE_PATH}/events/{$page.params.id}">
    <ChevronLeft class="h-4 w-4" />
    <span class="sr-only">
      {m.back()}
    </span>
  </Button>
  <h1 class="text-lg font-semibold md:text-2xl">
    Mailing Settings
  </h1>
</div>

<Card.Root class="max-w-3xl">
  <Card.Header>
    <Card.Title>
      Reply-To Email
    </Card.Title>
    <Card.Description>
      Any replies to the automated emails will be sent to this email address.
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Input type="email" placeholder="Email" />
  </Card.Content>
</Card.Root>

<Card.Root class="max-w-3xl">
  <Card.Header>
    <Card.Title>
      Submission Message
    </Card.Title>
    <Card.Description>
      This is the email content that will be sent to the user when they submit the form.
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Editor class="h-64 border rounded-md py-1 px-2 text-xl" />
  </Card.Content>
  <Card.Footer>
    <p>Card Footer</p>
  </Card.Footer>
</Card.Root>
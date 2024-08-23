<script lang="ts">
	import { ParaglideJS } from '@inlang/paraglide-sveltekit'
	import { i18n } from '$lib/i18n'

  import '../app.css';
  import '@fontsource/geist-sans/400.css';
  import '@fontsource/geist-mono';
  import { toast } from "svelte-sonner";
  import { Toaster } from "$lib/components/ui/sonner";
</script>
<ParaglideJS {i18n}>


<Toaster />

<slot />
</ParaglideJS>
<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';

	import { Toaster } from '$lib/components/ui/sonner';
	import '@fontsource/geist-mono';
	import '@fontsource/geist-sans/400.css';
	import '../app.css';
</script>

<ParaglideJS {i18n}>
	<Toaster />

	<slot />
</ParaglideJS>

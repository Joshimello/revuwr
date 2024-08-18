<script lang="ts">
  import '../app.css';
  import '@fontsource/geist-sans/400.css';
  import '@fontsource/geist-mono';
  import { toast } from "svelte-sonner";
  import { Toaster } from "$lib/components/ui/sonner";
</script>

<Toaster />

<slot />
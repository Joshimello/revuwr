<script lang="ts">
  import { pb } from "$lib/pocketbase/client";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";

  let w: Window | null = null

  if (browser) {
    w = window.open()
  }

  onMount(async () => {
    if (w == null) return
    const authData = await pb
      .collection('users')
      .authWithOAuth2({ 
        provider: 'google',
        urlCallback: (url) => {
          w.location.href = url
        }
      });
    if (authData) {
      goto('/')
    }
  });
</script>
<script lang="ts">
  import { pb } from "$lib/pocketbase/client";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  onMount(() => {
    pb.authStore.clear();
    goto("/");
  });
</script>
<script lang="ts">
  import { pbImage } from "$lib/pocketbase/client";
  export let collectionId: string
  export let recordId: string
  export let file: string[]
</script>

{#if file.length > 0}
  {#each file as f}
    <a href={pbImage(collectionId, recordId, f)} target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">
      {f}
    </a>
  {/each}
{:else}
  -
{/if}
<script lang="ts">
  export let a: string | undefined;
  export let b: string | undefined;
</script>

{#if a}
  <div class="font-medium">
    {a}                
  </div>
{/if}
{#if b}
  <div class="text-muted-foreground text-xs" class:font-mono={b.length == 15}>
    {b}
  </div>
{/if}
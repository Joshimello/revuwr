<script lang="ts">
  export let a: string, b: string;
</script>

<div class="font-medium text-nowrap">
  {a}                
</div>
<div class="text-muted-foreground text-xs text-nowrap" class:font-mono={b.length == 15}>
  {b}
</div>
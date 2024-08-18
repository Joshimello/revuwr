<script lang="ts" context="module">
  export const statuses: {
    [key: string]: {
      label: string,
      classes: string
    }
  } = {
    "draft": {
      label: "Draft",
      classes: "bg-white text-black",
    },
    "approved": {
      label: "Approved",
      classes: "bg-green-500 text-white",
    },
    "submitted": {
      label: "Submitted",
      classes: "bg-blue-500 text-white",
    },
    "resubmitted": {
      label: "Resubmitted",
      classes: "bg-indigo-500 text-white",
    },
    "editsRequested": {
      label: "Edits requested",
      classes: "bg-amber-500 text-white",
    },
    "followUpRequested": {
      label: "Follow-up requested",
      classes: "bg-orange-500 text-white",
    },
    "rejected": {
      label: "Rejected",
      classes: "bg-red-500 text-white",
    },
    "withdrawn": {
      label: "Withdrawn",
      classes: "bg-gray-500 text-white",
    }
  }
</script>

<script lang="ts">
  import { Badge } from "$lib/components/ui/badge"

  export let type: string;
</script>

{#if statuses[type]}
<Badge class={statuses[type].classes} variant="outline">
  {statuses[type].label}
</Badge>
{:else}
<Badge class="bg-gray-500 text-white">
  Unknown
</Badge>
{/if}
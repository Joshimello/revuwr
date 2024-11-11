<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { FileCheck2, FileSearch2, FileX2, FileClock } from 'lucide-svelte';
	import type { ExpandedUsersResponse } from "./types";

  export let record: ExpandedUsersResponse
</script>

<div class="flex items-center gap-1">
  <Badge class="p-1 flex justify-end w-6" variant="outline">
    {record.expand?.applications.filter(i => !['approved', 'editsRequested', 'rejected'].includes(i.status)).length ?? 0}
  </Badge>
  <Badge class="bg-lime-200 p-1 flex justify-end w-6" variant="outline">
    {record.expand?.applications.filter(i => i.status === 'approved').length ?? 0}
  </Badge>
  <Badge class="bg-orange-200 p-1 flex justify-end w-6" variant="outline">
    {record.expand?.applications.filter(i => i.status === 'editsRequested').length ?? 0}
  </Badge>
  <Badge class="bg-red-200 p-1 flex justify-end w-6" variant="outline">
    {record.expand?.applications.filter(i => i.status === 'rejected').length ?? 0}
  </Badge>
</div>
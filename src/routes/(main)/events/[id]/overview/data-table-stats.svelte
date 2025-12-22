<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { ReviewsResponse } from '$lib/pocketbase/pocketbase-types';
	import { FileCheck2, FileClock, FileSearch2, FileX2 } from 'lucide-svelte';

	export let value: ReviewsResponse;
  const applications = value.applications;
  const review = value.review as Record<string, { status: string, comment: string }>;
</script>

<div class="flex items-center gap-1">
  <Badge class="bg-lime-200 p-1 flex w-14">
    <FileCheck2 size="14" class="mr-auto text-lime-700" />
    <div class="bg-white text-black px-1 rounded-sm">
      {Object.values(review).filter(i => i.status === 'approved').length}
    </div>
  </Badge>
  <Badge class="bg-orange-200 p-1 flex w-14">
    <FileSearch2 size="14" class="mr-auto text-orange-700" />
    <div class="bg-white text-black px-1 rounded-sm">
      {Object.values(review).filter(i => i.status === 'editsRequested').length}
    </div>
  </Badge>
  <Badge class="bg-red-200 p-1 flex w-14">
    <FileX2 size="14" class="mr-auto text-red-700" />
    <div class="bg-white text-black px-1 rounded-sm">
      {Object.values(review).filter(i => i.status === 'rejected').length}
    </div>
  </Badge>
  <Badge class="p-1 flex w-14" variant="outline">
    <FileClock size="14" class="mr-auto" />
    <div class="px-1 rounded-sm">
      {applications.filter(i => !Object.keys(review).includes(i)).length}
    </div>
  </Badge>
</div>
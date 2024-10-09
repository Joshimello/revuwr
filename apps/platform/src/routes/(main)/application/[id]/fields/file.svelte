<script lang="ts">
	import { Input, type FormInputEvent } from "$lib/components/ui/input";
	import type { Selected } from "bits-ui";
  import { onMount } from "svelte";
  import { pb, pbImage } from "$lib/pocketbase/client";
	import { toast } from "svelte-sonner";
	import { Button } from "$lib/components/ui/button";
  import { File, Trash, Upload } from "lucide-svelte"
	import type { AnswersResponse } from "$lib/pocketbase/pocketbase-types";

  export let options: {
    isMaxFiles: boolean,
    maxFiles: number,
    isSpecificTypes: boolean,
    specificTypes: Selected<string>[]
  }

  export let required: boolean;
  export let value: string[]; value
  export let isValid: boolean;
  export let record: AnswersResponse;
  export let handleSave: () => void;

  const fileTypes: Record<string, string[]> = {
    pdf: [".pdf"],
    image: [".gif", ".heic", ".heif", ".jpeg", ".jpg", ".png", ".svg", ".webp"],
    audio: [".aac", ".flac", ".m4a", ".mp3", ".ogg", ".wav"],
    video: [".avi", ".flv", ".m4v", ".mkv", ".mov", ".mp4", ".mpeg", ".mpg", ".webm", ".wmv"],
    document: [".doc", ".docx", ".odt", ".pdf", ".rtf", ".txt", ".wpd"],
    spreadsheet: [".csv", ".ods", ".xls", ".xlsx"],
    presentation: [".key", ".odp", ".ppt", ".pptx"],
  }

  const checkValid = () => required && record.files && record.files.length > 0
    && (!options.isMaxFiles || record.files.length <= options.maxFiles)
    && (!options.isSpecificTypes || checkFileType(record.files));

  const checkFileType = (files: string[]) => {
    for (const file of files) {
      const ext = file.split('.').pop();
      if (!ext) return false;
      if (options.specificTypes.length == 0) return true;
      if (!options.specificTypes.some(i => fileTypes[i.value].includes(`.${ext}`))) return false;
    }
    return true;
  }

  onMount(() => {
    isValid = checkValid();
    handleSave();
  });

  const handleChange = async (e: FormInputEvent) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files || files.length == 0) return;

    try {
      record = await pb.collection("answers").update(record.id, {
        "files": [...files]
      })
      toast.success("Saved");
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An error occurred");
      }
    }

    fileInput.value = "";
    isValid = checkValid();
    handleSave();
  }

  const handleDelete = async (file: string) => {
    try {
      record = await pb.collection("answers").update(record.id, {
        "files-": file
      })
      toast.success("Saved");
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An error occurred");
      }
    }
    
    fileInput.value = "";
    isValid = checkValid();
    handleSave();
  }

  let fileInput: HTMLInputElement;

  export let disabled: boolean;

</script>

{#if record.files && record.files.length > 0}
  <span class="text-sm">Uploaded files:</span>
  <div class="flex flex-col gap-2 mb-2 mt-1">
    {#each record.files as file}
      <div class="flex items-center gap-2">
        <Button {disabled} size="icon" variant="secondary" on:click={()=>handleDelete(file)}>
          <Trash size="16" />
        </Button>
        <a href={pbImage(record.collectionId, record.id, file)} target="_blank">
          {file}
        </a>
      </div>
    {/each}
  </div>
{/if}
<input class="hidden" type="file" on:change={handleChange} multiple bind:this={fileInput} />
<Button {disabled} class="flex items-center gap-2 w-full" variant="outline" on:click={() => fileInput.click()}>
  <Upload size="16" /> Upload files
</Button>
<span class="text-muted-foreground text-xs flex flex-col mt-1">
  {#if options.isSpecificTypes}
    <span class:text-destructive={options.isSpecificTypes && record.files && !checkFileType(record.files)} >
      Only {options.specificTypes.map(i => i.value).join(", ")} files allowed
    </span>
  {/if}
  {#if options.isMaxFiles}
    <span class:text-destructive={options.isMaxFiles && record.files && record.files.length > options.maxFiles} >
      Maximum {options.maxFiles} files allowed
    </span>
  {/if}
</span>
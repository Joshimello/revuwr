<script lang="ts">
	import type { Selected } from "bits-ui";
  import { onMount } from "svelte";
	import type { QuestionsResponse } from "$lib/pocketbase/pocketbase-types";
  import Dropzone from "svelte-file-dropzone"
	import { createFiles, removeFile } from "../methods";
  import * as Alert from "$lib/components/ui/alert";
  import { ArrowUpRight, FileWarning, SquareArrowOutUpRight, Trash } from "lucide-svelte";
  import * as Table from "$lib/components/ui/table"
	import { pbImage } from "$lib/pocketbase/client";
	import { Button } from "$lib/components/ui/button";
	import { toast } from "svelte-sonner";

  export let question: QuestionsResponse;
  const options = question.options as {
    isMaxFiles: boolean,
    maxFiles: number,
    isSpecificTypes: boolean,
    specificTypes: Selected<string>[]
  } | null | {}

  export let disabled = false;
  export let value: {
    collectionId: string,
    recordId: string,
    files: string[]
  }[]

  const fileTypes: Record<string, string[]> = {
    pdf: [".pdf"],
    image: [".gif", ".heic", ".heif", ".jpeg", ".jpg", ".png", ".svg", ".webp"],
    audio: [".aac", ".flac", ".m4a", ".mp3", ".ogg", ".wav"],
    video: [".avi", ".flv", ".m4v", ".mkv", ".mov", ".mp4", ".mpeg", ".mpg", ".webm", ".wmv"],
    document: [".doc", ".docx", ".odt", ".pdf", ".rtf", ".txt", ".wpd"],
    spreadsheet: [".csv", ".ods", ".xls", ".xlsx"],
    presentation: [".key", ".odp", ".ppt", ".pptx"],
  }

  const hasSpecificTypes = (opt: typeof options): opt is { 
    isMaxFiles: boolean; 
    maxFiles: number; 
    isSpecificTypes: boolean; 
    specificTypes: Selected<string>[]; 
  } => {
    return opt !== null && typeof opt === 'object' && 'isSpecificTypes' in opt && 'specificTypes' in opt;
  };

  const checkFileType = (files: string[]) => {
    for (const file of files) {
      const ext = file.split('.').pop();
      if (!ext) return false;
      if (hasSpecificTypes(options) && options.isSpecificTypes && options.specificTypes.length > 0) {
        if (!options.specificTypes.some(i => fileTypes[i.value].includes(`.${ext}`))) {
          return false;
        }
      } else {
        return true;
      }
    }
    return true;
  }

  export const checkValid = () => {
    if (value.length == 0 || disabled) {
      return [false, ""]
    }
    if (hasSpecificTypes(options) && options.isMaxFiles && value.length > options.maxFiles) {
      return [false, `Maximum of ${options.maxFiles} files exceeded`];
    }
    if (!checkFileType(value.map(i => i.files).flat())) {
      return [false, `Invalid file type`];
    }
    return [true, ""];
  }

  onMount(() => {
    if (!value) {
      value = [];
    }
  });

  let acceptedFiles: File[] = [];
  let fileRejections: {
    file: File,
    errors: {
      code: string,
      message: string
    }[]
  }[] = [];

  const handleFilesSelect = async (e: CustomEvent<any>) => {
    ({ acceptedFiles, fileRejections } = e.detail)
    const uploadedFiles = await createFiles(acceptedFiles);
    if (!uploadedFiles) return

    const filePaths = uploadedFiles.map(i => ({
      collectionId: i.collectionId,
      recordId: i.id,
      files: i.file
    }))

    value = [...value, ...filePaths];
  }

</script>

{#if value}

{#if value.length > 0}
<Table.Root class="border">
  <Table.Header>
    <Table.Row>
      <Table.Head></Table.Head>
      <Table.Head>File name</Table.Head>
      <Table.Head class="text-nowrap">File Type</Table.Head>
      <Table.Head class="text-right">Link</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each value as { collectionId, recordId, files }}
      {#each files as file}
        <Table.Row>
          <Table.Cell>
            <Button disabled={disabled} size="icon" variant="secondary" class="h-8 w-8" on:click={async () => {
              if (await removeFile(recordId, file)) {
                value = value.filter(i => {
                  const j = i.files.filter(k => k != file);
                  if (j.length == 0) return false;
                  i.files = j;
                  return true;
                })
              }
              else {
                toast.error('Failed to delete file');
              }
            }}>
              <Trash size="16" />
            </Button>
          </Table.Cell>
          <Table.Cell>{file}</Table.Cell>
          <Table.Cell>
            {@const ext = file.split('.').pop() || 'Unknown'}
            {ext}
          </Table.Cell>
          <Table.Cell class="text-right">
            <Button
              size="icon" 
              variant="secondary" 
              class="h-8 w-8"
              href={pbImage(collectionId, recordId, file)} target="_blank" rel="noopener noreferrer"
            >
              <SquareArrowOutUpRight size="16" />
            </Button>
          </Table.Cell>
        </Table.Row>
      {/each}
    {/each}
  </Table.Body>
</Table.Root>
{/if}

<Dropzone 
  disabled={disabled}
  on:drop={handleFilesSelect}
  multiple={hasSpecificTypes(options) && ((options.isMaxFiles && options.maxFiles > 1) || !options.isMaxFiles)}
  accept={hasSpecificTypes(options) && options.isSpecificTypes ? options.specificTypes.map(i => fileTypes[i.value].join(',')).join(',') : ''}
  maxSize={104857600}
  { ...(disabled ? {containerClasses: "cursor-not-allowed"} : {}) }
>
  Click or drop here
</Dropzone>

{#each fileRejections as { file, errors }}
  <Alert.Root variant="destructive">
    <FileWarning size="16" />
    <Alert.Title>
      {file.name}
    </Alert.Title>
    <Alert.Description class="flex flex-col gap-1">
      {#each errors as { code, message }}
        <span>{code} - {message}</span>
      {/each}
    </Alert.Description>
  </Alert.Root>
{/each}
{/if}
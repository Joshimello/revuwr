<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import { Checkbox } from "$lib/components/ui/checkbox";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { Button } from "$lib/components/ui/button";
  import { ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Info, TriangleAlert } from "lucide-svelte";
  import * as Table from "$lib/components/ui/table"
  import * as Popover from "$lib/components/ui/popover"
  import * as Tooltip from "$lib/components/ui/tooltip"
  import Editor from "$lib/components/editor.svelte";

  export let options: {
    headers: string[] | null;
    tips: string[] | null;
    body: string[][] | null;
  }

  export let isEditing: boolean;
  export let required: boolean;

  const getCell = (address: string) => {
    const column = address.match(/[A-Z]+/)?.[0] || '-1'
    const row = parseInt(address.match(/[0-9]+/)?.[0] || '-1', 10)
    if (column == '-1' || row == -1 || !options.body) return null;
    return options.body[row - 1][column.charCodeAt(0) - 65].replaceAll(/[=|?]/g, '')
  }

  const parseCell = (value: string) => {
    if (!value.startsWith('=')) return value
    const replacedValue = value
      .replace(/\b[A-Z][0-9]+\b/g, substring => {
        const cellValue = getCell(substring)
        if (cellValue == null || cellValue == '') return '0'
        return cellValue
      }).replaceAll(/[=|?]/g, '')

    try {
      return eval(replacedValue)
    }
    catch (err) {
      return "Error"
    }
  }

  let open = false

</script>

{#if options && isEditing}

  {#if options.body && options.headers && options.tips}
    <div 
      style="grid-template-columns: min-content repeat({options.body[0].length+1}, minmax(0, auto)); grid-template-rows: min-content repeat(auto-fill, minmax(0, auto));" 
      class="grid overflow-hidden">
      <span></span>
      {#each options.headers as _, i}
        <div class="flex items-center justify-start text-muted-foreground">
          <span class="px-1 shrink-0">
            {String.fromCharCode(65 + i)}:
          </span>
          <input class="bg-transparent w-full outline-none" placeholder="Header" bind:value={options.headers[i]}/>
        </div>
      {/each}
      <span></span>
      {#each options.body as row, i}
        <span class="flex items-start justify-center font-mono text-muted-foreground px-1 pt-1">
          {i+1}
        </span>
        {#each row as _, j}
          <span
            bind:textContent={options.body[i][j]}
            class="{j==row.length-1&&'border-r'} {i==options.body.length-1&&'border-b'} min-w-16 w-full h-full outline-none p-1 leading-tight border-t border-l whitespace-nowrap overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" 
            contenteditable
          />
        {/each}
        <Popover.Root>
          <Popover.Trigger asChild let:builder>
            <Button builders={[builder]} class="h-6 w-6 ml-1" size="icon" variant="outline">
              <Info size="16" />
            </Button>
          </Popover.Trigger>
          <Popover.Content class="w-80">
            <Editor bind:value={options.tips[i]} placeholder="Tips for row {i+1}..." class="outline-none" />
          </Popover.Content>
        </Popover.Root>
      {/each}
    </div>
  {/if}

  <div class="mt-4 flex gap-2">
    <Button variant="outline" size="sm" on:click={() => {
      options.body = options.body ? [...options.body, Array(options.body[0].length).fill("")] : [[""]];
      options.headers = options.headers ? [...options.headers] : [""]
      options.tips = options.tips ? [...options.tips, ""] : [""]
    }}>
      Add row <ArrowDown size="14" />
    </Button>
    <Button variant="outline" size="sm" on:click={() => {
      if (options.body && options.body.length > 1 && options.tips) {
        options.body = options.body.slice(0, -1);
        options.tips = options.tips.slice(0, -1);
      }
    }} disabled={!options.body || options.body.length <= 1}>
      Remove row <ArrowUp size="14" />
    </Button>
    <Button variant="outline" size="sm" class="ml-auto" on:click={() => {
      if (options.body && options.body[0].length > 1 && options.headers) {
        options.body = options.body.map(row => row.slice(0, -1));
        options.headers = options.headers?.slice(0, -1);
      }
    }} disabled={!options.body || options.body[0].length <= 1}>
      Remove column <ArrowLeft size="14" />
    </Button>
    <Button variant="outline" size="sm" on:click={() => {
      options.body = options.body?.map(row => [...row, ""]) || [[""]];
      options.headers = options.headers ? [...options.headers, ""] : [""];
      options.tips = options.tips ? [...options.tips] : [""];
    }}>
      Add column <ArrowRight size="14" />
    </Button>
  </div>

  <div class="mt-6">
    <div class="flex items-center gap-2">
      <!-- <Checkbox bind:checked={options.isMaxLength} />
      <span>Limit characters</span>
      {#if options.isMaxLength}
        <Input type="number" bind:value={options.maxLength} class="w-32 h-6" min="0" />
      {/if} -->
    </div>
  </div>
{/if}

{#if options && !isEditing}

  {#if options.body && options.headers && options.tips}
    <Table.Root>
      <Table.Header>
        <Table.Row>
          {#each options.headers as header}
            <Table.Cell>{header}</Table.Cell>
          {/each}
          <Table.Cell></Table.Cell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each options.body as row, i}
          <Table.Row>
            {#each row as cell}
              <Table.Cell>
                {#if cell.startsWith('?')}
                  <Input min="0" type="number" value={cell.slice(1)} on:input={e => {
                    cell = '?' + e.target.value
                  }} class="max-w-24" />
                {:else}
                  {parseCell(cell)}
                {/if}
              </Table.Cell>
            {/each}
            <Table.Cell>
              <Tooltip.Root open={open} openDelay={0} closeDelay={0}>
                <Tooltip.Trigger asChild let:builder>
                  <Button builders={[builder]} variant="default" size="icon" class="w-6 h-6 bg-orange-600">
                    <TriangleAlert size="16" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content side="bottom" class="text-md" align="end">
                  {@html options.tips[i]}
                </Tooltip.Content>
              </Tooltip.Root>
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  {/if}

  <span class="text-muted-foreground text-xs">
    {#if required}
      <span class="text-destructive">Required</span>
    {:else}
      <span>Optional</span>
    {/if}
    <!-- {#if options.isMaxLength}
      <span>| Character limit: {options.maxLength}</span>  
    {/if} -->
  </span>
{/if}
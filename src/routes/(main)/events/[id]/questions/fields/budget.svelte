<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import { Checkbox } from "$lib/components/ui/checkbox";
  import * as Card from "$lib/components/ui/card";
  import * as Table from "$lib/components/ui/table";
	import { Label } from "$lib/components/ui/label";
	import { Badge } from "$lib/components/ui/badge";
  import { CirclePlus } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";

  export let options: {
    isControlCount: boolean,
    minCount: number,
    maxCount: number,
  }

  export let isEditing: boolean;
  export let required: boolean;

  const consts = {
    Salary: 183,
    NHIRate: 0.0211,
  }

  const items: {
    [key: string]: {
      unitCost?: number,
      unitCount?: number,
      totalCalc: (...args: any) => number,
      list?: boolean,
      limit?: number
    }
  } = {
    "講座鐘點費-校外人士": {
      unitCost: 2000,
      totalCalc: (unitCount: number) => 
        unitCount * 2000
    },
    "交通費-校外人士": {
      totalCalc: (unitCost: number, unitCount: number) => 
        unitCost * unitCount
    },
    "交通費-本校學生國內差旅費": {
      list: true,
      totalCalc: (unitCost: number, unitCount: number) => 
        unitCost * unitCount
    },
    "保險費": {
      totalCalc: (unitCost: number, unitCount: number) => 
        unitCost * unitCount
    },
    "資料蒐集費": {
      limit: 5000,
      totalCalc: (unitCost: number, unitCount: number) => 
        unitCost * unitCount
    },
    "印刷費": {
      totalCalc: (unitCost: number, unitCount: number) => 
        unitCost * unitCount
    },
    "電腦軟體服務費": {
      list: true,
      totalCalc: (unitCost: number, unitCount: number) => 
        unitCost * unitCount
    },
    "教材教具費": {
      list: true,
      totalCalc: (unitCost: number, unitCount: number) => 
        unitCost * unitCount
    },
    "膳費": {
      unitCost: 100,
      totalCalc: (unitCount: number) => 
        unitCount * 100
    },
    "召集人工讀費": {
      unitCost: 183,
      totalCalc: (unitCount: number) => 
        unitCount * 183
    },
    "工讀勞退": {
      unitCost: 0,
      unitCount: 0,
      totalCalc: (total: number, lookup: { range: number[], value: number[] }) => 
        lookup.value[lookup.range.findIndex(r => total >= r)]
    },
    "工讀勞保": {
      unitCost: 0,
      unitCount: 0,
      totalCalc: (total: number, value: number) =>
        total ? value : 0
    },
    "二代健保補充保費": {
      unitCost: 0,
      unitCount: 0,
      totalCalc: () => 
        (values['講座鐘點費-校外人士'].unitTotal + values['召集人工讀費'].unitTotal) * multiplier
    },
    "雜支(耗材費)": {
      list: true,
      totalCalc: () => 
        values['雜支(耗材費)'].unitCost * values['雜支(耗材費)'].unitCount
    }
  }

  const values = Object.fromEntries(
    Object.keys(items).map(key => [key, {
      unitCost: items[key].unitCost || 0,
      unitCount: items[key].unitCount || 0,
      unitTotal: items[key].totalCalc()
    }])
  )

</script>

{#if options && isEditing}

  <div class="border rounded-md">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>Item</Table.Head>
          <Table.Head>Unit cost</Table.Head>
          <Table.Head>Unit count</Table.Head>
          <Table.Head>Total cost</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each Object.entries(items) as [key, value]}
          <Table.Row>
            <Table.Cell>
              {key}
            </Table.Cell>
            <Table.Cell>
              {#if value.unitCost || value.unitCost === 0}
                {value.unitCost}
              {:else}
                <Input type="number" />
              {/if}
            </Table.Cell>
            <Table.Cell>
              {#if value.unitCount || value.unitCost === 0}
                {value.unitCost}
              {:else}
                <Input type="number" />
              {/if}
            </Table.Cell>
            <Table.Cell>
              {value.totalCalc()}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>

  <div class="mt-6">
    <div class="flex items-center gap-2">
      <Checkbox bind:checked={options.isControlCount} />
      <span>Control activity count</span>
      {#if options.isControlCount}
        <Input type="number" bind:value={options.minCount} class="w-16 h-6" min="0" /> to
        <Input type="number" bind:value={options.maxCount} class="w-16 h-6" min="0" />
      {/if}
    </div>
  </div>
{/if}

{#if options && !isEditing}
  
  <div class="border rounded-md">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>When</Table.Head>
          <Table.Head>Topic</Table.Head>
          <Table.Head>Venue</Table.Head>
          <Table.Head>Note</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell>
            <div class="font-medium">Date</div>
            <div class="text-muted-foreground hidden text-sm md:inline">
              Time
            </div>
          </Table.Cell>
          <Table.Cell>
            <div class="font-medium">Topic</div>
          </Table.Cell>
          <Table.Cell>
            <div class="font-medium">Physical</div>
            <div class="text-muted-foreground hidden text-sm md:inline">
              Location
            </div>
          </Table.Cell>
          <Table.Cell>
            Extra info
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
    <div class="border-t p-1 flex justify-center">
      <Button variant="ghost" class="w-full" disabled>
        <CirclePlus size="16" />
        Add session
      </Button>
    </div>
  </div>

  <span class="text-muted-foreground text-xs">
    {#if required}
      <span class="text-destructive">Required</span>
    {:else}
      <span>Optional</span>
    {/if}
    {#if options.isControlCount}
      <span>| Sessions required: {options.minCount} - {options.maxCount}</span>  
    {/if}
  </span>
{/if}
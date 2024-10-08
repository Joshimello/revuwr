<script lang="ts">
  import { Calendar as CalendarIcon } from "lucide-svelte";
  import type { DateRange } from "bits-ui";
  import {
    CalendarDate,
    DateFormatter,
    getLocalTimeZone,
    parseDate,
    type DateValue
  } from "@internationalized/date";
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button";
  import { RangeCalendar } from "$lib/components/ui/range-calendar";
  import * as Popover from "$lib/components/ui/popover";
  import { onMount } from "svelte";

  const df = new DateFormatter("en-US", {
    dateStyle: "medium"
  });

  export let value: DateRange | undefined = undefined;
  export let startValue: DateValue | undefined = undefined;

  export let sValue: Date | undefined;
  export let eValue: Date | undefined;

  type OnValueChange = (value: DateRange) => void;
  export let onValueChange: OnValueChange | undefined = undefined;

</script>

<div class="grid gap-2">
  <Popover.Root openFocus>
    <Popover.Trigger asChild let:builder>
      <Button
        variant="outline"
        class={cn(
          "justify-start text-left font-normal",
          !value && "text-muted-foreground"
        )}
        builders={[builder]}
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {#if value && value.start}
          {#if value.end}
            {df.format(value.start.toDate(getLocalTimeZone()))} - {df.format(
              value.end.toDate(getLocalTimeZone())
            )}
          {:else}
            {df.format(value.start.toDate(getLocalTimeZone()))}
          {/if}
        {:else}
          Pick a date
        {/if}
      </Button>
    </Popover.Trigger>
    <Popover.Content class="w-auto p-0" align="start">
      <RangeCalendar
        bind:value
        bind:startValue
        initialFocus
        numberOfMonths={2}
        placeholder={value?.start}
        onValueChange={value => {
          sValue = value.start?.toDate(getLocalTimeZone())
          eValue = value.end?.toDate(getLocalTimeZone())
          if (sValue && eValue) {
            onValueChange?.(value)
          }
        }}
      />
    </Popover.Content>
  </Popover.Root>
</div>
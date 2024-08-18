<script lang="ts">
	import type {
		ReviewsResponse
	} from '$lib/pocketbase/pocketbase-types';
	import { type Writable } from 'svelte/store';
	import { createRender, createTable, Render, Subscribe } from 'svelte-headless-table';
	import * as Table from '$lib/components/ui/table';
	import DataTableAction from './data-table-action.svelte';
	import {
		addSortBy,
		addTableFilter,
		addHiddenColumns,
		addSelectedRows,
		addColumnFilters
	} from 'svelte-headless-table/plugins';
	import { Button } from '$lib/components/ui/button';
	import { ArrowDownAZ, ArrowUpZA, ChevronDown, Minus } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import Status, { statuses } from '$lib/components/status.svelte';
	import * as Select from '$lib/components/ui/select';
	import DataTableStats from './data-table-stats.svelte';

	export let data: Writable<ReviewsResponse[]>;

	const table = createTable(data, {
		sort: addSortBy(),
		filter: addTableFilter({
			fn: ({ filterValue, value }) => value.toLowerCase().includes(filterValue.toLowerCase())
		}),
		hide: addHiddenColumns(),
		select: addSelectedRows(),
		colFilter: addColumnFilters()
	});

	const columns = table.createColumns([
		table.column({
			id: 'actions',
			accessor: (value) => value,
			header: '',
			cell: ({ value }) => {
				return createRender(DataTableAction, { record: value });
			}
		}),
		table.column({
			id: 'id',
			accessor: 'id',
			header: 'Internal ID'
		}),
		table.column({
			id: 'email',
			accessor: 'reviewerEmail',
			header: 'Reviewer email',
		}),
		table.column({
			id: 'status',
			accessor: 'status',
			header: 'Status',
			cell: ({ value }) => createRender(Status, { type: value }),
			plugins: {
        colFilter: {
          fn: ({ filterValue, value }) => filterValue === value,
        }
      }
		}),
		table.column({
			id: 'stats',
			accessor: value => value,
			header: 'Stats',
			cell: ({ value }) => createRender(DataTableStats, { value: value }),
		}),
		table.column({
			id: 'endDate',
			accessor: 'endDate',
			header: 'End date',
			cell: ({ value }) => new Date(value).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			}),
			plugins: {
				filter: {
					getFilterValue: (value) =>
						new Date(value).toLocaleString('en-US', {
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						})
				}
			}
		}),
		table.column({
			id: 'updated',
			accessor: 'updated',
			header: 'Updated',
			cell: ({ value }) => new Date(value).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				hour12: true
			}),
			plugins: {
				filter: {
					getFilterValue: (value) =>
						new Date(value).toLocaleString('en-US', {
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						})
				}
			}
		}),
		table.column({
			id: 'created',
			accessor: 'created',
			header: 'Created',
			cell: ({ value }) => new Date(value).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				hour12: true
			}),
			plugins: {
				filter: {
					getFilterValue: (value) =>
						new Date(value).toLocaleString('en-US', {
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						})
				}
			}
		})
	]);

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates, flatColumns, rows } =
		table.createViewModel(columns);
	const { filterValue } = pluginStates.filter;
	const { hiddenColumnIds } = pluginStates.hide;
	const { selectedDataIds } = pluginStates.select;
	const { filterValues } = pluginStates.colFilter

	const ids = flatColumns.map((col) => col.id);
	let hideForId = Object.fromEntries(ids.map((id) => [id, true]));

	['id', 'updated', 'created'].forEach((id) => {
		hideForId[id] = false;
	});

	$: $hiddenColumnIds = Object.entries(hideForId)
		.filter(([, hide]) => !hide)
		.map(([id]) => id);

	const hiddenCols = ['checkbox', 'actions'];
</script>

<div class="grid w-max gap-6">
	<div class="sticky left-0 flex w-fit items-center gap-2">
		<Input
			class="max-w-sm"
			placeholder="Search..."
			spellcheck="false"
			autocomplete="off"
			aria-autocomplete="none"
			type="text"
			bind:value={$filterValue}
		/>
		<Select.Root onSelectedChange={selected => {
			if (selected?.value == "all") $filterValues.status = undefined
			else $filterValues.status = selected?.value
		}}>
			<Select.Trigger class="w-[180px]">
				<Select.Value placeholder="status" />
			</Select.Trigger>
			<Select.Content sameWidth={false}>
				<Select.Item value="all">All</Select.Item>
				{#each Object.entries(statuses) as [status, _]}
					<Select.Item value={status} class="w-full">
						<Status type={status} />
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
		<DropdownMenu.Root closeOnItemClick={false}>
			<DropdownMenu.Trigger asChild let:builder>
				<Button variant="outline" builders={[builder]}>
					Columns <ChevronDown class="ml-2 h-4 w-4" />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="max-w-64">
				<ScrollArea>
					{#each flatColumns as col}
						{#if !hiddenCols.includes(col.id)}
							<DropdownMenu.CheckboxItem bind:checked={hideForId[col.id]}>
								{col.header}
							</DropdownMenu.CheckboxItem>
						{/if}
					{/each}
				</ScrollArea>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
	<div class="w-max rounded-md border">
		<Table.Root {...$tableAttrs}>
			<Table.Header>
				{#each $headerRows as headerRow}
					<Subscribe rowAttrs={headerRow.attrs()}>
						<Table.Row>
							{#each headerRow.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()} let:props>
									<Table.Head {...attrs} class="[&:has([role=checkbox])]:pl-3">
										<div class="flex items-center gap-2">
											<Render of={cell.render()} />
											{#if cell.id != 'actions' && cell.id != 'checkbox'}
												<Button
													class="h-7 w-7"
													size="icon"
													variant="ghost"
													on:click={props.sort.toggle}
												>
													{#if props.sort.order == 'asc'}
														<ArrowDownAZ size="16" />
													{:else if props.sort.order == 'desc'}
														<ArrowUpZA size="16" />
													{:else}
														<Minus size="16" />
													{/if}
												</Button>
											{/if}
										</div>
									</Table.Head>
								</Subscribe>
							{/each}
						</Table.Row>
					</Subscribe>
				{/each}
			</Table.Header>
			<Table.Body {...$tableBodyAttrs}>
				{#each $pageRows as row (row.id)}
					<Subscribe rowAttrs={row.attrs()} let:rowAttrs>
						<Table.Row
							{...rowAttrs}
							data-state={$selectedDataIds[row.id] && 'selected'}
							on:click={(e) => {}}
						>
							{#each row.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs>
									<Table.Cell
										{...attrs}
										class={`[&:has([role=checkbox])]:pl-3 ${cell.id == 'actions' ? 'w-0 text-right' : ''}`}
									>
										<Render of={cell.render()} />
									</Table.Cell>
								</Subscribe>
							{/each}
						</Table.Row>
					</Subscribe>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>

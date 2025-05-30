<script lang="ts">
	import Status, { statuses } from '$lib/components/status.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import * as m from '$lib/paraglide/messages.js';
	import type { EventsResponse } from '$lib/pocketbase/pocketbase-types';
	import { ArrowDownAZ, ArrowUpZA, ChevronDown, Minus } from 'lucide-svelte';
	import { createRender, createTable, Render, Subscribe } from 'svelte-headless-table';
	import {
		addColumnFilters,
		addHiddenColumns,
		addSelectedRows,
		addSortBy,
		addTableFilter
	} from 'svelte-headless-table/plugins';
	import { type Readable } from 'svelte/store';
	import DataTableCell from '../responses/data-table-cell.svelte';
	import DataTableAction from './data-table-action.svelte';
	import DataTableControl from './data-table-control.svelte';
	import DataTableReviews from './data-table-reviews.svelte';
	import type { ExpandedApplication } from './types';

	type ReviewApplications = {
		application: ExpandedApplication;
		reviews: {
			reviewId: string;
			reviewer: string;
			status: string | undefined;
			comment: string | undefined;
		}[];
	}[];

	export let data: Readable<ReviewApplications>;
	export let event: EventsResponse;

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
			accessor: 'application',
			header: '',
			cell: ({ value }) => {
				return createRender(DataTableAction, { record: value });
			}
		}),
		table.column({
			id: 'id',
			accessor: 'application',
			header: m.serial_id(),
			cell: ({ value }) =>
				createRender(DataTableCell, {
					a: value.serial
						? `${event.responsePrefix}${value.serial.toString().padStart(3, '0')}`
						: '-',
					b: value.id
				}),
			plugins: {
				sort: {
					getSortValue: (value) => value.serial
				},
				filter: {
					getFilterValue: (value) =>
						value.id + ` ${event.responsePrefix}${value.serial.toString().padStart(3, '0')}`
				}
			}
		}),
		table.column({
			id: 'responder',
			accessor: (value) => value.application.expand?.responder,
			header: m.user(),
			cell: ({ value }) => createRender(DataTableCell, { a: value?.name, b: value?.username }),
			plugins: {
				sort: {
					getSortValue: (value) => value?.username
				},
				filter: {
					getFilterValue: (value) => value?.name + ` ${value?.username}`
				}
			}
		}),
		table.column({
			id: 'status',
			accessor: (value) => value.application.status,
			header: m.status(),
			cell: ({ value }) => createRender(Status, { type: value }),
			plugins: {
				colFilter: {
					fn: ({ filterValue, value }) => filterValue === value
				}
			}
		}),
		table.column({
			id: 'updated',
			accessor: (value) => value.application.updated,
			header: m.updated(),
			cell: ({ value }) => {
				return createRender(DataTableCell, {
					b: new Date(value).toLocaleString('en-US', {
						year: 'numeric',
						month: 'short',
						day: 'numeric'
					}),
					a: new Date(value).toLocaleString('en-US', {
						hour: 'numeric',
						minute: 'numeric',
						hour12: true
					})
				});
			},
			plugins: {
				filter: {
					getFilterValue: (value) =>
						new Date(value).toLocaleString('en-US', {
							year: 'numeric',
							month: 'short',
							day: 'numeric',
							hour: 'numeric',
							minute: 'numeric',
							hour12: true
						})
				}
			}
		}),
		table.column({
			id: 'reviews',
			accessor: 'reviews',
			header: m.reviews(),
			cell: ({ value }) => createRender(DataTableReviews, { reviews: value }),
			plugins: {
				sort: {
					getSortValue: (value) => value?.username
				},
				filter: {
					getFilterValue: (value) => value?.name + ` ${value?.username}`
				}
			}
		}),
		table.column({
			id: 'Controls',
			accessor: 'application',
			header: m.controls(),
			cell: ({ value }) => {
				return createRender(DataTableControl, { record: value, event: event });
			}
		}),
		table.column({
			id: m.notes(),
			accessor: (value) => value.application.adminNote,
			header: m.notes()
		})
	]);

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates, flatColumns, rows } =
		table.createViewModel(columns);
	const { filterValue } = pluginStates.filter;
	const { hiddenColumnIds } = pluginStates.hide;
	const { selectedDataIds } = pluginStates.select;
	const { filterValues } = pluginStates.colFilter;

	const ids = flatColumns.map((col) => col.id);
	let hideForId = Object.fromEntries(ids.map((id) => [id, true]));

	$: $hiddenColumnIds = Object.entries(hideForId)
		.filter(([, hide]) => !hide)
		.map(([id]) => id);

	const hiddenCols = ['checkbox', 'actions'];
</script>

<div class="grid w-max gap-6">
	<div class="sticky left-0 flex w-fit items-center gap-2">
		<Input
			class="max-w-sm"
			placeholder={m.search()}
			spellcheck="false"
			autocomplete="off"
			aria-autocomplete="none"
			type="text"
			bind:value={$filterValue}
		/>
		<Select.Root
			onSelectedChange={(selected) => {
				if (selected?.value == 'all') $filterValues.status = undefined;
				else $filterValues.status = selected?.value;
			}}
		>
			<Select.Trigger class="w-[180px]">
				<Select.Value placeholder={m.status()} />
			</Select.Trigger>
			<Select.Content sameWidth={false}>
				<Select.Item value="all">
					{m.all()}
				</Select.Item>
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
					{m.columns()}
					<ChevronDown class="ml-2 h-4 w-4" />
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
							class={`${row.original.application.adminColor} hover:${row.original.application.adminColor}`}
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

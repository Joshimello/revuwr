<script lang="ts">
	import type {
		AnswersResponse,
		ApplicationsResponse,
		EventsResponse,
		UsersResponse,
		QuestionsResponse
	} from '$lib/pocketbase/pocketbase-types';
	import { readable, type Writable } from 'svelte/store';
	import { createRender, createTable, Render, Subscribe } from 'svelte-headless-table';
	import * as Table from '$lib/components/ui/table';
	import DataTableCell from './data-table-cell.svelte';
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
	import DataTableCheckbox from './data-table-checkbox.svelte';
	import DataTableTable from './data-table-table.svelte';
	import DataTableLink from './data-table-link.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import Status, { statuses } from '$lib/components/status.svelte';
	import * as Select from '$lib/components/ui/select';
	import * as m from '$lib/paraglide/messages.js'

	type ExpandedApplications = ApplicationsResponse<{
		responder: UsersResponse;
		response: AnswersResponse[];
	}>;

	type ExpandedEvents = EventsResponse<{
		questions: QuestionsResponse[];
	}>;

	export let data: Writable<ExpandedApplications[]>;
	export let event: ExpandedEvents;

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
			id: 'checkbox',
			accessor: 'id',
			header: (_, { pluginStates }) => {
				const { allPageRowsSelected } = pluginStates.select;
				return createRender(DataTableCheckbox, {
					checked: allPageRowsSelected
				});
			},
			cell: ({ row }, { pluginStates }) => {
				const { getRowState } = pluginStates.select;
				const { isSelected } = getRowState(row);

				return createRender(DataTableCheckbox, {
					checked: isSelected
				});
			},
			plugins: {
				sort: {
					disable: true
				},
				filter: {
					exclude: true
				}
			}
		}),
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
			accessor: (value) => value,
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
			id: m.responder(),
			accessor: ({ expand }) => expand?.responder,
			header: m.user(),
			cell: ({ value }) => createRender(DataTableCell, { a: value?.name, b: value?.username }),
			plugins: {
				sort: {
					getSortValue: (value) => value.username
				},
				filter: {
					getFilterValue: (value) => value.name + ` ${value.username}`
				}
			}
		}),
		table.column({
			id: 'status',
			accessor: 'status',
			header: m.status(),
			cell: ({ value }) => createRender(Status, { type: value }),
			plugins: {
        colFilter: {
          fn: ({ filterValue, value }) => filterValue === value,
        }
      },
		}),
		table.column({
			id: 'updated',
			accessor: 'updated',
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
			id: 'adminNote',
			accessor: 'adminNote',
			header: m.notes()
		})
	]);

	event.expand?.questions.forEach((question) => {
		columns.push(
			table.column({
				id: question.id,
				accessor: (value: ExpandedApplications) =>
					value.expand?.response.find((i) => i.question == question.id),
				header: question.title.replaceAll(/<[^>]*>/g, ''),
				cell: ({ value }) => {
					if (value?.response == null) return '-';
					if (['shortText', 'longText', 'email', 'phone'].includes(question.type)) {
						return value.response as string;
					}
					if (question.type == 'radio') {
						if (
							(value.response as { selected: number; others: string }).selected ==
							(question.options as { choices: string[] }).choices.length
						) {
							return (value.response as { selected: number; others: string }).others;
						}
						return (question.options as { choices: string[] }).choices[
							(value.response as { selected: number; others: string }).selected
						];
					}
					if (question.type == 'member') {
						return createRender(DataTableTable, {
							headers: ['Department', 'Email', 'Name', 'Phone', 'Tags', 'ID', 'Year'],
							rows: value.response as Record<string, string>[]
						});
					}
					if (question.type == 'activity') {
						return createRender(DataTableTable, {
							headers: ['Date', 'End', 'Form', 'Location', 'Note', 'Start', 'Topic'],
							rows: value.response as Record<string, string>[]
						});
					}
					if (question.type == 'file') {
						return createRender(DataTableLink, {
							collectionId: value.collectionId,
							recordId: value.id,
							file: value.files
						});
					}
					return JSON.stringify(value?.response);
				}
			})
		);
	});

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates, flatColumns, rows } =
		table.createViewModel(columns);
	const { filterValue } = pluginStates.filter;
	const { hiddenColumnIds } = pluginStates.hide;
	const { selectedDataIds } = pluginStates.select;
	const { filterValues } = pluginStates.colFilter

	const ids = flatColumns.map((col) => col.id);
	let hideForId = Object.fromEntries(ids.map((id) => [id, true]));

	event.questions.forEach((questionId) => {
		hideForId[questionId] = false;
	});

	$: $hiddenColumnIds = Object.entries(hideForId)
		.filter(([, hide]) => !hide)
		.map(([id]) => id);

	const hiddenCols = ['checkbox', 'actions'];

	if (localStorage.getItem('hideForId')) {
		const filterValueFromLocalStorage = localStorage.getItem('filterValue') || '';
		if (filterValueFromLocalStorage) {
			$filterValue = filterValueFromLocalStorage;
		}

		const hideForIdFromLocalStorage = JSON.parse(localStorage.getItem('hideForId') || 'null');
		if (hideForIdFromLocalStorage) {
			hideForId = hideForIdFromLocalStorage;
		}
	}

	$: localStorage.setItem('filterValue', $filterValue);
	$: localStorage.setItem('hideForId', JSON.stringify(hideForId));

	export let selectedRecords;
	$: selectedRecords = $selectedDataIds;
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
		<Select.Root onSelectedChange={selected => {
			if (selected?.value == "all") $filterValues.status = undefined
			else $filterValues.status = selected?.value
		}}>
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
					{m.columns()} <ChevronDown class="ml-2 h-4 w-4" />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="max-w-64">
				<ScrollArea class="h-96">
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

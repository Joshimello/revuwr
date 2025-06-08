<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import * as m from '$lib/paraglide/messages.js';
	import { ArrowDownAZ, ArrowUpZA, Minus } from 'lucide-svelte';
	import { createRender, createTable, Render, Subscribe } from 'svelte-headless-table';
	import { addColumnFilters, addSortBy, addTableFilter } from 'svelte-headless-table/plugins';
	import DataTableAction from './data-table-action.svelte';
	import DataTableApplications from './data-table-applications.svelte';
	import DataTableDual from './data-table-dual.svelte';
	import { users } from './stores';

	const table = createTable(users, {
		sort: addSortBy(),
		filter: addTableFilter({
			fn: ({ filterValue, value }) => value.toLowerCase().includes(filterValue.toLowerCase())
		}),
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
			accessor: (value) => value,
			header: m.id(),
			cell: ({ value }) => {
				return createRender(DataTableDual, { a: value.username, b: value.id });
			},
			plugins: {
				sort: { getSortValue: (value) => value.username },
				filter: { getFilterValue: (value) => value.username + ' ' + value.id }
			}
		}),
		table.column({
			id: 'user',
			accessor: (value) => value,
			header: m.user(),
			cell: ({ value }) => {
				return createRender(DataTableDual, { a: value.name, b: value.nameEn });
			},
			plugins: {
				sort: { getSortValue: (value) => value.name },
				filter: { getFilterValue: (value) => value.name + ' ' + value.nameEn }
			}
		}),
		table.column({
			id: 'contact',
			accessor: (value) => value,
			header: m.contact(),
			cell: ({ value }) => {
				return createRender(DataTableDual, { a: value.email, b: value.phone });
			},
			plugins: {
				sort: { getSortValue: (value) => value.email },
				filter: { getFilterValue: (value) => value.email + ' ' + value.phone }
			}
		}),
		table.column({
			id: 'occupation',
			accessor: (value) => value,
			header: m.occupation(),
			cell: ({ value }) => {
				return value.occupation;
			},
			plugins: {
				sort: { getSortValue: (value) => value.occupation },
				filter: { getFilterValue: (value) => value.occupation },
				colFilter: { fn: ({ filterValue, value }) => filterValue.includes(value.occupation) }
			}
		}),
		table.column({
			id: 'department',
			accessor: (value) => value,
			header: m.department(),
			cell: ({ value }) => {
				return value.department;
			},
			plugins: {
				sort: { getSortValue: (value) => value.department },
				filter: { getFilterValue: (value) => value.department },
				colFilter: { fn: ({ filterValue, value }) => filterValue.includes(value.department) }
			}
		}),
		table.column({
			id: 'applications',
			accessor: (value) => value,
			header: m.historical_applications(),
			cell: ({ value }) => {
				return createRender(DataTableApplications, { record: value });
			},
			plugins: {
				sort: { getSortValue: (value) => value.applications.length },
				filter: { exclude: true }
			}
		})
	]);

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } =
		table.createViewModel(columns);

	const { filterValue } = pluginStates.filter;
	const { filterValues } = pluginStates.colFilter;

	const allOccupations = [...new Set($users.map((user) => user.occupation))].sort();
	const allDepartments = [...new Set($users.map((user) => user.department))].sort();
	const allYears = [...new Set($users.map((user) => user.year))].sort();
</script>

<div class="flex items-center gap-2">
	<Input class="max-w-xs" placeholder={m.search_anything()} type="text" bind:value={$filterValue} />
	<Select.Root
		multiple
		onSelectedChange={(selected) => {
			if (selected?.length == 0) {
				$filterValues.occupation = undefined;
				return;
			}
			$filterValues.occupation = selected?.map((s) => s.value);
		}}
	>
		<Select.Trigger class="w-min">
			<Select.Value placeholder={m.occupation()} />
		</Select.Trigger>
		<Select.Content sameWidth={false}>
			{#each allOccupations as occ}
				<Select.Item value={occ} class="w-full">
					{occ}
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
	<Select.Root
		multiple
		onSelectedChange={(selected) => {
			if (selected?.length == 0) {
				$filterValues.department = undefined;
				return;
			}
			$filterValues.department = selected?.map((s) => s.value);
		}}
	>
		<Select.Trigger class="w-min">
			<Select.Value placeholder={m.department()} />
		</Select.Trigger>
		<Select.Content sameWidth={false}>
			{#each allDepartments as dept}
				<Select.Item value={dept} class="w-full">
					{dept}
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
<div class="rounded-md border">
	<Table.Root {...$tableAttrs}>
		<Table.Header>
			{#each $headerRows as headerRow}
				<Subscribe rowAttrs={headerRow.attrs()}>
					<Table.Row>
						{#each headerRow.cells as cell (cell.id)}
							<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()} let:props>
								<Table.Head {...attrs}>
									<Render of={cell.render()} />
									{#if cell.id != 'actions' && cell.id != 'checkbox'}
										<Button
											class="h-7 w-7"
											size="icon"
											variant="ghost"
											on:click={(e) => {
												props.sort.toggle(e);
											}}
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
					<Table.Row {...rowAttrs}>
						{#each row.cells as cell (cell.id)}
							<Subscribe attrs={cell.attrs()} let:attrs>
								<Table.Cell {...attrs}>
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

<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import * as m from '$lib/paraglide/messages.js';
	import { ArrowDownAZ, ArrowUpZA, Minus, Users } from 'lucide-svelte';
	import { createRender, createTable, Render, Subscribe } from 'svelte-headless-table';
	import { addColumnFilters, addSortBy, addTableFilter } from 'svelte-headless-table/plugins';
	import BulkActions from './bulk-actions.svelte';
	import DataTableAction from './data-table-action.svelte';
	import DataTableApplications from './data-table-applications.svelte';
	import DataTableDual from './data-table-dual.svelte';
	import { users } from './stores';
	import type { ExpandedUsersResponse } from './types';

	let bulkActionsOpen = false;
	let selectedUsers: ExpandedUsersResponse[] = [];

	const table = createTable(users, {
		sort: addSortBy(),
		filter: addTableFilter({
			fn: ({ filterValue, value }) => value.toLowerCase().includes(filterValue.toLowerCase())
		}),
		colFilter: addColumnFilters()
	});

	const columns = table.createColumns([
		table.column({
			id: 'select',
			accessor: (value) => value,
			header: m.select(),
			cell: ({ value }) => {
				return value;
			},
			plugins: {
				sort: { disable: true }
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
			header: m.college(),
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
			id: 'dept',
			accessor: (value) => value,
			header: m.department(),
			cell: ({ value }) => {
				return value.dept;
			},
			plugins: {
				sort: { getSortValue: (value) => value.dept },
				filter: { getFilterValue: (value) => value.dept },
				colFilter: { fn: ({ filterValue, value }) => filterValue.includes(value.dept) }
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
	const allDepts = [...new Set($users.map((user) => user.dept))].sort().filter(Boolean);
</script>

<div class=" flex max-w-5xl items-center justify-between gap-2">
	<div class="flex items-center gap-2">
		<Input
			class="max-w-xs"
			placeholder={m.search_anything()}
			type="text"
			bind:value={$filterValue}
		/>

		{#if selectedUsers.length > 0}
			<Button variant="outline" on:click={() => (bulkActionsOpen = true)}>
				<Users size="16" />
				{m.bulk_actions()} ({selectedUsers.length})
			</Button>
		{/if}
	</div>

	<div class="flex items-center gap-2">
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
				<Select.Value placeholder={m.college()} />
			</Select.Trigger>
			<Select.Content sameWidth={false}>
				{#each allDepartments as dept}
					<Select.Item value={dept} class="w-full">
						{dept}
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
		<Select.Root
			multiple
			onSelectedChange={(selected) => {
				if (selected?.length == 0) {
					$filterValues.dept = undefined;
					return;
				}
				$filterValues.dept = selected?.map((s) => s.value);
			}}
		>
			<Select.Trigger class="w-min">
				<Select.Value placeholder={m.department()} />
			</Select.Trigger>
			<Select.Content sameWidth={false}>
				{#each allDepts as dept}
					<Select.Item value={dept} class="w-full">
						{dept}
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
</div>
<div class="max-w-5xl overflow-x-auto rounded-md border">
	<Table.Root {...$tableAttrs} class="w-max min-w-full">
		<Table.Header>
			{#each $headerRows as headerRow}
				<Subscribe rowAttrs={headerRow.attrs()}>
					<Table.Row>
						{#each headerRow.cells as cell (cell.id)}
							<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()} let:props>
								<Table.Head {...attrs}>
									<div class="flex items-center justify-between whitespace-nowrap">
										{#if cell.id === 'select'}
											<Checkbox
												checked={selectedUsers.length > 0 && selectedUsers.length === $users.length}
												onCheckedChange={(checked) => {
													if (checked) {
														selectedUsers = [...$users];
													} else {
														selectedUsers = [];
													}
												}}
												aria-label={m.select_all()}
											/>
										{:else}
											<Render of={cell.render()} />
										{/if}
										{#if cell.id != 'actions' && cell.id != 'select'}
											<Button
												class="ml-1 h-7 w-7 flex-shrink-0"
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
					<Table.Row {...rowAttrs}>
						{#each row.cells as cell (cell.id)}
							<Subscribe attrs={cell.attrs()} let:attrs>
								<Table.Cell {...attrs}>
									{#if cell.id === 'select'}
										<Checkbox
											checked={selectedUsers.some((u) => u.id === cell.render().id)}
											onCheckedChange={(checked) => {
												if (checked) {
													selectedUsers = [...selectedUsers, cell.render()];
												} else {
													selectedUsers = selectedUsers.filter((u) => u.id !== cell.render().id);
												}
											}}
											aria-label={m.select_row()}
										/>
									{:else}
										<Render of={cell.render()} />
									{/if}
								</Table.Cell>
							</Subscribe>
						{/each}
					</Table.Row>
				</Subscribe>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

<BulkActions bind:open={bulkActionsOpen} bind:selectedUsers />

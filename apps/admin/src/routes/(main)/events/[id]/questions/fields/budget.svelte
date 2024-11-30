<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import Editor from '$lib/components/editor.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Expand, Scroll } from 'lucide-svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Label } from '$lib/components/ui/label';
	import Range from '$lib/components/range.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { onMount } from 'svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Textarea } from '$lib/components/ui/textarea';

	export let isEditing: boolean;
	export let required: boolean;

	type Option = {
		name: string;
		defaultPrice: number;
		isConstantPrice: boolean;
		isLimitPrice: boolean;
		maxPrice: number;
		minPrice: number;
		defaultQuantity: number;
		isConstantQuantity: boolean;
		isLimitQuantity: boolean;
		maxQuantity: number;
		minQuantity: number;
		calculationMethod: string;
		customFormula: string;
		rangeTable: {
			input: number[];
			output: number[];
		};
		conditionTable: {
			condition: string;
			value: number;
		}[];
		isLimitTotal: boolean;
		maxTotal: number;
		minTotal: number;
		description: string;
		requestExplaination: boolean;
		minFinalTotal: number;
		maxFinalTotal: number;
	};

	const newItem: Option = {
		name: '',
		defaultPrice: 0,
		isConstantPrice: false,
		isLimitPrice: false,
		maxPrice: 0,
		minPrice: 0,
		defaultQuantity: 0,
		isConstantQuantity: false,
		isLimitQuantity: false,
		maxQuantity: 0,
		minQuantity: 0,
		calculationMethod: 'default',
		customFormula: '',
		rangeTable: {
			input: [0, 0],
			output: [0]
		},
		conditionTable: [],
		isLimitTotal: false,
		maxTotal: 0,
		minTotal: 0,
		description: '',
		requestExplaination: false,

		minFinalTotal: 0,
		maxFinalTotal: 0
	};

	export let options: Option[] = [];

	$: isInstanceofOptions = options instanceof Array;

	onMount(() => {
		if (!isInstanceofOptions) {
			options = [{ ...newItem }];
		}

		options.forEach((option) => {
			if (option.rangeTable.input.length < 2) {
				option.rangeTable.input = [0, 0];
				option.rangeTable.output = [0];
			}
		});
	});

	// let openIndex = -1;
	let openIndex = -1;

	let customFormulaInput: HTMLInputElement;

	const parseFormula = (formula: string, data: Option[]) => {
		let processedFormula = formula.replace(/\{(\d+)([PQT])\}/g, (match, index, type) => {
			const arrayIndex = parseInt(index) - 1;
			if (arrayIndex < 0 || arrayIndex >= data.length) return '0';

			const item = data[arrayIndex];
			if (type === 'P') {
				return item.defaultPrice.toString();
			} else if (type === 'Q') {
				return item.defaultQuantity.toString();
			} else if (type === 'T') {
				return (item.defaultPrice * item.defaultQuantity).toString();
			}
			return '0';
		});

		try {
			const value = new Function(`return ${processedFormula}`)();
			if (isNaN(value)) {
				return 'ERROR';
			}
			return value;
		} catch (error) {
			return 'ERROR';
		}
	};

	const parseRange = (
		formula: string,
		data: Option[],
		range: { input: number[]; output: number[] }
	) => {
		const parsedFormula = parseFormula(formula, data);
		const value = range.output[range.input.findLastIndex((value, index) => parsedFormula >= value)];
		if (isNaN(value)) {
			return 'ERROR';
		}
		return value;
	};
</script>

{#if isInstanceofOptions && isEditing}
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-min"></Table.Head>
					<Table.Head>經費項目</Table.Head>
					<Table.Head>單價（元）</Table.Head>
					<Table.Head>數量</Table.Head>
					<Table.Head>總價（元）</Table.Head>
					<Table.Head>用途與編列基準說明</Table.Head>
					<Table.Head class="text-end"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each options as item, index}
					<Table.Row>
						<Table.Cell>{index + 1}.</Table.Cell>
						<Table.Cell>{item.name}</Table.Cell>
						<Table.Cell>
							<span class="text-muted-foreground">
								{item.isConstantPrice ? '*' : ''}
							</span>
							{item.defaultPrice}
							<span class="text-muted-foreground">
								{#if item.isLimitPrice}
									({item.minPrice} -> {item.maxPrice})
								{/if}
							</span>
						</Table.Cell>
						<Table.Cell>
							<span class="text-muted-foreground">
								{item.isConstantQuantity ? '*' : ''}
							</span>
							{item.defaultQuantity}
							<span class="text-muted-foreground">
								{#if item.isLimitQuantity}
									({item.minQuantity} -> {item.maxQuantity})
								{/if}
							</span>
						</Table.Cell>
						<Table.Cell>
							{#if item.calculationMethod === 'default'}
								單價 * 數量
							{:else if item.calculationMethod === 'custom'}
								{item.customFormula}
							{:else if item.calculationMethod === 'range'}
								範圍
							{/if}
							<span class="text-muted-foreground">
								{#if item.isLimitTotal}
									({item.minTotal} -> {item.maxTotal})
								{/if}
							</span>
						</Table.Cell>
						<Table.Cell class="max-w-48">
							<div class="truncate break-all">
								{#if item.requestExplaination}
									<span class="text-muted-foreground"> (必填說明) </span>
								{/if}
								{item.description.replace(/<[^>]*>?/gm, '')}
							</div>
						</Table.Cell>
						<Table.Cell class="w-min text-end">
							<Button
								size="sm"
								variant="outline"
								on:click={() => {
									openIndex = index;
								}}
							>
								編輯
							</Button>
						</Table.Cell>
					</Table.Row>
					<Sheet.Root
						open={openIndex == index}
						onOpenChange={(open) => {
							if (!open) {
								openIndex = -1;
							}
						}}
					>
						<Sheet.Content class="flex flex-col gap-8 overflow-auto">
							<div class="flex flex-col gap-1">
								<Label class="text-muted-foreground">經費項目</Label>
								<Input type="text" bind:value={item.name} />
							</div>
							<div class="flex flex-col gap-1">
								<Label class="text-muted-foreground">單價（元）</Label>
								<Input type="number" bind:value={item.defaultPrice} />
								<div class="flex items-center gap-2">
									<Checkbox bind:checked={item.isLimitPrice} />
									<span>限制範圍</span>
								</div>
								{#if item.isLimitPrice}
									<div class="flex gap-1">
										<Input type="number" class="h-6" placeholder="Min" bind:value={item.minPrice} />
										->
										<Input type="number" class="h-6" placeholder="Max" bind:value={item.maxPrice} />
									</div>
								{/if}
								<div class="flex items-center gap-2">
									<Checkbox bind:checked={item.isConstantPrice} />
									<span>頂值</span>
								</div>
							</div>
							<div class="flex flex-col gap-1">
								<Label class="text-muted-foreground">數量</Label>
								<Input type="number" bind:value={item.defaultQuantity} />
								<div class="flex items-center gap-2">
									<Checkbox bind:checked={item.isLimitQuantity} />
									<span>限制範圍</span>
								</div>
								{#if item.isLimitQuantity}
									<div class="flex gap-1">
										<Input
											type="number"
											class="h-6"
											placeholder="Min"
											bind:value={item.minQuantity}
										/>
										->
										<Input
											type="number"
											class="h-6"
											placeholder="Max"
											bind:value={item.maxQuantity}
										/>
									</div>
								{/if}
								<div class="flex items-center gap-2">
									<Checkbox bind:checked={item.isConstantQuantity} />
									<span>頂值</span>
								</div>
							</div>
							<div class="flex flex-col gap-1">
								<Label class="text-muted-foreground">總價（元）</Label>
								<Select.Root
									selected={[
										{ value: 'default', label: '單價 * 數量' },
										{ value: 'custom', label: '自定公式' },
										{ value: 'range', label: '範圍' }
									].find((option) => option.value === item.calculationMethod)}
									onSelectedChange={(selected) => {
										item.calculationMethod = selected ? selected.value : 'default';
									}}
								>
									<Select.Trigger>
										<Select.Value placeholder="Calculation method..." />
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="default">單價 * 數量</Select.Item>
										<Select.Item value="custom">自定公式</Select.Item>
										<Select.Item value="range">範圍</Select.Item>
									</Select.Content>
								</Select.Root>
								{#if ['custom', 'range'].includes(item.calculationMethod)}
									<input
										bind:value={item.customFormula}
										bind:this={customFormulaInput}
										class="rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
									/>
									<div class="flex gap-1">
										<Button
											class="h-6"
											size="sm"
											variant="secondary"
											on:click={() => {
												item.customFormula += `{${index + 1}P}`;
												customFormulaInput.focus();
											}}
										>
											單價
										</Button>
										<Button
											class="h-6"
											size="sm"
											variant="secondary"
											on:click={() => {
												item.customFormula += `{${index + 1}Q}`;
												customFormulaInput.focus();
											}}
										>
											數量
										</Button>
										<DropdownMenu.Root>
											<DropdownMenu.Trigger let:builder asChild>
												<Button builders={[builder]} class="h-6" size="sm" variant="secondary">
													其他項目
												</Button>
											</DropdownMenu.Trigger>
											<DropdownMenu.Content class="h-64 overflow-auto">
												<DropdownMenu.Group>
													{#each options as option, optionIndex}
														<DropdownMenu.Item
															on:click={() => {
																item.customFormula += `{${optionIndex + 1}P}`;
																customFormulaInput.focus();
															}}
														>
															{option.name} - 單價
														</DropdownMenu.Item>
														<DropdownMenu.Item
															on:click={() => {
																item.customFormula += `{${optionIndex + 1}Q}`;
																customFormulaInput.focus();
															}}
														>
															{option.name} - 數量
														</DropdownMenu.Item>
														<DropdownMenu.Item
															on:click={() => {
																item.customFormula += `{${optionIndex + 1}T}`;
																customFormulaInput.focus();
															}}
														>
															{option.name} - 總價
														</DropdownMenu.Item>
													{/each}
												</DropdownMenu.Group>
											</DropdownMenu.Content>
										</DropdownMenu.Root>
									</div>
								{/if}
								{#if item.calculationMethod === 'range'}
									<Range bind:value={item.rangeTable} />
								{/if}
								<div class="flex items-center gap-2">
									<Checkbox bind:checked={item.isLimitTotal} />
									<span>限制範圍</span>
								</div>
								{#if item.isLimitTotal}
									<div class="flex gap-1">
										<Input type="number" class="h-6" placeholder="Min" bind:value={item.minTotal} />
										->
										<Input type="number" class="h-6" placeholder="Max" bind:value={item.maxTotal} />
									</div>
								{/if}
							</div>
							<div class="flex flex-col gap-1">
								<Label class="text-muted-foreground">用途與編列基準說明</Label>
								<Editor class="h-64 rounded-md border p-2" bind:value={item.description} />
								<div class="flex items-center gap-2">
									<Checkbox bind:checked={item.requestExplaination} />
									<span>必填用圖說明</span>
								</div>
							</div>
							<Button
								variant="destructive"
								on:click={() => [options.splice(index, 1), (options = [...options])]}
								>刪除
							</Button>
						</Sheet.Content>
					</Sheet.Root>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<Button
		size="sm"
		variant="outline"
		class="w-full"
		on:click={() => {
			options = [...options, { ...newItem }];
			setTimeout(() => {
				openIndex = options.length - 1;
			}, 50);
		}}>+ 新增</Button
	>

	<div class="mt-6">
		限制總價範圍
		<div class="flex items-center gap-2">
			<Input type="number" bind:value={options[0].minFinalTotal} />
			->
			<Input type="number" bind:value={options[0].maxFinalTotal} />
		</div>
	</div>

	<div class="mt-6"></div>
{/if}

{#if options && !isEditing}
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-min"></Table.Head>
					<Table.Head>經費項目</Table.Head>
					<Table.Head>單價（元）</Table.Head>
					<Table.Head>數量</Table.Head>
					<Table.Head>總價（元）</Table.Head>
					<Table.Head>用途與編列基準說明</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each options as item, index}
					<Table.Row>
						<Table.Cell>{index + 1}.</Table.Cell>
						<Table.Cell class="text-nowrap">{item.name}</Table.Cell>
						<Table.Cell class="w-32">
							{#if item.isConstantPrice}
								<Input type="number" bind:value={item.defaultPrice} disabled />
							{:else}
								<Input type="number" bind:value={item.defaultPrice} />
							{/if}
						</Table.Cell>
						<Table.Cell class="w-32">
							{#if item.isConstantQuantity}
								<Input type="number" bind:value={item.defaultQuantity} disabled />
							{:else}
								<Input type="number" bind:value={item.defaultQuantity} />
							{/if}
						</Table.Cell>
						<Table.Cell class="w-48">
							{#if item.calculationMethod === 'default'}
								{item.defaultPrice * item.defaultQuantity}
							{:else if item.calculationMethod === 'custom'}
								{parseFormula(item.customFormula, options)}
							{:else if item.calculationMethod === 'range'}
								{parseRange(item.customFormula, options, item.rangeTable)}
							{/if}
						</Table.Cell>
						<Table.Cell class="w-96">
							{@html item.description}
							{#if item.requestExplaination}
								<Textarea class="mt-2" placeholder="請填寫用途説明" />
							{/if}
						</Table.Cell>
					</Table.Row>
				{/each}
				<Table.Row>
					<Table.Cell></Table.Cell>
					<Table.Cell>總價</Table.Cell>
					<Table.Cell></Table.Cell>
					<Table.Cell></Table.Cell>
					<Table.Cell>
						{(() => {
							let total = 0;
							options.forEach((item) => {
								if (item.calculationMethod === 'default') {
									total += item.defaultPrice * item.defaultQuantity;
								} else if (item.calculationMethod === 'custom') {
									const value = parseFormula(item.customFormula, options);
									if (Number.isNaN(value) || value === 'ERROR') {
										return 'ERROR';
									}
									total += value;
								} else if (item.calculationMethod === 'range') {
									const value = parseRange(item.customFormula, options, item.rangeTable);
									if (Number.isNaN(value) || value === 'ERROR') {
										return 'ERROR';
									}
									// cuz rangeTable.input and rangeTable.output are both string arrays due to input
									// @ts-ignore
									total += parseInt(value);
								}
							});
							return total;
						})()}
					</Table.Cell>
					<Table.Cell></Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
	</div>
{/if}

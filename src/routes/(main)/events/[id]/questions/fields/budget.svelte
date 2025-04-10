<script lang="ts">
	import Editor from '$lib/components/editor.svelte';
	import Range from '$lib/components/range.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Table from '$lib/components/ui/table';
	import { Textarea } from '$lib/components/ui/textarea';
	import { onMount } from 'svelte';

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
		roundingMethod: 'none' | 'round' | 'floor' | 'ceil';
		roundingDecimalPlaces: number;
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
		roundingMethod: 'none',
		roundingDecimalPlaces: 0,
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
								<div class="flex flex-col gap-1">
									<div class="flex items-center gap-2">
										<Select.Root
											selected={[
												{ value: 'none', label: '不處理' },
												{ value: 'round', label: '四捨五入' },
												{ value: 'floor', label: '無條件捨去' },
												{ value: 'ceil', label: '無條件進位' }
											].find((option) => option.value === (item.roundingMethod || 'none'))}
											onSelectedChange={(selected) => {
												item.roundingMethod = selected ? selected.value : 'none';
											}}
										>
											<Select.Trigger>
												<Select.Value placeholder="選擇四捨五入方式..." />
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="none">不處理</Select.Item>
												<Select.Item value="round">四捨五入</Select.Item>
												<Select.Item value="floor">無條件捨去</Select.Item>
												<Select.Item value="ceil">無條件進位</Select.Item>
											</Select.Content>
										</Select.Root>

										{#if item.roundingMethod && item.roundingMethod !== 'none'}
											<Label class="text-muted-foreground">小數位數</Label>
											<Input
												type="number"
												class="h-8 w-24"
												min="0"
												max="10"
												bind:value={item.roundingDecimalPlaces}
											/>
										{/if}
									</div>
								</div>
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
								{(() => {
									let value = item.defaultPrice * item.defaultQuantity;
									if (item.roundingMethod !== 'none') {
										const multiplier = Math.pow(10, item.roundingDecimalPlaces);
										if (item.roundingMethod === 'round') {
											return Math.round(value * multiplier) / multiplier;
										} else if (item.roundingMethod === 'floor') {
											return Math.floor(value * multiplier) / multiplier;
										} else if (item.roundingMethod === 'ceil') {
											return Math.ceil(value * multiplier) / multiplier;
										}
									}
									return value;
								})()}
							{:else if item.calculationMethod === 'custom'}
								{(() => {
									let value = parseFormula(item.customFormula, options);
									if (typeof value === 'number' && item.roundingMethod !== 'none') {
										const multiplier = Math.pow(10, item.roundingDecimalPlaces);
										if (item.roundingMethod === 'round') {
											return Math.round(value * multiplier) / multiplier;
										} else if (item.roundingMethod === 'floor') {
											return Math.floor(value * multiplier) / multiplier;
										} else if (item.roundingMethod === 'ceil') {
											return Math.ceil(value * multiplier) / multiplier;
										}
									}
									return value;
								})()}
							{:else if item.calculationMethod === 'range'}
								{(() => {
									let value = parseRange(item.customFormula, options, item.rangeTable);
									if (typeof value === 'number' && item.roundingMethod !== 'none') {
										const multiplier = Math.pow(10, item.roundingDecimalPlaces);
										if (item.roundingMethod === 'round') {
											return Math.round(value * multiplier) / multiplier;
										} else if (item.roundingMethod === 'floor') {
											return Math.floor(value * multiplier) / multiplier;
										} else if (item.roundingMethod === 'ceil') {
											return Math.ceil(value * multiplier) / multiplier;
										}
									}
									return value;
								})()}
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
							let hasError = false;

							options.forEach((item) => {
								let itemValue;

								if (item.calculationMethod === 'default') {
									itemValue = item.defaultPrice * item.defaultQuantity;
								} else if (item.calculationMethod === 'custom') {
									itemValue = parseFormula(item.customFormula, options);
									if (Number.isNaN(itemValue) || itemValue === 'ERROR') {
										hasError = true;
										return;
									}
								} else if (item.calculationMethod === 'range') {
									itemValue = parseRange(item.customFormula, options, item.rangeTable);
									if (Number.isNaN(itemValue) || itemValue === 'ERROR') {
										hasError = true;
										return;
									}
									// cuz rangeTable.input and rangeTable.output are both string arrays due to input
									if (typeof itemValue === 'string') {
										itemValue = parseInt(itemValue);
									}
								}

								// Apply rounding if configured
								if (typeof itemValue === 'number') {
									if (item.roundingMethod !== 'none') {
										const multiplier = Math.pow(10, item.roundingDecimalPlaces);
										if (item.roundingMethod === 'round') {
											itemValue = Math.round(itemValue * multiplier) / multiplier;
										} else if (item.roundingMethod === 'floor') {
											itemValue = Math.floor(itemValue * multiplier) / multiplier;
										} else if (item.roundingMethod === 'ceil') {
											itemValue = Math.ceil(itemValue * multiplier) / multiplier;
										}
									}
									total += itemValue;
								}
							});

							return hasError ? 'ERROR' : total;
						})()}
					</Table.Cell>
					<Table.Cell></Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
	</div>
{/if}

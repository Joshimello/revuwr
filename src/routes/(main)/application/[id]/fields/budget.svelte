<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
	import { onMount } from 'svelte';

	export let question: QuestionsResponse;
	let options = question.options as {
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
		explaination: string;
		comment: string;
		minFinalTotal: number;
		maxFinalTotal: number;
	}[];

	export let disabled = false;
	export let value: typeof options | null = null;

	export const checkValid = () => {
		if (value == null || disabled) {
			return [false, ''];
		}

		// Check for calculation errors
		let hasError = false;
		for (let i = 0; i < options.length; i++) {
			const itemValue = calculateItemValue(i);
			if (itemValue === 'ERROR') {
				hasError = true;
				break;
			}

			// Check row-specific total limits
			const item = options[i];
			if (item.isLimitTotal && typeof itemValue === 'number') {
				if (itemValue < item.minTotal || itemValue > item.maxTotal) {
					return [false, `項目 "${item.name}" 總價超出範圍 ${item.minTotal} -> ${item.maxTotal}`];
				}
			}

			// Check required explanations
			if (item.requestExplaination && typeof itemValue === 'number' && itemValue > 0) {
				if (!item.explaination || item.explaination.trim() === '') {
					return [false, `項目 "${item.name}" 需要填寫用途説明`];
				}
			}
		}

		if (hasError) {
			return [false, '計算錯誤'];
		}

		const total = calculateTotal();
		if (total === 'ERROR') {
			return [false, '計算錯誤'];
		}

		// Check if total is zero
		if (total === 0) {
			return [false, '總價不能為零'];
		}

		if (total < options[0].minFinalTotal || total > options[0].maxFinalTotal) {
			return [false, `總價超出範圍 ${options[0].minFinalTotal} -> ${options[0].maxFinalTotal}`];
		}
		if (
			options.some((item, index) => {
				if (!value) {
					return false;
				}
				if (
					item.isLimitPrice &&
					(value[index].defaultPrice < item.minPrice || value[index].defaultPrice > item.maxPrice)
				) {
					return true;
				}
				if (
					item.isLimitQuantity &&
					(value[index].defaultQuantity < item.minQuantity ||
						value[index].defaultQuantity > item.maxQuantity)
				) {
					return true;
				}
				return false;
			})
		) {
			return [false, '數值超出範圍'];
		}

		return [true, ''];
	};

	let init = false;

	onMount(() => {
		if (!value) {
			value = [...options];
		} else {
			// Don't overwrite options with value - keep the original question data
			// Just sync the user input values
			if (Array.isArray(value)) {
				value.forEach((valueItem, index) => {
					if (options[index]) {
						options[index].defaultPrice = valueItem.defaultPrice;
						options[index].defaultQuantity = valueItem.defaultQuantity;
						options[index].explaination = valueItem.explaination;
					}
				});
			}
		}
		init = true;
	});

	$: if (options && init) {
		value = [...options];
	}

	// Force reactivity for calculations
	$: reactiveOptions = options;

	const parseFormula = (formula: string, data: typeof options) => {
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
		data: typeof options,
		range: { input: number[]; output: number[] }
	) => {
		const parsedFormula = parseFormula(formula, data);
		const value = range.output[range.input.findLastIndex((value, index) => parsedFormula >= value)];
		if (isNaN(value)) {
			return 'ERROR';
		}
		return value;
	};

	const calculateItemValue = (itemIndex: number) => {
		const item = options[itemIndex];
		let itemValue;

		if (item.calculationMethod === 'default') {
			itemValue = Number(item.defaultPrice || 0) * Number(item.defaultQuantity || 0);
		} else if (item.calculationMethod === 'custom') {
			itemValue = parseFormula(item.customFormula, options);
			if (Number.isNaN(itemValue) || itemValue === 'ERROR') {
				return 'ERROR';
			}
		} else if (item.calculationMethod === 'range') {
			itemValue = parseRange(item.customFormula, options, item.rangeTable);
			if (Number.isNaN(itemValue) || itemValue === 'ERROR') {
				return 'ERROR';
			}
			// cuz rangeTable.input and rangeTable.output are both string arrays due to input
			if (typeof itemValue === 'string') {
				itemValue = parseInt(itemValue);
			}
		}

		// Apply rounding if configured
		if (typeof itemValue === 'number' && item.roundingMethod && item.roundingMethod !== 'none') {
			const multiplier = Math.pow(10, item.roundingDecimalPlaces || 0);
			if (item.roundingMethod === 'round') {
				itemValue = Math.round(itemValue * multiplier) / multiplier;
			} else if (item.roundingMethod === 'floor') {
				itemValue = Math.floor(itemValue * multiplier) / multiplier;
			} else if (item.roundingMethod === 'ceil') {
				itemValue = Math.ceil(itemValue * multiplier) / multiplier;
			}
		}

		return itemValue;
	};

	const calculateTotal = () => {
		let total = 0;
		let hasError = false;

		for (let i = 0; i < options.length; i++) {
			const itemValue = calculateItemValue(i);
			if (itemValue === 'ERROR') {
				hasError = true;
				break;
			}
			total += itemValue;
		}

		if (hasError) {
			return 'ERROR';
		}

		return total;
	};
</script>

<div class="flex w-full flex-col">
	<div class="w-full rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-min"></Table.Head>
					<Table.Head class="text-nowrap">經費項目</Table.Head>
					<Table.Head class="text-nowrap">單價（元）</Table.Head>
					<Table.Head class="text-nowrap">數量</Table.Head>
					<Table.Head class="text-nowrap">總價（元）</Table.Head>
					<Table.Head class="text-nowrap">用途與編列基準說明</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each Array.isArray(options) ? options : [] as item, index}
					<Table.Row>
						<Table.Cell class="align-top">{index + 1}.</Table.Cell>
						<Table.Cell class="text-nowrap align-top">{item.name}</Table.Cell>
						<Table.Cell class="w-32 align-top">
							{#if item.isConstantPrice}
								<Input type="number" value={item.defaultPrice} disabled min="0" />
							{:else}
								<Input
									type="number"
									bind:value={item.defaultPrice}
									{disabled}
									on:input={() => {
										// Force number conversion
										item.defaultPrice = Number(item.defaultPrice) || 0;
										// Trigger reactivity
										options = [...options];
									}}
									{...item.isLimitPrice
										? {
												min: item.minPrice,
												max: item.maxPrice
											}
										: {
												min: 0
											}}
								/>
							{/if}
							{#if item.isLimitPrice}
								<span class="text-xs text-muted-foreground">
									{item.minPrice} -> {item.maxPrice}
								</span>
							{/if}
						</Table.Cell>
						<Table.Cell class="w-32 align-top">
							{#if item.isConstantQuantity}
								<Input type="number" value={item.defaultQuantity} disabled min="0" />
							{:else}
								<Input
									type="number"
									bind:value={item.defaultQuantity}
									{disabled}
									on:input={() => {
										// Force number conversion
										item.defaultQuantity = Number(item.defaultQuantity) || 0;
										// Trigger reactivity
										options = [...options];
									}}
									{...item.isLimitQuantity
										? {
												min: item.minQuantity,
												max: item.maxQuantity
											}
										: {
												min: 0
											}}
								/>
							{/if}
							{#if item.isLimitQuantity}
								<span class="text-xs text-muted-foreground">
									{item.minQuantity} -> {item.maxQuantity}
								</span>
							{/if}
						</Table.Cell>
						<Table.Cell class="w-48 align-top">
							{#key options}
								{#if item.calculationMethod === 'default'}
									{(() => {
										let value = Number(item.defaultPrice || 0) * Number(item.defaultQuantity || 0);
										if (item.roundingMethod && item.roundingMethod !== 'none') {
											const multiplier = Math.pow(10, item.roundingDecimalPlaces || 0);
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
										if (
											typeof value === 'number' &&
											item.roundingMethod &&
											item.roundingMethod !== 'none'
										) {
											const multiplier = Math.pow(10, item.roundingDecimalPlaces || 0);
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
										if (
											typeof value === 'number' &&
											item.roundingMethod &&
											item.roundingMethod !== 'none'
										) {
											const multiplier = Math.pow(10, item.roundingDecimalPlaces || 0);
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
							{/key}
							{#if item.isLimitTotal}
								{@const itemValue = calculateItemValue(index)}
								<br />
								<span
									class={`text-xs ${typeof itemValue === 'number' && itemValue >= item.minTotal && itemValue <= item.maxTotal ? 'text-muted-foreground' : 'text-destructive'}`}
								>
									{item.minTotal} -> {item.maxTotal}
								</span>
							{/if}
						</Table.Cell>
						<Table.Cell class="w-96 align-top">
							{@html item.description}
							{#if item.requestExplaination}
								<Textarea
									class="mt-2"
									placeholder="請填寫用途説明"
									bind:value={item.explaination}
									{disabled}
									on:input={() => {
										// Trigger reactivity for validation
										options = [...options];
									}}
								/>
							{/if}
							{#if item.comment}
								<div class="mt-2 text-xs text-destructive">{item.comment}</div>
							{/if}
						</Table.Cell>
					</Table.Row>
				{/each}
				<Table.Row>
					<Table.Cell></Table.Cell>
					<Table.Cell class="font-semibold">總價</Table.Cell>
					<Table.Cell></Table.Cell>
					<Table.Cell></Table.Cell>
					<Table.Cell class="font-semibold">
						{#key reactiveOptions}
							{calculateTotal()}
						{/key}
					</Table.Cell>
					<Table.Cell>
						{#key reactiveOptions}
							{#if options && options[0]}
								{@const total = calculateTotal()}
								{#if total === 'ERROR'}
									<span class="text-xs text-destructive">計算錯誤</span>
								{:else if total < options[0].minFinalTotal || total > options[0].maxFinalTotal}
									<span class="text-xs text-destructive">
										總價超出範圍 {options[0].minFinalTotal} -> {options[0].maxFinalTotal}
									</span>
								{/if}
							{/if}
						{/key}
					</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
	</div>
</div>

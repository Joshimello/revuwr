<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

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
		const total = calculateTotal();
		if (total === 'ERROR') {
			return [false, '計算錯誤'];
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
			if (Array.isArray(value)) {
				options = [...value];
			} else if (typeof value === 'object') {
				options = Object.values(value);
			} else {
				toast.error('Invalid options');
			}
		}
		init = true;
	});

	$: if (options && init) {
		value = [...options];
		console.log(value[0].defaultQuantity);
	}

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

	const calculateTotal = () => {
		let total = 0;
		for (let i = 0; i < options.length; i++) {
			const item = options[i];
			let itemValue;

			if (item.calculationMethod === 'default') {
				itemValue = item.defaultPrice * item.defaultQuantity;
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

			total += itemValue;
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
				{#each options as item, index}
					<Table.Row>
						<Table.Cell class="align-top">{index + 1}.</Table.Cell>
						<Table.Cell class="text-nowrap align-top">{item.name}</Table.Cell>
						<Table.Cell class="w-32 align-top">
							{#if item.isConstantPrice}
								<Input type="number" value={item.defaultPrice} disabled />
							{:else}
								<Input
									type="number"
									value={item.defaultPrice}
									on:input={(e) => {
										// @ts-expect-error svelte 4 no inline types
										item.defaultPrice = parseInt(e.target.value);
									}}
									{...item.isLimitPrice
										? {
												min: item.minPrice,
												max: item.maxPrice
											}
										: {}}
								/>
								{#if item.isLimitPrice}
									{@const isValid =
										item.defaultPrice >= item.minPrice && item.defaultPrice <= item.maxPrice}
									<span class={`text-xs ${isValid ? 'text-muted-foreground' : 'text-destructive'}`}>
										{item.minPrice} -> {item.maxPrice}</span
									>
								{/if}
							{/if}
						</Table.Cell>
						<Table.Cell class="w-32 align-top">
							{#if item.isConstantQuantity}
								<Input type="number" value={item.defaultQuantity} disabled />
							{:else}
								<Input
									value={item.defaultQuantity}
									type="number"
									on:input={(e) => {
										// @ts-expect-error svelte 4 no inline types
										item.defaultQuantity = parseInt(e.target.value);
									}}
									{...item.isLimitQuantity
										? {
												min: item.minQuantity,
												max: item.maxQuantity
											}
										: {}}
								/>
								{#if item.isLimitQuantity}
									{@const isValid =
										item.defaultQuantity >= item.minQuantity &&
										item.defaultQuantity <= item.maxQuantity}
									<span class={`text-xs ${isValid ? 'text-muted-foreground' : 'text-destructive'}`}>
										{item.minQuantity} -> {item.maxQuantity}</span
									>
								{/if}
							{/if}
						</Table.Cell>
						<Table.Cell class="w-48 align-top">
							{#if item.calculationMethod === 'default'}
								{(() => {
									let value = item.defaultPrice * item.defaultQuantity;
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
						</Table.Cell>
						<Table.Cell class="w-96 align-top">
							{@html item.description}
							{#if item.requestExplaination}
								<Textarea
									class="mt-2"
									placeholder="請填寫用途説明"
									bind:value={item.explaination}
								/>
							{/if}
							{#if item.comment}
								<span class="text-destructive">{item.comment}</span>
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
						{#key options}
							{calculateTotal()}
						{/key}
					</Table.Cell>
					<Table.Cell>
						{#key options}
							{#if options}
								{@const total = calculateTotal()}
								{#if total === 'ERROR'}
									<span class="text-destructive">計算錯誤</span>
								{:else if total < options[0].minFinalTotal || total > options[0].maxFinalTotal}
									<span class="text-destructive"
										>總價超出範圍
										{options[0].minFinalTotal} -> {options[0].maxFinalTotal}
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

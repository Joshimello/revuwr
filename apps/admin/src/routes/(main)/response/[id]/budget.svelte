<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
	import { onMount } from 'svelte';

	export let question: QuestionsResponse;
	const schema = question.options as {
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

	export let value: typeof schema = [];
	console.log(value);

	onMount(() => {
		if (value.length === 0) {
			value = schema.map((item) => ({ ...item }));
		}
	});

	export const outValue = value;

	// $: if (schema) {
	// 	value = schema.map((item) => ({ ...item }));
	// 	console.log(value[0].defaultQuantity);
	// }

	const parseFormula = (formula: string, data: typeof schema) => {
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
		data: typeof schema,
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
		for (let i = 0; i < value.length; i++) {
			const item = value[i];
			let itemValue;

			if (item.calculationMethod === 'default') {
				itemValue = item.defaultPrice * item.defaultQuantity;
			} else if (item.calculationMethod === 'custom') {
				itemValue = parseFormula(item.customFormula, value);
				if (Number.isNaN(itemValue) || itemValue === 'ERROR') {
					return 'ERROR';
				}
			} else if (item.calculationMethod === 'range') {
				itemValue = parseRange(item.customFormula, value, item.rangeTable);
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
					<Table.Head>經費項目</Table.Head>
					<Table.Head>單價（元）</Table.Head>
					<Table.Head>數量</Table.Head>
					<Table.Head>總價（元）</Table.Head>
					<Table.Head>修改說明</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each value as item, index}
					<Table.Row>
						<Table.Cell>{index + 1}.</Table.Cell>
						<Table.Cell>{item.name}</Table.Cell>

						<Table.Cell>
							{#if item.isConstantPrice}
								<Input type="number" value={item.defaultPrice} disabled />
							{:else}
								<!-- two‐way bind straight to value[index].defaultPrice -->
								<Input
									type="number"
									bind:value={item.defaultPrice}
									min={item.isLimitPrice ? item.minPrice : undefined}
									max={item.isLimitPrice ? item.maxPrice : undefined}
								/>
								{#if item.isLimitPrice}
									<small
										class={item.defaultPrice < item.minPrice || item.defaultPrice > item.maxPrice
											? 'text-destructive'
											: 'text-muted-foreground'}
									>
										{item.minPrice} → {item.maxPrice}
									</small>
								{/if}
							{/if}
						</Table.Cell>

						<Table.Cell>
							{#if item.isConstantQuantity}
								<Input type="number" value={item.defaultQuantity} disabled />
							{:else}
								<Input
									type="number"
									bind:value={item.defaultQuantity}
									min={item.isLimitQuantity ? item.minQuantity : undefined}
									max={item.isLimitQuantity ? item.maxQuantity : undefined}
								/>
								{#if item.isLimitQuantity}
									<small
										class={item.defaultQuantity < item.minQuantity ||
										item.defaultQuantity > item.maxQuantity
											? 'text-destructive'
											: 'text-muted-foreground'}
									>
										{item.minQuantity} → {item.maxQuantity}
									</small>
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
									let _value = parseFormula(item.customFormula, value);
									if (
										typeof _value === 'number' &&
										item.roundingMethod &&
										item.roundingMethod !== 'none'
									) {
										const multiplier = Math.pow(10, item.roundingDecimalPlaces || 0);
										if (item.roundingMethod === 'round') {
											return Math.round(_value * multiplier) / multiplier;
										} else if (item.roundingMethod === 'floor') {
											return Math.floor(_value * multiplier) / multiplier;
										} else if (item.roundingMethod === 'ceil') {
											return Math.ceil(_value * multiplier) / multiplier;
										}
									}
									return _value;
								})()}
							{:else if item.calculationMethod === 'range'}
								{(() => {
									let _value = parseRange(item.customFormula, value, item.rangeTable);
									if (
										typeof _value === 'number' &&
										item.roundingMethod &&
										item.roundingMethod !== 'none'
									) {
										const multiplier = Math.pow(10, item.roundingDecimalPlaces || 0);
										if (item.roundingMethod === 'round') {
											return Math.round(_value * multiplier) / multiplier;
										} else if (item.roundingMethod === 'floor') {
											return Math.floor(_value * multiplier) / multiplier;
										} else if (item.roundingMethod === 'ceil') {
											return Math.ceil(_value * multiplier) / multiplier;
										}
									}
									return _value;
								})()}
							{/if}
						</Table.Cell>
						<Table.Cell class="w-96 align-top">
							<Textarea class="mt-2" placeholder="" bind:value={item.explaination} disabled />
							<Textarea class="mt-2" placeholder="修改說明" bind:value={item.comment} />
						</Table.Cell>
					</Table.Row>
				{/each}
				<Table.Row>
					<Table.Cell></Table.Cell>
					<Table.Cell>總價</Table.Cell>
					<Table.Cell></Table.Cell>
					<Table.Cell></Table.Cell>
					<Table.Cell>
						{#key value}
							{calculateTotal()}
						{/key}
					</Table.Cell>
					<Table.Cell>
						{#key value}
							{#if value}
								{@const total = calculateTotal()}
								{#if total === 'ERROR'}
									<span class="text-destructive">計算錯誤</span>
								{:else if total < value[0].minFinalTotal || total > value[0].maxFinalTotal}
									<span class="text-destructive"
										>總價超出範圍
										{value[0].minFinalTotal} -> {value[0].maxFinalTotal}
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

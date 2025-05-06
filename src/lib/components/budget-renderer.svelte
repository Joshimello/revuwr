<script lang="ts">
	import * as Table from '$lib/components/ui/table';

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
		roundingMethod?: 'none' | 'round' | 'floor' | 'ceil';
		roundingDecimalPlaces?: number;
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

	export let data: Record<number, Option>;
	const arrayData = Object.values(data);

	const parseFormula = (formula: string, data: Option[]) => {
		let processedFormula = formula.replace(/\{(\d+)([PQT])\}/g, (match, index, type) => {
			const arrayIndex = parseInt(index) - 1;
			if (arrayIndex < 0 || arrayIndex >= arrayData.length) return '0';

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
		arrayData: Option[],
		range: { input: number[]; output: number[] }
	) => {
		const parsedFormula = parseFormula(formula, arrayData);
		const value = range.output[range.input.findLastIndex((value, index) => parsedFormula >= value)];
		if (isNaN(value)) {
			return 'ERROR';
		}
		return value;
	};

	const calculateTotal = () => {
		let total = 0;
		for (let i = 0; i < arrayData.length; i++) {
			const item = arrayData[i];
			let itemValue;
			
			if (item.calculationMethod === 'default') {
				itemValue = item.defaultPrice * item.defaultQuantity;
			} else if (item.calculationMethod === 'custom') {
				itemValue = parseFormula(item.customFormula, arrayData);
				if (Number.isNaN(itemValue) || itemValue === 'ERROR') {
					return 'ERROR';
				}
			} else if (item.calculationMethod === 'range') {
				itemValue = parseRange(item.customFormula, arrayData, item.rangeTable);
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

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Item</Table.Head>
			<Table.Head>Price</Table.Head>
			<Table.Head>Quantity</Table.Head>
			<Table.Head>Total</Table.Head>
			<Table.Head>Explaination</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each Object.entries(data) as [index, option]}
			<Table.Row>
				<Table.Cell>{option.name}</Table.Cell>
				<Table.Cell>{option.defaultPrice}</Table.Cell>
				<Table.Cell>{option.defaultQuantity}</Table.Cell>
				<Table.Cell>
				{#if option.calculationMethod === 'default'}
					{(() => {
						let value = option.defaultPrice * option.defaultQuantity;
						if (option.roundingMethod && option.roundingMethod !== 'none') {
							const multiplier = Math.pow(10, option.roundingDecimalPlaces || 0);
							if (option.roundingMethod === 'round') {
								return Math.round(value * multiplier) / multiplier;
							} else if (option.roundingMethod === 'floor') {
								return Math.floor(value * multiplier) / multiplier;
							} else if (option.roundingMethod === 'ceil') {
								return Math.ceil(value * multiplier) / multiplier;
							}
						}
						return value;
					})()}
				{:else if option.calculationMethod === 'custom'}
					{(() => {
						let value = parseFormula(option.customFormula, arrayData);
						if (typeof value === 'number' && option.roundingMethod && option.roundingMethod !== 'none') {
							const multiplier = Math.pow(10, option.roundingDecimalPlaces || 0);
							if (option.roundingMethod === 'round') {
								return Math.round(value * multiplier) / multiplier;
							} else if (option.roundingMethod === 'floor') {
								return Math.floor(value * multiplier) / multiplier;
							} else if (option.roundingMethod === 'ceil') {
								return Math.ceil(value * multiplier) / multiplier;
							}
						}
						return value;
					})()}
				{:else if option.calculationMethod === 'range'}
					{(() => {
						let value = parseRange(option.customFormula, arrayData, option.rangeTable);
						if (typeof value === 'number' && option.roundingMethod && option.roundingMethod !== 'none') {
							const multiplier = Math.pow(10, option.roundingDecimalPlaces || 0);
							if (option.roundingMethod === 'round') {
								return Math.round(value * multiplier) / multiplier;
							} else if (option.roundingMethod === 'floor') {
								return Math.floor(value * multiplier) / multiplier;
							} else if (option.roundingMethod === 'ceil') {
								return Math.ceil(value * multiplier) / multiplier;
							}
						}
						return value;
					})()}
				{:else}
					ERROR
				{/if}
				</Table.Cell>
				<Table.Cell></Table.Cell>
			</Table.Row>
		{/each}
		<Table.Row>
			<Table.Cell>Total</Table.Cell>
			<Table.Cell></Table.Cell>
			<Table.Cell></Table.Cell>
			<Table.Cell>{calculateTotal()}</Table.Cell>
		</Table.Row>
	</Table.Body>
</Table.Root>

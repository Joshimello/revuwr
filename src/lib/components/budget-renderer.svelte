<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import { getResponseRepresentation, type ExpandedAnswer } from '$lib/response-repr';

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
		explaination: string;
		minFinalTotal: number;
		maxFinalTotal: number;
	};

	export let data: Record<number, Option>;
	export let headless: boolean = false;
	export let repr: string = '';

	// Convert to array for easier processing
	$: arrayData = data ? (Array.isArray(data) ? data : Object.values(data)) : [];

	// Calculate total for headless mode using utility function
	$: if (headless) {
		// Create mock data structure to match ExpandedAnswer format expected by utility
		const mockData = {
			response: data,
			expand: {
				question: { type: 'budget' }
			},
			// Add required fields to satisfy ExpandedAnswer type
			application: '',
			comment: '',
			created: '',
			id: '',
			question: '',
			updated: ''
		} as ExpandedAnswer;
		repr = getResponseRepresentation(mockData);
	}

	const parseFormula = (formula: string, data: Option[]) => {
		let processedFormula = formula.replace(/\{(\d+)([PQT])\}/g, (match, index, type) => {
			const arrayIndex = parseInt(index) - 1;
			if (arrayIndex < 0 || arrayIndex >= data.length) return '0';

			const item = data[arrayIndex];
			if (type === 'P') {
				return (item.defaultPrice || 0).toString();
			} else if (type === 'Q') {
				return (item.defaultQuantity || 0).toString();
			} else if (type === 'T') {
				return ((item.defaultPrice || 0) * (item.defaultQuantity || 0)).toString();
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
			console.log(error);
			return 'ERROR';
		}
	};

	const parseRange = (
		formula: string,
		data: Option[],
		range: { input: number[]; output: number[] }
	) => {
		const parsedFormula = parseFormula(formula, data);
		if (parsedFormula === 'ERROR') return 'ERROR';

		const value = range.output[range.input.findLastIndex((value) => parsedFormula >= value)];
		if (isNaN(value)) {
			return 'ERROR';
		}
		return value;
	};

	const calculateItemValue = (item: Option) => {
		let itemValue;

		if (item.calculationMethod === 'default') {
			itemValue = Number(item.defaultPrice || 0) * Number(item.defaultQuantity || 0);
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
			// Handle string values from range table
			if (typeof itemValue === 'string') {
				itemValue = parseFloat(itemValue);
			}
		} else {
			return 'ERROR';
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

		arrayData.forEach((item) => {
			const itemValue = calculateItemValue(item);

			if (itemValue === 'ERROR' || Number.isNaN(itemValue)) {
				hasError = true;
				return;
			}

			if (typeof itemValue === 'number') {
				total += itemValue;
			}
		});

		return hasError ? 'ERROR' : total;
	};
</script>

{#if !headless}
	{#if arrayData.length > 0}
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-min">#</Table.Head>
					<Table.Head>Item</Table.Head>
					<Table.Head>Price</Table.Head>
					<Table.Head>Quantity</Table.Head>
					<Table.Head>Total</Table.Head>
					<Table.Head class="w-96">Description</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each arrayData as item, index}
					<Table.Row>
						<Table.Cell class="font-mono text-sm">{index + 1}</Table.Cell>
						<Table.Cell class="text-nowrap">{item.name}</Table.Cell>
						<Table.Cell class="w-32">
							{Number(item.defaultPrice || 0)}
							{#if item.isLimitPrice}
								<span class="text-xs text-muted-foreground">
									({item.minPrice}-{item.maxPrice})
								</span>
							{/if}
						</Table.Cell>
						<Table.Cell class="w-32">
							{Number(item.defaultQuantity || 0)}
							{#if item.isLimitQuantity}
								<span class="text-xs text-muted-foreground">
									({item.minQuantity}-{item.maxQuantity})
								</span>
							{/if}
						</Table.Cell>
						<Table.Cell class="w-48">
							{#key arrayData}
								{calculateItemValue(item)}
							{/key}
							{#if item.calculationMethod !== 'default'}
								<span class="block text-xs text-muted-foreground">
									{item.calculationMethod}
								</span>
							{/if}
							{#if item.isLimitTotal}
								<span class="block text-xs text-muted-foreground">
									Limit: {item.minTotal}-{item.maxTotal}
								</span>
							{/if}
						</Table.Cell>
						<Table.Cell class="w-96">
							{#if item.description}
								<div class="text-xs text-muted-foreground">
									<!-- eslint-disable-next-line -->
									{@html item.description}
								</div>
							{/if}
							{#if item.requestExplaination && item.explaination}
								<div class="mt-2">
									{item.explaination}
								</div>
							{/if}
						</Table.Cell>
					</Table.Row>
				{/each}
				<Table.Row class="font-semibold">
					<Table.Cell></Table.Cell>
					<Table.Cell>總價 (Total)</Table.Cell>
					<Table.Cell></Table.Cell>
					<Table.Cell></Table.Cell>
					<Table.Cell>
						{#key arrayData}
							{calculateTotal()}
						{/key}
					</Table.Cell>
					<Table.Cell></Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
	{:else}
		<div class="rounded-md border p-8 text-center text-muted-foreground">
			<p>No budget items to display</p>
		</div>
	{/if}
{/if}

import type { AnswersResponse, QuestionsResponse } from './pocketbase/pocketbase-types';

export type ExpandedAnswer = AnswersResponse<
	unknown,
	{
		question: QuestionsResponse<unknown>;
	}
>;

/**
 * Get string representation of a response for CSV export or other text-based formats
 */
export function getResponseRepresentation(data: ExpandedAnswer | null | undefined): string {
	if (!data) return '';

	const response = data.response;
	const question = data.expand?.question;

	if (!question || response === null || response === undefined) {
		return '';
	}

	switch (question.type) {
		case 'shortText':
		case 'longText':
		case 'email':
		case 'phone':
			return String(response || '');

		case 'radio':
			if (
				question.options &&
				typeof question.options === 'object' &&
				question.options !== null &&
				'choices' in question.options &&
				Array.isArray(question.options.choices) &&
				typeof response === 'object' &&
				response !== null &&
				'selected' in response &&
				'others' in response
			) {
				const respObj = response as { selected: number; others?: string };
				if (respObj.selected === question.options.choices.length) {
					// "Others" option selected
					return respObj.others || '';
				} else if (typeof respObj.selected === 'number') {
					// Regular choice selected
					return question.options.choices[respObj.selected] || '';
				}
			}
			return '';

		case 'checkbox':
			if (
				question.options &&
				typeof question.options === 'object' &&
				question.options !== null &&
				'choices' in question.options &&
				Array.isArray(question.options.choices) &&
				typeof response === 'object' &&
				response !== null &&
				'selected' in response &&
				'others' in response
			) {
				const respObj = response as { selected: number[]; others?: string };
				if (Array.isArray(respObj.selected)) {
					const selectedTexts = respObj.selected
						.map((selected: number) => {
							const opts = question.options as { choices: string[] };
							return [...opts.choices, respObj.others || ''][selected] || '';
						})
						.filter(Boolean);
					return selectedTexts.join(', ');
				}
			}
			return '';

		case 'file':
			if (Array.isArray(response)) {
				const fileNames = response.flatMap((item: { files?: string[] }) => item.files || []);
				return fileNames.join(', ');
			}
			return '';

		case 'member':
			// For CSV: pipe-separated IDs to avoid CSV delimiter conflicts
			if (Array.isArray(response)) {
				const ids = response
					.map((row: { username?: string; id?: string }) => row.username || row.id || '')
					.filter(Boolean);
				return ids.join('|');
			}
			return '';

		case 'activity':
			// For CSV: count of activities
			if (Array.isArray(response)) {
				return response.length.toString();
			}
			return '0';

		case 'budget':
			// For CSV: calculated total
			return calculateBudgetTotal(response);

		default:
			// Fallback for unknown types
			return typeof response === 'object'
				? JSON.stringify(response).replace(/,/g, '|')
				: String(response || '');
	}
}

/**
 * Calculate budget total from budget response data
 */
function calculateBudgetTotal(data: unknown): string {
	if (!data) return '0';

	const arrayData = Array.isArray(data) ? data : Object.values(data);
	if (!Array.isArray(arrayData) || arrayData.length === 0) return '0';

	let total = 0;
	let hasError = false;

	arrayData.forEach(
		(item: {
			calculationMethod?: string;
			defaultPrice?: number;
			defaultQuantity?: number;
			customFormula?: string;
			rangeTable?: { input: number[]; output: number[] };
			roundingMethod?: string;
			roundingDecimalPlaces?: number;
		}) => {
			let itemValue = 0;

			if (item.calculationMethod === 'default' || !item.calculationMethod) {
				// Simple price * quantity calculation
				itemValue = Number(item.defaultPrice || 0) * Number(item.defaultQuantity || 0);
			} else if (item.calculationMethod === 'custom') {
				// For complex calculations, try to parse the formula
				itemValue = parseCustomFormula(item.customFormula || '', arrayData);
			} else if (item.calculationMethod === 'range') {
				// Range table calculation
				itemValue = parseRangeCalculation(
					item.customFormula || '',
					arrayData,
					item.rangeTable || { input: [], output: [] }
				);
			} else {
				// Fallback to default calculation
				itemValue = Number(item.defaultPrice || 0) * Number(item.defaultQuantity || 0);
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

			if (!isNaN(itemValue) && isFinite(itemValue)) {
				total += itemValue;
			} else {
				hasError = true;
			}
		}
	);

	return hasError ? 'ERROR' : total.toString();
}

/**
 * Parse custom formula for budget calculations
 */
function parseCustomFormula(
	formula: string,
	data: { defaultPrice?: number; defaultQuantity?: number }[]
): number {
	if (!formula) return 0;

	const processedFormula = formula.replace(/\{(\d+)([PQT])\}/g, (match, index, type) => {
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
		return isNaN(value) ? 0 : Number(value);
	} catch (error) {
		console.warn('Error parsing custom formula:', formula, error);
		return 0;
	}
}

/**
 * Parse range table calculation for budget
 */
function parseRangeCalculation(
	formula: string,
	data: { defaultPrice?: number; defaultQuantity?: number }[],
	rangeTable: { input: number[]; output: number[] }
): number {
	if (!rangeTable || !rangeTable.input || !rangeTable.output) return 0;

	const parsedFormula = parseCustomFormula(formula, data);
	if (isNaN(parsedFormula)) return 0;

	const index = rangeTable.input.findLastIndex((value: number) => parsedFormula >= value);
	const value = rangeTable.output[index];
	return isNaN(value) ? 0 : Number(value);
}

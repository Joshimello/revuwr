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
			// For email: CSV format with member details
			// Example output:
			// "Name","Username","Email","Phone","Department","Country"
			// "John Smith","jsmith","john@example.com","09123456789","Computer Science","Taiwan"
			if (Array.isArray(response)) {
				const memberRows = response
					.map(
						(row: {
							name?: string;
							username?: string;
							email?: string;
							phone?: string;
							department?: string;
							country?: string;
						}) => {
							const name = row.name || '';
							const username = row.username || '';
							const email = row.email || '';
							const phone = row.phone || '';
							const department = row.department || '';
							const country = row.country || '';
							return `"${name}","${username}","${email}","${phone}","${department}","${country}"`;
						}
					)
					.filter(Boolean);

				if (memberRows.length === 0) return '';

				const header = '"Name","Username","Email","Phone","Department","Country"';
				return [header, ...memberRows].join('\n');
			}
			return '';

		case 'activity':
			// For email: CSV format with activity details
			// Example output:
			// "Date","Time","Topic","Format","Location","Notes"
			// "Jan 15, 2024","09:00 - 17:00","Workshop on AI","physical","Room 101","Bring laptop"
			if (Array.isArray(response)) {
				const activityRows = response
					.map(
						(row: {
							date?: string;
							startTime?: string;
							endTime?: string;
							topic?: string;
							form?: string;
							location?: string;
							note?: string;
						}) => {
							const date = row.date
								? new Date(row.date).toLocaleDateString('en-US', {
										year: 'numeric',
										month: 'short',
										day: 'numeric'
									})
								: '';
							const timeRange =
								row.startTime && row.endTime ? `${row.startTime} - ${row.endTime}` : '';
							const topic = row.topic || '';
							const form = row.form || '';
							const location = row.location || '';
							const note = row.note || '';
							return `"${date}","${timeRange}","${topic}","${form}","${location}","${note}"`;
						}
					)
					.filter(Boolean);

				if (activityRows.length === 0) return '';

				const header = '"Date","Time","Topic","Format","Location","Notes"';
				return [header, ...activityRows].join('\n');
			}
			return '';

		case 'budget':
			// For email: CSV format with budget breakdown
			// Example output:
			// "Item","Price","Quantity","Total"
			// "Conference Room","100","2","200"
			// "Equipment Rental","50","3","150"
			// "Grand Total","","","350"
			return calculateBudgetCSV(response);

		default:
			// Fallback for unknown types
			return typeof response === 'object'
				? JSON.stringify(response).replace(/,/g, '|')
				: String(response || '');
	}
}

/**
 * Calculate budget CSV from budget response data
 */
export function calculateBudgetCSV(data: unknown): string {
	if (!data) return '';

	const arrayData = Array.isArray(data) ? data : Object.values(data);
	if (!Array.isArray(arrayData) || arrayData.length === 0) return '';

	const budgetRows: string[] = [];
	let grandTotal = 0;

	arrayData.forEach(
		(
			item: {
				name?: string;
				calculationMethod?: string;
				defaultPrice?: number;
				defaultQuantity?: number;
				customFormula?: string;
				rangeTable?: { input: number[]; output: number[] };
				roundingMethod?: string;
				roundingDecimalPlaces?: number;
			},
			index: number
		) => {
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

			// Only include rows with non-zero values
			if (itemValue !== 0 && !isNaN(itemValue) && isFinite(itemValue)) {
				const name = item.name || `Item ${index + 1}`;
				const price = item.defaultPrice || 0;
				const quantity = item.defaultQuantity || 0;
				budgetRows.push(`"${name}","${price}","${quantity}","${itemValue}"`);
				grandTotal += itemValue;
			}
		}
	);

	if (budgetRows.length === 0) return '';

	const header = '"Item","Price","Quantity","Total"';
	const grandTotalRow = `"Grand Total","","","${grandTotal}"`;
	return [header, ...budgetRows, grandTotalRow].join('\n');
}

/**
 * Calculate budget total from budget response data (backwards compatibility)
 */
export function calculateBudgetTotal(data: unknown): string {
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

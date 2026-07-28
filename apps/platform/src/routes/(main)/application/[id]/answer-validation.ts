import type { QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
import { shouldShowConditionalQuestion } from './conditional-utils';
import type { ExpandedResponse } from './types';

export type ValidationResult =
	| { valid: true; code: null; message: '' }
	| { valid: false; code: string; message: string };

export type InvalidAnswer = {
	answerId: string;
	questionId: string;
	index: number;
	code: string;
	message: string;
};

export type ApplicationValidationResult = {
	valid: boolean;
	invalidAnswers: InvalidAnswer[];
};

type UnknownRecord = Record<string, unknown>;

type BudgetRule = {
	name?: string;
	defaultPrice?: unknown;
	isConstantPrice?: boolean;
	isLimitPrice?: boolean;
	maxPrice?: unknown;
	minPrice?: unknown;
	defaultQuantity?: unknown;
	isConstantQuantity?: boolean;
	isLimitQuantity?: boolean;
	maxQuantity?: unknown;
	minQuantity?: unknown;
	calculationMethod?: string;
	roundingMethod?: 'none' | 'round' | 'floor' | 'ceil';
	roundingDecimalPlaces?: unknown;
	customFormula?: string;
	rangeTable?: {
		input?: unknown[];
		output?: unknown[];
	};
	isLimitTotal?: boolean;
	maxTotal?: unknown;
	minTotal?: unknown;
	requestExplaination?: boolean;
	minFinalTotal?: unknown;
	maxFinalTotal?: unknown;
};

type BudgetValue = {
	defaultPrice?: unknown;
	defaultQuantity?: unknown;
	explaination?: unknown;
};

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^(?:\+8869\d{8}|09\d{8})$/;

const fileTypes: Record<string, string[]> = {
	pdf: ['.pdf'],
	image: ['.gif', '.heic', '.heif', '.jpeg', '.jpg', '.png', '.svg', '.webp'],
	audio: ['.aac', '.flac', '.m4a', '.mp3', '.ogg', '.wav'],
	video: ['.avi', '.flv', '.m4v', '.mkv', '.mov', '.mp4', '.mpeg', '.mpg', '.webm', '.wmv'],
	document: ['.doc', '.docx', '.odt', '.pdf', '.rtf', '.txt', '.wpd'],
	spreadsheet: ['.csv', '.ods', '.xls', '.xlsx'],
	presentation: ['.key', '.odp', '.ppt', '.pptx']
};

function valid(): ValidationResult {
	return { valid: true, code: null, message: '' };
}

function invalid(code: string, message: string): ValidationResult {
	return { valid: false, code, message };
}

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBlank(value: unknown): boolean {
	return typeof value !== 'string' || value.trim() === '';
}

function asFiniteNumber(value: unknown): number | null {
	const number = Number(value || 0);
	return Number.isFinite(number) ? number : null;
}

function optionRecord(question: QuestionsResponse): UnknownRecord {
	return isRecord(question.options) ? question.options : {};
}

function validateText(
	question: QuestionsResponse,
	response: unknown,
	format?: RegExp,
	formatMessage?: string,
	allowNumericValue = false
): ValidationResult {
	if (response == null || response === '') {
		return question.required ? invalid('required', 'Please fill in this field') : valid();
	}
	if (typeof response !== 'string' && !(allowNumericValue && typeof response === 'number')) {
		return invalid('invalid_type', 'This response has an invalid format');
	}
	const text = response.toString();

	const options = optionRecord(question);
	if (
		options.isMaxLength === true &&
		typeof options.maxLength === 'number' &&
		text.length > options.maxLength
	) {
		return invalid('max_length', `Character limit of ${options.maxLength} exceeded`);
	}
	if (question.required && text.trim() === '') {
		return invalid('required', 'Please fill in this field');
	}
	if (text.length > 0 && format && !format.test(text)) {
		return invalid('invalid_format', formatMessage ?? 'Invalid format');
	}
	return valid();
}

function validateRadio(question: QuestionsResponse, response: unknown): ValidationResult {
	if (response == null) {
		return question.required ? invalid('required', 'Please select an option') : valid();
	}
	if (!isRecord(response)) {
		return invalid('invalid_type', 'This response has an invalid format');
	}

	const options = optionRecord(question);
	const choices = Array.isArray(options.choices) ? options.choices : [];
	const selected = response.selected;
	if (selected == null) {
		return question.required ? invalid('required', 'Please select an option') : valid();
	}
	if (!Number.isInteger(selected)) {
		return invalid('invalid_selection', 'Please select a valid option');
	}

	const isOthers = options.isOthers === true;
	const maxIndex = choices.length - 1 + (isOthers ? 1 : 0);
	if ((selected as number) < 0 || (selected as number) > maxIndex) {
		return invalid('invalid_selection', 'Please select a valid option');
	}
	if (isOthers && selected === choices.length && isBlank(response.others)) {
		return invalid('others_required', 'Please fill in the others field');
	}
	return valid();
}

function validateCheckbox(question: QuestionsResponse, response: unknown): ValidationResult {
	if (response == null) {
		return question.required ? invalid('required', 'Please select an option') : valid();
	}
	if (!isRecord(response) || !Array.isArray(response.selected)) {
		return invalid('invalid_type', 'This response has an invalid format');
	}

	const options = optionRecord(question);
	const choices = Array.isArray(options.choices) ? options.choices : [];
	const isOthers = options.isOthers === true;
	const maxIndex = choices.length - 1 + (isOthers ? 1 : 0);
	const selected = response.selected;

	if (
		selected.some(
			(index) => !Number.isInteger(index) || (index as number) < 0 || (index as number) > maxIndex
		) ||
		new Set(selected).size !== selected.length
	) {
		return invalid('invalid_selection', 'Please select valid options');
	}
	if (question.required && selected.length === 0) {
		return invalid('required', 'Please select an option');
	}
	if (
		options.isMaxSelections === true &&
		typeof options.maxSelections === 'number' &&
		selected.length > options.maxSelections
	) {
		return invalid('max_selections', `Please select at most ${options.maxSelections} options`);
	}
	if (isOthers && selected.includes(choices.length) && isBlank(response.others)) {
		return invalid('others_required', 'Please fill in the others field');
	}
	return valid();
}

function validateCountedArray(
	question: QuestionsResponse,
	response: unknown,
	itemName: string
): ValidationResult {
	if (response == null) {
		return question.required ? invalid('required', `Please add at least one ${itemName}`) : valid();
	}
	if (!Array.isArray(response)) {
		return invalid('invalid_type', 'This response has an invalid format');
	}
	if (question.required && response.length === 0) {
		return invalid('required', `Please add at least one ${itemName}`);
	}

	const options = optionRecord(question);
	if (options.isControlCount === true) {
		const minCount = typeof options.minCount === 'number' ? options.minCount : 0;
		const maxCount =
			typeof options.maxCount === 'number' ? options.maxCount : Number.POSITIVE_INFINITY;
		if (response.length < minCount || response.length > maxCount) {
			return invalid(
				'count_range',
				`Please provide between ${minCount} and ${maxCount} ${itemName}s`
			);
		}
	}
	if (response.some((item) => !isRecord(item))) {
		return invalid('invalid_type', 'This response has an invalid format');
	}
	return valid();
}

function validateFiles(question: QuestionsResponse, response: unknown): ValidationResult {
	if (response == null) {
		return question.required ? invalid('required', 'Please upload a file') : valid();
	}
	if (!Array.isArray(response)) {
		return invalid('invalid_type', 'This response has an invalid format');
	}
	if (response.length === 0) {
		return question.required ? invalid('required', 'Please upload a file') : valid();
	}
	if (
		response.some(
			(item) =>
				!isRecord(item) ||
				typeof item.collectionId !== 'string' ||
				typeof item.recordId !== 'string' ||
				!Array.isArray(item.files) ||
				item.files.some((file) => typeof file !== 'string')
		)
	) {
		return invalid('invalid_file_reference', 'One or more file references are invalid');
	}

	const options = optionRecord(question);
	if (
		options.isMaxFiles === true &&
		typeof options.maxFiles === 'number' &&
		response.length > options.maxFiles
	) {
		return invalid('max_files', `Maximum of ${options.maxFiles} files exceeded`);
	}

	const specificTypes = Array.isArray(options.specificTypes)
		? options.specificTypes
				.map((type) => (isRecord(type) && typeof type.value === 'string' ? type.value : null))
				.filter((type): type is string => type !== null)
		: [];
	if (options.isSpecificTypes === true && specificTypes.length > 0) {
		const allowedExtensions = specificTypes.flatMap((type) => fileTypes[type] ?? []);
		const filenames = response.flatMap((item) => (item as UnknownRecord).files as string[]);
		if (
			filenames.some((file) => {
				const extension = file.includes('.') ? `.${file.split('.').pop()?.toLowerCase()}` : '';
				return !allowedExtensions.includes(extension);
			})
		) {
			return invalid('invalid_file_type', 'One or more files have an invalid type');
		}
	}
	return valid();
}

type BudgetCalculationValue = {
	price: number;
	quantity: number;
};

function evaluateFormula(formula: string, values: BudgetCalculationValue[]): number | null {
	const processed = formula.replace(/\{(\d+)([PQT])\}/g, (_match, index, type) => {
		const itemIndex = Number(index) - 1;
		if (itemIndex < 0 || itemIndex >= values.length) return '0';
		const item = values[itemIndex];
		if (type === 'P') return item.price.toString();
		if (type === 'Q') return item.quantity.toString();
		return (item.price * item.quantity).toString();
	});

	if (!/^[\d+\-*/().\s]+$/.test(processed)) return null;
	try {
		const result = Function(`"use strict"; return (${processed});`)();
		return typeof result === 'number' && Number.isFinite(result) ? result : null;
	} catch {
		return null;
	}
}

function calculateBudgetItem(
	rule: BudgetRule,
	value: BudgetCalculationValue,
	values: BudgetCalculationValue[]
): number | null {
	let total: number | null;
	if (!rule.calculationMethod || rule.calculationMethod === 'default') {
		total = value.price * value.quantity;
	} else {
		const formulaValue = evaluateFormula(rule.customFormula ?? '', values);
		if (formulaValue === null) return null;

		if (rule.calculationMethod === 'custom') {
			total = formulaValue;
		} else if (rule.calculationMethod === 'range') {
			const inputs = rule.rangeTable?.input?.map(asFiniteNumber) ?? [];
			const outputs = rule.rangeTable?.output?.map(asFiniteNumber) ?? [];
			const rangeIndex = inputs.findLastIndex((input) => input !== null && formulaValue >= input);
			total = rangeIndex >= 0 ? (outputs[rangeIndex] ?? null) : null;
		} else {
			return null;
		}
	}
	if (total === null || !Number.isFinite(total)) return null;

	const decimalPlaces = asFiniteNumber(rule.roundingDecimalPlaces) ?? 0;
	const multiplier = Math.pow(10, decimalPlaces);
	if (rule.roundingMethod === 'round') total = Math.round(total * multiplier) / multiplier;
	if (rule.roundingMethod === 'floor') total = Math.floor(total * multiplier) / multiplier;
	if (rule.roundingMethod === 'ceil') total = Math.ceil(total * multiplier) / multiplier;
	return total;
}

function validateBudget(question: QuestionsResponse, response: unknown): ValidationResult {
	if (response == null) {
		return question.required ? invalid('required', 'Please complete the budget') : valid();
	}
	if (
		!Array.isArray(response) ||
		!Array.isArray(question.options) ||
		question.options.length === 0
	) {
		return invalid('invalid_type', 'The budget has an invalid format');
	}
	if (response.length !== question.options.length || response.some((item) => !isRecord(item))) {
		return invalid('invalid_type', 'The budget has an invalid format');
	}

	const rules = question.options as BudgetRule[];
	const values = response as BudgetValue[];
	const calculationValues = rules.map((rule, index): BudgetCalculationValue | null => {
		const value = values[index];
		const price = asFiniteNumber(rule.isConstantPrice ? rule.defaultPrice : value.defaultPrice);
		const quantity = asFiniteNumber(
			rule.isConstantQuantity ? rule.defaultQuantity : value.defaultQuantity
		);
		return price === null || quantity === null ? null : { price, quantity };
	});
	if (calculationValues.some((value) => value === null)) {
		return invalid('invalid_number', 'One or more budget values are invalid');
	}
	const numericValues = calculationValues as BudgetCalculationValue[];
	const totals: number[] = [];

	for (let index = 0; index < rules.length; index++) {
		const rule = rules[index];
		const value = values[index];
		const { price, quantity } = numericValues[index];
		if (price < 0 || quantity < 0) {
			return invalid('invalid_number', `Budget item "${rule.name ?? index + 1}" is invalid`);
		}

		if (
			rule.isLimitPrice &&
			(price < (asFiniteNumber(rule.minPrice) ?? 0) ||
				price > (asFiniteNumber(rule.maxPrice) ?? Number.POSITIVE_INFINITY))
		) {
			return invalid(
				'price_range',
				`Budget item "${rule.name ?? index + 1}" price is out of range`
			);
		}
		if (
			rule.isLimitQuantity &&
			(quantity < (asFiniteNumber(rule.minQuantity) ?? 0) ||
				quantity > (asFiniteNumber(rule.maxQuantity) ?? Number.POSITIVE_INFINITY))
		) {
			return invalid(
				'quantity_range',
				`Budget item "${rule.name ?? index + 1}" quantity is out of range`
			);
		}

		const itemTotal = calculateBudgetItem(rule, numericValues[index], numericValues);
		if (itemTotal === null) {
			return invalid(
				'calculation_error',
				`Budget item "${rule.name ?? index + 1}" cannot be calculated`
			);
		}
		if (
			rule.isLimitTotal &&
			(itemTotal < (asFiniteNumber(rule.minTotal) ?? 0) ||
				itemTotal > (asFiniteNumber(rule.maxTotal) ?? Number.POSITIVE_INFINITY))
		) {
			return invalid(
				'total_range',
				`Budget item "${rule.name ?? index + 1}" total is out of range`
			);
		}
		if (rule.requestExplaination && itemTotal > 0 && isBlank(value.explaination)) {
			return invalid(
				'explanation_required',
				`Budget item "${rule.name ?? index + 1}" requires an explanation`
			);
		}
		totals.push(itemTotal);
	}

	const total = totals.reduce((sum, itemTotal) => sum + itemTotal, 0);
	if (total === 0) {
		return question.required ? invalid('zero_total', 'Budget total cannot be zero') : valid();
	}

	const minFinalTotal = asFiniteNumber(rules[0].minFinalTotal) ?? 0;
	const maxFinalTotal = asFiniteNumber(rules[0].maxFinalTotal) ?? Number.POSITIVE_INFINITY;
	if (total < minFinalTotal || total > maxFinalTotal) {
		return invalid(
			'final_total_range',
			`Budget total must be between ${minFinalTotal} and ${maxFinalTotal}`
		);
	}
	return valid();
}

export function validateAnswer(
	question: QuestionsResponse | undefined,
	response: unknown
): ValidationResult {
	if (!question) return invalid('missing_question', 'Question configuration is missing');

	switch (question.type) {
		case 'info':
			return valid();
		case 'shortText':
		case 'longText':
			return validateText(question, response, undefined, undefined, true);
		case 'email':
			return validateText(question, response, emailRegex, 'Invalid email format');
		case 'phone':
			return validateText(question, response, phoneRegex, 'Invalid phone number');
		case 'radio':
			return validateRadio(question, response);
		case 'checkbox':
			return validateCheckbox(question, response);
		case 'member':
			return validateCountedArray(question, response, 'member');
		case 'activity':
			return validateCountedArray(question, response, 'activity');
		case 'file':
			return validateFiles(question, response);
		case 'budget':
			return validateBudget(question, response);
		default:
			return invalid('unsupported_question_type', 'This question type is not supported');
	}
}

export function isAnswerApplicable(answer: ExpandedResponse, answers: ExpandedResponse[]): boolean {
	const question = answer.expand?.question;
	return question ? shouldShowConditionalQuestion(question, answers) : false;
}

export function isAnswerEffectivelyValid(
	answer: ExpandedResponse,
	answers: ExpandedResponse[]
): boolean {
	if (!isAnswerApplicable(answer, answers)) return true;
	return validateAnswer(answer.expand?.question, answer.response).valid;
}

export function validateApplicationAnswers(
	answers: ExpandedResponse[]
): ApplicationValidationResult {
	const invalidAnswers = answers.flatMap((answer, index): InvalidAnswer[] => {
		if (!isAnswerApplicable(answer, answers)) return [];

		const question = answer.expand?.question;
		const result = validateAnswer(question, answer.response);
		if (result.valid) return [];

		return [
			{
				answerId: answer.id,
				questionId: question?.id ?? '',
				index,
				code: result.code,
				message: result.message
			}
		];
	});

	return {
		valid: invalidAnswers.length === 0,
		invalidAnswers
	};
}

export function normalizeAnswerResponse(question: QuestionsResponse, response: unknown): unknown {
	if (question.type !== 'budget' || !Array.isArray(question.options) || !Array.isArray(response)) {
		return response;
	}

	return question.options.map((rule, index) => {
		const normalizedRule = structuredClone(rule) as UnknownRecord;
		const value = isRecord(response[index]) ? response[index] : {};
		normalizedRule.defaultPrice =
			normalizedRule.isConstantPrice === true ? normalizedRule.defaultPrice : value.defaultPrice;
		normalizedRule.defaultQuantity =
			normalizedRule.isConstantQuantity === true
				? normalizedRule.defaultQuantity
				: value.defaultQuantity;
		normalizedRule.explaination = typeof value.explaination === 'string' ? value.explaination : '';
		return normalizedRule;
	});
}

import { describe, expect, it } from 'vitest';
import type { QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
import {
	normalizeAnswerResponse,
	validateAnswer,
	validateApplicationAnswers
} from './answer-validation';
import type { ExpandedResponse } from './types';

function question(type: string, overrides: Partial<QuestionsResponse> = {}): QuestionsResponse {
	return {
		id: `${type}-question`,
		type,
		required: true,
		conditional: false,
		conditionquestion: [],
		conditionanswer: null,
		options: {},
		title: type,
		...overrides
	} as QuestionsResponse;
}

function answer(
	answerQuestion: QuestionsResponse,
	response: unknown,
	overrides: Partial<ExpandedResponse> = {}
): ExpandedResponse {
	return {
		id: `${answerQuestion.id}-answer`,
		response,
		valid: true,
		expand: { question: answerQuestion },
		...overrides
	} as ExpandedResponse;
}

describe('validateAnswer', () => {
	it.each([
		['shortText', 'hello'],
		['longText', 'long answer'],
		['email', 'student@example.com'],
		['phone', '0912345678'],
		['radio', { selected: 0, others: null }],
		['checkbox', { selected: [0], others: null }],
		['member', [{ name: 'Member' }]],
		['activity', [{ topic: 'Session' }]],
		['file', [{ collectionId: 'files', recordId: 'record-id', files: ['document.pdf'] }]]
	])('accepts a valid %s response', (type, response) => {
		const options =
			type === 'radio' || type === 'checkbox'
				? { choices: ['One'], isOthers: false }
				: type === 'file'
					? { isSpecificTypes: true, specificTypes: [{ value: 'pdf' }] }
					: {};

		expect(validateAnswer(question(type, { options }), response).valid).toBe(true);
	});

	it.each([
		['shortText', null],
		['longText', ' '],
		['email', 'not-an-email'],
		['phone', '123'],
		['radio', { selected: null, others: null }],
		['checkbox', { selected: [], others: null }],
		['member', []],
		['activity', []],
		['file', []]
	])('rejects an invalid required %s response', (type, response) => {
		const options =
			type === 'radio' || type === 'checkbox' ? { choices: ['One'], isOthers: false } : {};
		expect(validateAnswer(question(type, { options }), response).valid).toBe(false);
	});

	it('accepts empty optional responses', () => {
		for (const type of [
			'shortText',
			'longText',
			'email',
			'phone',
			'radio',
			'checkbox',
			'member',
			'activity',
			'file'
		]) {
			expect(validateAnswer(question(type, { required: false }), null).valid).toBe(true);
		}
	});

	it('accepts numeric values stored by legacy text fields', () => {
		expect(validateAnswer(question('shortText'), 113006431).valid).toBe(true);
		expect(validateAnswer(question('longText'), 12345).valid).toBe(true);
	});

	it('validates configured selection and count limits', () => {
		expect(
			validateAnswer(
				question('checkbox', {
					options: {
						choices: ['One', 'Two'],
						isOthers: false,
						isMaxSelections: true,
						maxSelections: 1
					}
				}),
				{ selected: [0, 1], others: null }
			).valid
		).toBe(false);
		expect(
			validateAnswer(
				question('activity', {
					options: { isControlCount: true, minCount: 2, maxCount: 3 }
				}),
				[{ topic: 'Only one' }]
			).valid
		).toBe(false);
	});

	it('validates budget totals and required explanations from authoritative rules', () => {
		const budgetQuestion = question('budget', {
			options: [
				{
					name: 'Materials',
					defaultPrice: 0,
					defaultQuantity: 0,
					isConstantPrice: false,
					isConstantQuantity: false,
					calculationMethod: 'default',
					roundingMethod: 'none',
					isLimitTotal: true,
					minTotal: 0,
					maxTotal: 5000,
					requestExplaination: true,
					minFinalTotal: 1,
					maxFinalTotal: 5000
				}
			]
		});

		expect(validateAnswer(budgetQuestion, null).valid).toBe(false);
		expect(
			validateAnswer(budgetQuestion, [{ defaultPrice: 100, defaultQuantity: 0, explaination: '' }])
				.valid
		).toBe(false);
		expect(
			validateAnswer(budgetQuestion, [{ defaultPrice: 100, defaultQuantity: 2, explaination: '' }])
				.valid
		).toBe(false);
		expect(
			validateAnswer(budgetQuestion, [
				{ defaultPrice: 100, defaultQuantity: 2, explaination: 'Workshop materials' }
			]).valid
		).toBe(true);
	});

	it('uses configured budget rules instead of client-supplied limits', () => {
		const budgetQuestion = question('budget', {
			options: [
				{
					name: 'Materials',
					defaultPrice: 0,
					defaultQuantity: 0,
					isConstantPrice: false,
					isConstantQuantity: false,
					calculationMethod: 'default',
					roundingMethod: 'none',
					isLimitTotal: true,
					minTotal: 0,
					maxTotal: 100,
					requestExplaination: false,
					minFinalTotal: 1,
					maxFinalTotal: 100
				}
			]
		});
		const tamperedResponse = [
			{
				defaultPrice: 200,
				defaultQuantity: 1,
				maxTotal: 999999,
				maxFinalTotal: 999999
			}
		];

		expect(validateAnswer(budgetQuestion, tamperedResponse).valid).toBe(false);
		const normalized = normalizeAnswerResponse(budgetQuestion, tamperedResponse) as Record<
			string,
			unknown
		>[];
		expect(normalized[0].maxTotal).toBe(100);
		expect(normalized[0].maxFinalTotal).toBe(100);
	});

	it('evaluates custom budget formulas with configured price and quantity references', () => {
		const budgetQuestion = question('budget', {
			options: [
				{
					name: 'Base',
					defaultPrice: 50,
					defaultQuantity: 2,
					isConstantPrice: true,
					isConstantQuantity: true,
					calculationMethod: 'default',
					roundingMethod: 'none',
					isLimitTotal: false,
					requestExplaination: false,
					minFinalTotal: 1,
					maxFinalTotal: 1000
				},
				{
					name: 'Calculated',
					defaultPrice: 0,
					defaultQuantity: 0,
					isConstantPrice: true,
					isConstantQuantity: true,
					calculationMethod: 'custom',
					customFormula: '{1P}*{1Q}',
					roundingMethod: 'none',
					isLimitTotal: false,
					requestExplaination: false
				}
			]
		});

		expect(
			validateAnswer(budgetQuestion, [
				{ defaultPrice: 999, defaultQuantity: 999 },
				{ defaultPrice: 0, defaultQuantity: 0 }
			]).valid
		).toBe(true);
	});
});

describe('validateApplicationAnswers', () => {
	it('ignores hidden conditionals but rejects a visible empty conditional answer', () => {
		const controllerQuestion = question('radio', {
			id: 'controller',
			options: { choices: ['Yes', 'No'], isOthers: false }
		});
		const conditionalQuestion = question('shortText', {
			id: 'conditional',
			conditional: true,
			conditionquestion: ['controller'],
			conditionanswer: { controller: '0' }
		});

		const hiddenAnswers = [
			answer(controllerQuestion, { selected: 1, others: null }),
			answer(conditionalQuestion, null)
		];
		expect(validateApplicationAnswers(hiddenAnswers).valid).toBe(true);

		const visibleAnswers = [
			answer(controllerQuestion, { selected: 0, others: null }),
			answer(conditionalQuestion, null)
		];
		const result = validateApplicationAnswers(visibleAnswers);
		expect(result.valid).toBe(false);
		expect(result.invalidAnswers[0].answerId).toBe('conditional-answer');
	});
});

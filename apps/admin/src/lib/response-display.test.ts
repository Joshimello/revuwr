import { describe, expect, it } from 'vitest';
import type { AnswersResponse, QuestionsResponse } from './pocketbase/pocketbase-types';
import {
	getAnswerDisplayState,
	isQuestionApplicable,
	isResponseEmpty,
	type ExpandedAnswer
} from './response-display';

function question(
	type: string,
	overrides: Partial<QuestionsResponse<unknown, unknown>> = {}
): QuestionsResponse<unknown, unknown> {
	return {
		id: overrides.id ?? `${type}-question`,
		type,
		required: false,
		conditional: false,
		conditionanswer: null,
		conditionquestion: [],
		count: 0,
		created: '',
		description: '',
		options: null,
		page: 1,
		title: type,
		updated: '',
		...overrides
	} as QuestionsResponse<unknown, unknown>;
}

function answer(
	questionRecord: QuestionsResponse<unknown, unknown>,
	response: unknown
): ExpandedAnswer {
	return {
		id: `${questionRecord.id}-answer`,
		application: 'application',
		comment: '',
		created: '',
		question: questionRecord.id,
		response,
		status: '',
		updated: '',
		expand: { question: questionRecord }
	} as AnswersResponse<unknown, { question: QuestionsResponse<unknown, unknown> }>;
}

describe('isResponseEmpty', () => {
	it.each([
		['shortText', '   '],
		['radio', { selected: null }],
		['checkbox', { selected: [] }],
		['member', []],
		['activity', []],
		['file', [{ files: [] }]],
		['budget', []]
	])('recognizes an empty %s response', (type, response) => {
		expect(isResponseEmpty(question(type), response)).toBe(true);
	});

	it.each([
		['shortText', 'Answer'],
		['shortText', 0],
		['radio', { selected: 0 }],
		['checkbox', { selected: [0] }],
		['member', [{ name: 'Member' }]],
		['activity', [{ topic: 'Session' }]],
		['file', [{ files: ['document.pdf'] }]]
	])('recognizes an answered %s response', (type, response) => {
		expect(isResponseEmpty(question(type), response)).toBe(false);
	});
});

describe('answer display states', () => {
	it('distinguishes optional and required empty answers', () => {
		expect(getAnswerDisplayState(answer(question('shortText'), ''))).toBe('unanswered-optional');
		expect(getAnswerDisplayState(answer(question('shortText', { required: true }), ''))).toBe(
			'missing-required'
		);
	});

	it('uses the same conditional matching behavior as the applicant form', () => {
		const controller = question('radio', { id: 'controller' });
		const conditional = question('shortText', {
			id: 'conditional',
			conditional: true,
			conditionquestion: ['controller'],
			conditionanswer: { controller: '1' }
		});
		const controllerAnswer = answer(controller, { selected: 0 });
		const conditionalAnswer = answer(conditional, 'stale value');

		expect(isQuestionApplicable(conditional, [controllerAnswer, conditionalAnswer])).toBe(false);
		expect(getAnswerDisplayState(conditionalAnswer, [controllerAnswer, conditionalAnswer])).toBe(
			'not-applicable'
		);
	});

	it('marks a visible conditional response as answered', () => {
		const controller = question('checkbox', { id: 'controller' });
		const conditional = question('shortText', {
			id: 'conditional',
			conditional: true,
			conditionquestion: ['controller'],
			conditionanswer: { controller: '1' }
		});
		const controllerAnswer = answer(controller, { selected: [1] });
		const conditionalAnswer = answer(conditional, 'Visible');

		expect(getAnswerDisplayState(conditionalAnswer, [controllerAnswer, conditionalAnswer])).toBe(
			'answered'
		);
	});
});

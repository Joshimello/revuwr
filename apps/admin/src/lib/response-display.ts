import type { AnswersResponse, QuestionsResponse } from './pocketbase/pocketbase-types';
import { getResponseRepresentation } from './response-repr';

export type AnswerDisplayState =
	| 'answered'
	| 'unanswered-optional'
	| 'missing-required'
	| 'not-applicable';

export type ExpandedAnswer = AnswersResponse<
	unknown,
	{
		question: QuestionsResponse<unknown, unknown>;
	}
>;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasNonBlankValue(value: unknown): boolean {
	if (value === null || value === undefined) return false;
	if (typeof value === 'string') return value.trim().length > 0;
	if (typeof value === 'number' || typeof value === 'boolean') return true;
	if (Array.isArray(value)) return value.some(hasNonBlankValue);
	if (isRecord(value)) return Object.values(value).some(hasNonBlankValue);
	return false;
}

export function isResponseEmpty(
	question: QuestionsResponse<unknown, unknown> | undefined,
	response: unknown
): boolean {
	if (response === null || response === undefined) return true;

	switch (question?.type) {
		case 'shortText':
		case 'longText':
		case 'email':
		case 'phone':
			return typeof response !== 'number' && String(response).trim().length === 0;
		case 'radio':
			return !isRecord(response) || !Number.isInteger(response.selected);
		case 'checkbox':
			return (
				!isRecord(response) || !Array.isArray(response.selected) || response.selected.length === 0
			);
		case 'file':
			return (
				!Array.isArray(response) ||
				response.flatMap((item) => (isRecord(item) && Array.isArray(item.files) ? item.files : []))
					.length === 0
			);
		case 'member':
		case 'activity':
			return !Array.isArray(response) || response.length === 0;
		case 'budget': {
			if (!Array.isArray(response) && !isRecord(response)) return true;
			const representation = getResponseRepresentation({
				response,
				expand: { question },
				application: '',
				comment: '',
				created: '',
				id: '',
				question: question.id,
				status: '',
				updated: ''
			} as ExpandedAnswer);
			const total = Number(representation);
			return representation === '' || (Number.isFinite(total) && total === 0);
		}
		default:
			return !hasNonBlankValue(response);
	}
}

/**
 * Mirrors the applicant platform's conditional-question behavior. Conditions are
 * treated as alternatives: matching any configured controller answer makes the
 * question applicable.
 */
export function isQuestionApplicable(
	question: QuestionsResponse<unknown, unknown> | undefined,
	allAnswers: ExpandedAnswer[]
): boolean {
	if (!question || !question.conditional) return true;
	if (!question.conditionquestion || !question.conditionanswer) return false;

	for (const conditionQuestionId of question.conditionquestion) {
		const conditionAnswer = allAnswers.find(
			(answer) =>
				answer.expand?.question?.id === conditionQuestionId ||
				answer.question === conditionQuestionId
		);

		if (!conditionAnswer || !conditionAnswer.response) continue;
		if (!isRecord(question.conditionanswer)) continue;

		const requiredAnswer = question.conditionanswer[conditionQuestionId];
		if (requiredAnswer === undefined) continue;

		if (typeof conditionAnswer.response === 'string') {
			if (conditionAnswer.response === requiredAnswer) return true;
			continue;
		}

		if (!isRecord(conditionAnswer.response)) continue;
		const selected = conditionAnswer.response.selected;

		if (typeof selected === 'number') {
			if (selected.toString() === requiredAnswer) return true;
		} else if (Array.isArray(selected)) {
			if (selected.includes(Number.parseInt(String(requiredAnswer)))) return true;
		} else if (Object.values(conditionAnswer.response).includes(requiredAnswer)) {
			return true;
		}
	}

	return false;
}

export function getAnswerDisplayState(
	answer: ExpandedAnswer | null | undefined,
	allAnswers: ExpandedAnswer[] = answer ? [answer] : []
): AnswerDisplayState {
	const question = answer?.expand?.question;
	if (!isQuestionApplicable(question, allAnswers)) return 'not-applicable';
	if (!isResponseEmpty(question, answer?.response)) return 'answered';
	return question?.required ? 'missing-required' : 'unanswered-optional';
}

export function hasStoredResponse(answer: ExpandedAnswer | null | undefined): boolean {
	return !isResponseEmpty(answer?.expand?.question, answer?.response);
}

export function stripHtml(value: string | undefined): string {
	if (!value) return '';
	return value
		.replace(/<br\s*\/?>/gi, ' ')
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

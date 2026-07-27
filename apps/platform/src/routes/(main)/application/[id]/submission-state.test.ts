import { describe, expect, it } from 'vitest';
import { canSubmitApplication } from './submission-state';

const validDraftState = {
	applicationStatus: 'draft',
	eventStatus: 'active',
	currentIndex: 35,
	answerCount: 36,
	currentAnswerValid: true,
	allOtherAnswersValid: true,
	isReadOnly: false,
	isLoading: false,
	isUpdating: false
};

describe('application submission eligibility', () => {
	it('allows a valid draft to be submitted from its final editable question', () => {
		expect(canSubmitApplication(validDraftState)).toBe(true);
	});

	it('allows an active edits-requested application to be resubmitted from a read-only final question', () => {
		expect(
			canSubmitApplication({
				...validDraftState,
				applicationStatus: 'editsRequested',
				isReadOnly: true
			})
		).toBe(true);
	});

	it('does not allow submission before the final question', () => {
		expect(
			canSubmitApplication({
				...validDraftState,
				applicationStatus: 'editsRequested',
				currentIndex: 28,
				isReadOnly: true
			})
		).toBe(false);
	});

	it('does not allow submission for an archived event', () => {
		expect(
			canSubmitApplication({
				...validDraftState,
				applicationStatus: 'editsRequested',
				eventStatus: 'archived',
				isReadOnly: true
			})
		).toBe(false);
	});

	it.each([
		['the current answer is invalid', { currentAnswerValid: false }],
		['another applicable answer is invalid', { allOtherAnswersValid: false }],
		['a submission is already loading', { isLoading: true }],
		['an answer update is in progress', { isUpdating: true }]
	])('does not allow submission when %s', (_description, override) => {
		expect(canSubmitApplication({ ...validDraftState, ...override })).toBe(false);
	});
});

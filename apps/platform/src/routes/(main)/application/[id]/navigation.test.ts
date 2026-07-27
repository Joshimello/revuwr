import { describe, expect, it } from 'vitest';
import { getNextQuestionIndex } from './navigation';
import type { ExpandedResponse } from './types';

function answer(status = '', conditional = false): ExpandedResponse {
	return {
		status,
		expand: {
			question: {
				conditional
			}
		}
	} as unknown as ExpandedResponse;
}

describe('getNextQuestionIndex', () => {
	it('skips read-only questions to reach the next requested edit', () => {
		const answers = [answer(), answer('edit'), answer(), answer(), answer('edit'), answer()];

		expect(getNextQuestionIndex(answers, 1, 'editsRequested')).toBe(4);
	});

	it('jumps to the final question after the last requested edit', () => {
		const answers = [answer(), answer('edit'), answer(), answer(), answer()];

		expect(getNextQuestionIndex(answers, 1, 'editsRequested')).toBe(4);
	});

	it('skips requested edits hidden by conditional logic', () => {
		const answers = [answer('edit'), answer('edit', true), answer()];

		expect(getNextQuestionIndex(answers, 0, 'editsRequested')).toBe(2);
	});

	it('continues to the next visible question for a draft', () => {
		const answers = [answer(), answer(), answer()];

		expect(getNextQuestionIndex(answers, 0, 'draft')).toBe(1);
	});
});

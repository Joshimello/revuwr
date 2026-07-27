import { shouldShowConditionalQuestion } from './conditional-utils';
import type { ExpandedResponse } from './types';

export function getNextQuestionIndex(
	answers: ExpandedResponse[],
	currentIndex: number,
	applicationStatus: string | undefined
): number {
	const lastIndex = answers.length - 1;
	if (lastIndex < 0) return currentIndex;

	for (let nextIndex = currentIndex + 1; nextIndex < answers.length; nextIndex++) {
		const nextAnswer = answers[nextIndex];
		const nextQuestion = nextAnswer.expand?.question;
		if (!nextQuestion) continue;

		const shouldShow = nextQuestion.conditional
			? shouldShowConditionalQuestion(nextQuestion, answers)
			: true;
		if (!shouldShow) continue;

		if (applicationStatus !== 'editsRequested' || nextAnswer.status === 'edit') {
			return nextIndex;
		}
	}

	return lastIndex;
}

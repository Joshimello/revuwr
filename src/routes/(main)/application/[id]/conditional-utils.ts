import type { QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
import type { ExpandedResponse } from './types';

/**
 * Determines if a conditional question should be shown based on previous answers
 * @param question - The question to check
 * @param allAnswers - All answers in the application
 * @returns boolean - true if question should be shown, false if it should be skipped
 */
export function shouldShowConditionalQuestion(
	question: QuestionsResponse | undefined,
	allAnswers: ExpandedResponse[]
): boolean {
	// If question doesn't exist or is not conditional, always show it
	if (!question || !question.conditional) {
		return true;
	}

	// If no condition questions or answers are defined, don't show
	if (!question.conditionquestion || !question.conditionanswer) {
		return false;
	}

	// Check if any of the condition questions have the required answer
	for (const conditionQuestionId of question.conditionquestion) {
		const conditionAnswer = allAnswers.find(
			(answer) => answer.expand?.question?.id === conditionQuestionId
		);

		if (conditionAnswer && conditionAnswer.response) {
			// Check if the response matches any of the required condition answers
			const requiredAnswers = question.conditionanswer;

			// Check if this condition question matches any required answer
			if (typeof requiredAnswers === 'object' && requiredAnswers !== null) {
				const requiredAnswerForThisQuestion = (requiredAnswers as Record<string, string>)[
					conditionQuestionId
				];

				if (requiredAnswerForThisQuestion !== undefined) {
					// Handle different response types
					if (typeof conditionAnswer.response === 'string') {
						// For string responses, check direct match
						if (conditionAnswer.response === requiredAnswerForThisQuestion) {
							return true;
						}
					} else if (
						typeof conditionAnswer.response === 'object' &&
						conditionAnswer.response !== null
					) {
						const responseObj = conditionAnswer.response as Record<string, unknown>;

						// Handle radio/single choice questions (response has 'selected' property)
						if ('selected' in responseObj && typeof responseObj.selected === 'number') {
							// Check if selected option index matches required answer
							if (responseObj.selected.toString() === requiredAnswerForThisQuestion) {
								return true;
							}
						}
						// Handle checkbox/multiple choice questions (response has 'selected' array)
						else if ('selected' in responseObj && Array.isArray(responseObj.selected)) {
							// Check if any selected option matches required answer
							if (responseObj.selected.includes(parseInt(requiredAnswerForThisQuestion))) {
								return true;
							}
						}
						// Handle other object responses
						else {
							// For other object types, try to match the required answer value
							for (const value of Object.values(responseObj)) {
								if (value === requiredAnswerForThisQuestion) {
									return true;
								}
							}
						}
					}
				}
			}
		}
	}

	// If none of the conditions are met, don't show the question
	return false;
}

/**
 * Processes all answers and marks conditional questions as valid if their conditions aren't met
 * @param answers - All answers in the application
 * @returns Promise<void>
 */
export async function processConditionalQuestions(
	answers: ExpandedResponse[]
): Promise<ExpandedResponse[]> {
	const processedAnswers = [...answers];

	for (let i = 0; i < processedAnswers.length; i++) {
		const answer = processedAnswers[i];
		const question = answer.expand?.question;

		if (question && question.conditional) {
			const shouldShow = shouldShowConditionalQuestion(question, processedAnswers);

			// If the question shouldn't be shown, mark it as valid
			if (!shouldShow) {
				processedAnswers[i] = {
					...answer,
					valid: true
				};
			}
		}
	}

	return processedAnswers;
}

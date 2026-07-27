type SubmissionState = {
	applicationStatus: string | undefined;
	eventStatus: string | undefined;
	currentIndex: number;
	answerCount: number;
	currentAnswerValid: boolean;
	allOtherAnswersValid: boolean;
	isReadOnly: boolean;
	isLoading: boolean;
	isUpdating: boolean;
};

export function canSubmitApplication({
	applicationStatus,
	eventStatus,
	currentIndex,
	answerCount,
	currentAnswerValid,
	allOtherAnswersValid,
	isReadOnly,
	isLoading,
	isUpdating
}: SubmissionState): boolean {
	if (
		!['draft', 'editsRequested'].includes(applicationStatus ?? '') ||
		eventStatus !== 'active' ||
		answerCount === 0 ||
		currentIndex !== answerCount - 1
	) {
		return false;
	}

	if (
		!currentAnswerValid ||
		!allOtherAnswersValid ||
		isLoading ||
		isUpdating ||
		(isReadOnly && applicationStatus !== 'editsRequested')
	) {
		return false;
	}

	return true;
}

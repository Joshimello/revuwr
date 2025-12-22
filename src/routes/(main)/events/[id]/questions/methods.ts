import type { EventsResponse, QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
import { pb } from '$lib/pocketbase/client';
import { toast } from 'svelte-sonner';
import { invalidateAll } from '$app/navigation';
import * as m from '$lib/paraglide/messages.js';

type ExpandedEvent = EventsResponse<
	Record<string, unknown>,
	{
		questions: QuestionsResponse[];
	}
>;

export const createNewPage = (eventId: string) => {
	const promise = new Promise<QuestionsResponse>((resolve, reject) => {
		(async () => {
			let question: QuestionsResponse | null = null;
			let currentQuestions: QuestionsResponse[] = [];

			try {
				// Fetch current event with questions to determine next page number
				const event = await pb.collection('events').getOne<ExpandedEvent>(eventId, {
					expand: 'questions'
				});
				currentQuestions = event.expand?.questions || [];

				question = await pb.collection('questions').create({
					type: 'info',
					count: 0,
					options: {},
					page:
						currentQuestions.length > 0 ? Math.max(...currentQuestions.map((i) => i.page)) + 1 : 1
				});
			} catch (err) {
				reject(err);
				return;
			}

			if (!question) {
				reject(new Error('Failed to create question'));
				return;
			}

			try {
				await pb
					.collection('events')
					.update<EventsResponse<{ questions: QuestionsResponse[] }>>(eventId, {
						'questions+': question.id
					});

				await invalidateAll();
				resolve(question);
			} catch (err) {
				await pb.collection('questions').delete(question.id);
				reject(err);
			}
		})();
	});

	toast.promise(promise, {
		loading: m.adding_new_page(),
		success: () => {
			return m.page_added();
		},
		error: (err) => {
			if (err instanceof Error) {
				return err.message;
			}
			return m.error_occurred();
		}
	});

	return promise;
};

export const addNewQuestion = (
	eventId: string,
	type: string,
	currentPage: string,
	index: number | null = null
) => {
	const promise = new Promise<QuestionsResponse>((resolve, reject) => {
		(async () => {
			let question: QuestionsResponse | null = null;

			try {
				question = await pb.collection('questions').create({
					type: type,
					count: 0,
					options: {},
					page: parseInt(currentPage)
				});
			} catch (err) {
				reject(err);
				return;
			}

			if (!question) {
				reject(new Error('Failed to create question'));
				return;
			}

			try {
				const event = await pb
					.collection('events')
					.getOne<ExpandedEvent>(eventId, { expand: 'questions' });

				if (event.questions.length > 0) {
					const questionsData = [...(event.expand?.questions || [])];
					const pages: Record<number, string[]> = {};
					questionsData.forEach((q) => {
						if (!pages[q.page]) pages[q.page] = [];
						pages[q.page].push(q.id);
					});

					if (index != null) pages[parseInt(currentPage)].splice(index + 1, 0, question.id);
					else pages[parseInt(currentPage)].push(question.id);

					const questionsIds = Object.values(pages).flat();

					await pb
						.collection('events')
						.update<EventsResponse<{ questions: QuestionsResponse[] }>>(eventId, {
							questions: questionsIds
						});
				} else {
					await pb
						.collection('events')
						.update<EventsResponse<{ questions: QuestionsResponse[] }>>(eventId, {
							'questions+': question.id
						});
				}

				await invalidateAll();
				resolve(question);
			} catch (err) {
				await pb.collection('questions').delete(question.id);
				reject(err);
			}
		})();
	});

	toast.promise(promise, {
		loading: m.adding_new_question(),
		success: () => {
			return m.question_added();
		},
		error: (err) => {
			if (err instanceof Error) {
				return err.message;
			}
			return m.error_occurred();
		}
	});

	return promise;
};

export const deleteQuestion = (questionId: string) => {
	const promise = new Promise<void>((resolve, reject) => {
		(async () => {
			try {
				await pb.collection('questions').delete(questionId);
				await invalidateAll();
				resolve();
			} catch (err) {
				reject(err);
			}
		})();
	});

	toast.promise(promise, {
		loading: 'Deleting question...',
		success: () => {
			return 'Question deleted successfully';
		},
		error: (err) => {
			if (err instanceof Error) {
				return err.message;
			}
			return m.error_occurred();
		}
	});

	return promise;
};

export const copyQuestion = (eventId: string, question: QuestionsResponse) => {
	const promise = new Promise<QuestionsResponse>((resolve, reject) => {
		(async () => {
			let copied: QuestionsResponse | null = null;

			try {
				copied = await pb.collection('questions').create({
					type: question.type,
					title: question.title,
					description: question.description,
					required: question.required,
					options: question.options,
					page: question.page,
					count: 0
				});
			} catch (err) {
				reject(err);
				return;
			}

			if (!copied) {
				reject(new Error('Failed to copy question'));
				return;
			}

			try {
				const event = await pb
					.collection('events')
					.getOne<ExpandedEvent>(eventId, { expand: 'questions' });

				const questionsData = [...(event.expand?.questions || [])];
				const pages: Record<number, string[]> = {};
				questionsData.forEach((q) => {
					if (!pages[q.page]) pages[q.page] = [];
					pages[q.page].push(q.id);
				});

				const index = pages[question.page].indexOf(question.id);
				pages[question.page].splice(index + 1, 0, copied.id);

				const questionsIds = Object.values(pages).flat();

				await pb
					.collection('events')
					.update<EventsResponse<{ questions: QuestionsResponse[] }>>(eventId, {
						questions: questionsIds
					});

				await invalidateAll();
				resolve(copied);
			} catch (err) {
				await pb.collection('questions').delete(copied.id);
				reject(err);
			}
		})();
	});

	toast.promise(promise, {
		loading: 'Copying question...',
		success: () => {
			return 'Question copied successfully';
		},
		error: (err) => {
			if (err instanceof Error) {
				return err.message;
			}
			return m.error_occurred();
		}
	});

	return promise;
};

export const saveQuestion = (question: QuestionsResponse) => {
	const promise = new Promise<void>((resolve, reject) => {
		(async () => {
			try {
				await pb.collection('questions').update(question.id, {
					title: question.title,
					description: question.description,
					options: question.options,
					required: question.required,
					conditional: question.conditional,
					conditionquestion: question.conditionquestion,
					conditionanswer: question.conditionanswer
				});
				await invalidateAll();
				resolve();
			} catch (err) {
				reject(err);
			}
		})();
	});

	toast.promise(promise, {
		loading: 'Saving question...',
		success: () => {
			return 'Question saved successfully';
		},
		error: (err) => {
			if (err instanceof Error) {
				return err.message;
			}
			return m.error_occurred();
		}
	});

	return promise;
};

export const moveQuestionUp = (eventId: string, question: QuestionsResponse, index: number) => {
	if (index === 0) return Promise.resolve();

	const promise = new Promise<void>((resolve, reject) => {
		(async () => {
			try {
				const event = await pb
					.collection('events')
					.getOne<ExpandedEvent>(eventId, { expand: 'questions' });

				if (event.questions.length > 0) {
					const questionsData = [...(event.expand?.questions || [])];
					const pages: Record<number, string[]> = {};
					questionsData.forEach((q) => {
						if (!pages[q.page]) pages[q.page] = [];
						pages[q.page].push(q.id);
					});

					const pageIndex = pages[question.page].indexOf(question.id);
					pages[question.page].splice(pageIndex, 1);
					pages[question.page].splice(pageIndex - 1, 0, question.id);

					const questionsIds = Object.values(pages).flat();

					await pb
						.collection('events')
						.update<EventsResponse<{ questions: QuestionsResponse[] }>>(eventId, {
							questions: questionsIds
						});
				} else {
					await pb
						.collection('events')
						.update<EventsResponse<{ questions: QuestionsResponse[] }>>(eventId, {
							'questions+': question.id
						});
				}
				await invalidateAll();
				resolve();
			} catch (err) {
				reject(err);
			}
		})();
	});

	toast.promise(promise, {
		loading: 'Moving question...',
		success: () => {
			return 'Question moved successfully';
		},
		error: (err) => {
			if (err instanceof Error) {
				return err.message;
			}
			return m.error_occurred();
		}
	});

	return promise;
};

export const moveQuestionDown = (eventId: string, question: QuestionsResponse) => {
	const promise = new Promise<void>((resolve, reject) => {
		(async () => {
			try {
				const event = await pb
					.collection('events')
					.getOne<ExpandedEvent>(eventId, { expand: 'questions' });

				if (event.questions.length > 0) {
					const questionsData = [...(event.expand?.questions || [])];
					const pages: Record<number, string[]> = {};
					questionsData.forEach((q) => {
						if (!pages[q.page]) pages[q.page] = [];
						pages[q.page].push(q.id);
					});

					const index = pages[question.page].indexOf(question.id);

					if (index === pages[question.page].length - 1) {
						resolve();
						return;
					}

					pages[question.page].splice(index, 1);
					pages[question.page].splice(index + 1, 0, question.id);

					const questionsIds = Object.values(pages).flat();

					await pb
						.collection('events')
						.update<EventsResponse<{ questions: QuestionsResponse[] }>>(eventId, {
							questions: questionsIds
						});
				} else {
					await pb
						.collection('events')
						.update<EventsResponse<{ questions: QuestionsResponse[] }>>(eventId, {
							'questions+': question.id
						});
				}
				await invalidateAll();
				resolve();
			} catch (err) {
				reject(err);
			}
		})();
	});

	toast.promise(promise, {
		loading: 'Moving question...',
		success: () => {
			return 'Question moved successfully';
		},
		error: (err) => {
			if (err instanceof Error) {
				return err.message;
			}
			return m.error_occurred();
		}
	});

	return promise;
};

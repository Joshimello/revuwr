import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/emails/application-summary', () => ({
	generateApplicationSummaryEmail: () => '<p>Application summary</p>'
}));

import { actions } from './+page.server';
import type { ExpandedApplication, ExpandedResponse } from './types';
import type { QuestionsResponse } from '$lib/pocketbase/pocketbase-types';

function question(type: string, overrides: Partial<QuestionsResponse> = {}): QuestionsResponse {
	return {
		id: `${type}-question`,
		type,
		required: true,
		conditional: false,
		conditionquestion: [],
		conditionanswer: null,
		options: {},
		...overrides
	} as QuestionsResponse;
}

function answer(answerQuestion: QuestionsResponse, response: unknown): ExpandedResponse {
	return {
		id: `${answerQuestion.id}-answer`,
		application: 'application-id',
		question: answerQuestion.id,
		response,
		status: '',
		valid: true,
		expand: { question: answerQuestion }
	} as ExpandedResponse;
}

function application(
	applicationAnswers: ExpandedResponse[],
	status = 'draft'
): ExpandedApplication {
	return {
		id: 'application-id',
		responder: 'user-id',
		status,
		expand: {
			event: {
				id: 'event-id',
				name: 'Test event',
				status: 'active'
			},
			response: applicationAnswers
		}
	} as ExpandedApplication;
}

function actionEvent(
	app: ExpandedApplication,
	options: {
		request?: Request;
		emailResult?: unknown;
	}
) {
	const applicationUpdate = vi.fn().mockResolvedValue(app);
	const answerUpdate = vi.fn().mockResolvedValue({});
	const getOne = vi.fn().mockResolvedValue(app);
	const collection = vi.fn((name: string) => {
		if (name === 'applications') {
			return { getOne, update: applicationUpdate };
		}
		if (name === 'answers') {
			return { update: answerUpdate };
		}
		return { getOne: vi.fn() };
	});
	const emailSend = vi
		.fn()
		.mockResolvedValue(options.emailResult ?? { data: { id: 'email-id' }, error: null });

	return {
		event: {
			params: { id: app.id },
			request: options.request ?? new Request('http://localhost/application/application-id'),
			locals: {
				user: { id: 'user-id', email: 'student@example.com' },
				apb: { collection },
				rs: { emails: { send: emailSend } }
			}
		},
		applicationUpdate,
		answerUpdate,
		emailSend
	};
}

describe('application actions', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('rejects a stale valid flag when the actual required response is empty', async () => {
		const budget = question('budget', {
			options: [
				{
					name: 'Materials',
					defaultPrice: 0,
					defaultQuantity: 0,
					isConstantPrice: false,
					isConstantQuantity: false,
					calculationMethod: 'default',
					minFinalTotal: 1,
					maxFinalTotal: 5000
				}
			]
		});
		const fixture = actionEvent(application([answer(budget, null)]), {});

		const result = await actions.submit!(fixture.event as never);

		expect(result).toMatchObject({
			status: 422,
			data: {
				invalidAnswers: [{ answerId: 'budget-question-answer' }]
			}
		});
		expect(fixture.applicationUpdate).not.toHaveBeenCalled();
		expect(fixture.emailSend).not.toHaveBeenCalled();
	});

	it('does not save an invalid answer update', async () => {
		const requiredText = question('shortText');
		const app = application([answer(requiredText, null)]);
		const formData = new FormData();
		formData.set('answerId', 'shortText-question-answer');
		formData.set('answer', JSON.stringify(null));
		const fixture = actionEvent(app, {
			request: new Request('http://localhost/application/application-id?/updateAnswer', {
				method: 'POST',
				body: formData
			})
		});

		const result = await actions.updateAnswer!(fixture.event as never);

		expect(result).toMatchObject({
			status: 422,
			data: { message: 'Please fill in this field' }
		});
		expect(fixture.answerUpdate).not.toHaveBeenCalled();
	});

	it('commits a valid submission even when confirmation email delivery fails', async () => {
		const fixture = actionEvent(application([answer(question('info'), null)]), {
			emailResult: { data: null, error: { message: 'Email unavailable' } }
		});
		vi.spyOn(console, 'error').mockImplementation(() => undefined);

		await expect(actions.submit!(fixture.event as never)).rejects.toMatchObject({
			status: 303,
			location: '/'
		});

		expect(fixture.applicationUpdate).toHaveBeenCalledWith('application-id', {
			status: 'submitted',
			submissionTime: expect.any(String)
		});
		expect(fixture.emailSend).toHaveBeenCalledOnce();
	});

	it('treats retrying an already submitted application as an idempotent success', async () => {
		const fixture = actionEvent(
			application([answer(question('shortText'), null)], 'submitted'),
			{}
		);

		await expect(actions.submit!(fixture.event as never)).rejects.toMatchObject({
			status: 303,
			location: '/'
		});

		expect(fixture.applicationUpdate).not.toHaveBeenCalled();
		expect(fixture.emailSend).not.toHaveBeenCalled();
	});
});

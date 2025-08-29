<script lang="ts">
	import { page } from '$app/stores';
	import Editor from '$lib/components/editor.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Select from '$lib/components/ui/select';
	import * as m from '$lib/paraglide/messages.js';
	import { pb } from '$lib/pocketbase/client';
	import { type EventsResponse, type QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
	import { Copy, Edit, MoveDown, MoveUp, Plus, Save, SaveOff, Trash, X } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { refreshQuestions } from './methods';
	import questionTypes from './question-types';
	import { questions } from './stores';

	export let question: QuestionsResponse;
	export let editingId: string | null;
	export let index: number;

	$: isEditing = editingId == question.id;

	const handleEdit = async () => {
		editingId = question.id;
		// Initialize arrays if they don't exist
		if (!Array.isArray(question.conditionquestion)) {
			question.conditionquestion = question.conditionquestion ? [question.conditionquestion] : [];
		}
		if (typeof question.conditionanswer !== 'object' || question.conditionanswer === null) {
			question.conditionanswer = {};
		}
		refreshQuestions();
	};

	const addCondition = () => {
		if (!Array.isArray(question.conditionquestion)) {
			question.conditionquestion = [];
		}
		if (typeof question.conditionanswer !== 'object' || question.conditionanswer === null) {
			question.conditionanswer = {};
		}
		question.conditionquestion = [...question.conditionquestion, ''];
	};

	const removeCondition = (index: number) => {
		if (!Array.isArray(question.conditionquestion)) return;

		const removedQuestionId = question.conditionquestion[index];
		question.conditionquestion = question.conditionquestion.filter((_, i) => i !== index);

		// Remove the corresponding answer
		if (
			removedQuestionId &&
			question.conditionanswer &&
			typeof question.conditionanswer === 'object'
		) {
			const newAnswers: Record<string, string> = { ...question.conditionanswer };
			delete newAnswers[removedQuestionId];
			question.conditionanswer = newAnswers;
		}
	};

	const updateConditionQuestion = (index: number, questionId: string) => {
		if (!Array.isArray(question.conditionquestion)) return;

		const oldQuestionId = question.conditionquestion[index];
		question.conditionquestion[index] = questionId;

		// Update the answer object
		if (question.conditionanswer && typeof question.conditionanswer === 'object') {
			const newAnswers: Record<string, string> = { ...question.conditionanswer };
			if (oldQuestionId && oldQuestionId !== questionId) {
				delete newAnswers[oldQuestionId];
			}
			if (questionId) {
				newAnswers[questionId] = newAnswers[questionId] || '';
			}
			question.conditionanswer = newAnswers;
		}
	};

	const updateConditionAnswer = (questionId: string, answerIndex: string) => {
		if (!question.conditionanswer || typeof question.conditionanswer !== 'object') {
			question.conditionanswer = {};
		}
		question.conditionanswer = { ...question.conditionanswer, [questionId]: answerIndex };
	};

	const handleDelete = async () => {
		try {
			await pb.collection('questions').delete(question.id);
			toast.success('Question deleted successfully');
			refreshQuestions();
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
				console.error(err);
			}
		}
	};

	const handleCopy = async () => {
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
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
				console.error(err);
			}
			return;
		}

		if (!copied) return;

		try {
			const event = await pb
				.collection('events')
				.getOne<
					EventsResponse<any, { questions: QuestionsResponse[] }>
				>($page.params.id, { expand: 'questions' });

			const questions = [...(event.expand?.questions || [])];
			let pages: Record<number, string[]> = {};
			questions.forEach((q) => {
				if (!pages[q.page]) pages[q.page] = [];
				pages[q.page].push(q.id);
			});

			const index = pages[question.page].indexOf(question.id);
			pages[question.page].splice(index + 1, 0, copied.id);

			const questionsIds = Object.values(pages).flat();

			await pb
				.collection('events')
				.update<
					EventsResponse<{ questions: QuestionsResponse[] }>
				>($page.params.id, { questions: questionsIds });

			refreshQuestions();
			editingId = copied.id;
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
				console.error(err);
			}
			await pb.collection('questions').delete(copied.id);
		}
	};

	const handleCancel = async () => {
		editingId = null;
		refreshQuestions();
	};

	const handleSave = async () => {
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
			toast.success('Question saved successfully');
			editingId = null;
			refreshQuestions();
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
				console.error(err);
			}
		}
	};

	const handleMoveUp = async () => {
		if (index == 0) return;

		try {
			const event = await pb
				.collection('events')
				.getOne<
					EventsResponse<any, { questions: QuestionsResponse[] }>
				>($page.params.id, { expand: 'questions' });

			if (event.questions.length > 0) {
				const questions = [...(event.expand?.questions || [])];
				let pages: Record<number, string[]> = {};
				questions.forEach((q) => {
					if (!pages[q.page]) pages[q.page] = [];
					pages[q.page].push(q.id);
				});

				const index = pages[question.page].indexOf(question.id);
				pages[question.page].splice(index, 1);
				pages[question.page].splice(index - 1, 0, question.id);

				const questionsIds = Object.values(pages).flat();

				await pb
					.collection('events')
					.update<
						EventsResponse<any, { questions: QuestionsResponse[] }>
					>($page.params.id, { questions: questionsIds });
			} else {
				await pb
					.collection('events')
					.update<
						EventsResponse<{ questions: QuestionsResponse[] }>
					>($page.params.id, { 'questions+': question.id });
			}
			refreshQuestions();
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
				console.error(err);
			}
		}
	};

	const handleMoveDown = async () => {
		try {
			const event = await pb
				.collection('events')
				.getOne<
					EventsResponse<any, { questions: QuestionsResponse[] }>
				>($page.params.id, { expand: 'questions' });

			if (event.questions.length > 0) {
				const questions = [...(event.expand?.questions || [])];
				let pages: Record<number, string[]> = {};
				questions.forEach((q) => {
					if (!pages[q.page]) pages[q.page] = [];
					pages[q.page].push(q.id);
				});

				const index = pages[question.page].indexOf(question.id);

				if (index == pages[question.page].length - 1) return;

				pages[question.page].splice(index, 1);
				pages[question.page].splice(index + 1, 0, question.id);

				const questionsIds = Object.values(pages).flat();

				await pb
					.collection('events')
					.update<
						EventsResponse<any, { questions: QuestionsResponse[] }>
					>($page.params.id, { questions: questionsIds });
			} else {
				await pb
					.collection('events')
					.update<
						EventsResponse<{ questions: QuestionsResponse[] }>
					>($page.params.id, { 'questions+': question.id });
			}
			refreshQuestions();
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
				console.error(err);
			}
		}
	};
</script>

{#if questionTypes[question.type]}
	<Card.Root class="relative flex overflow-hidden">
		<div class="flex w-6 flex-col overflow-hidden border-r">
			<Button
				class="h-full rounded-none px-0 text-muted-foreground"
				variant="ghost"
				on:click={handleMoveUp}
			>
				<MoveUp size="12" />
			</Button>
			<Button
				class="h-full rounded-none px-0 text-muted-foreground"
				variant="ghost"
				on:click={handleMoveDown}
			>
				<MoveDown size="12" />
			</Button>
		</div>
		<div class="w-full">
			<Card.Header>
				<Card.Title>
					{#if isEditing}
						<Editor bind:value={question.title} placeholder="Question" class="outline-none" />
					{:else}
						{@html question.title}
					{/if}
				</Card.Title>
				<Card.Description>
					{#if isEditing}
						<Editor
							bind:value={question.description}
							placeholder="Description"
							class="outline-none"
						/>
					{:else}
						{@html question.description}
					{/if}
				</Card.Description>
			</Card.Header>
			<Card.Content class={question.type == 'info' ? 'pb-0' : ''}>
				<svelte:component
					this={questionTypes[question.type].component}
					bind:options={question.options}
					{isEditing}
					required={question.required}
				/>

				{#if isEditing}
					<div class="flex items-center gap-2">
						<Checkbox bind:checked={question.conditional} />
						<span> {m.conditional_question()} </span>
					</div>
					{#if question.conditional}
						<div class="mb-2 mt-1 space-y-2">
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium">{m.conditions_must_be_met()}</span>
								<Button on:click={addCondition} variant="outline" size="sm" class="h-8 px-2">
									<Plus size="14" class="mr-1" />
									{m.add_condition()}
								</Button>
							</div>

							{#each question.conditionquestion || [] as conditionQuestionId, index}
								<div class="flex items-start gap-2 rounded border p-2">
									<div class="flex-1 space-y-2">
										<div class="flex flex-col">
											<span class="text-xs font-bold">{m.condition_question()}</span>
											<Select.Root
												selected={{
													value: conditionQuestionId,
													label: $questions.find((q) => q.id === conditionQuestionId)?.title
												}}
												onSelectedChange={(value) => {
													updateConditionQuestion(index, value?.value || '');
												}}
											>
												<Select.Trigger class="w-full truncate">
													{conditionQuestionId
														? $questions
																.find((q) => q.id === conditionQuestionId)
																?.title.replace(/<[^>]*>/g, '') || m.no_title()
														: m.select_a_question()}
												</Select.Trigger>
												<Select.Content class="max-h-64 overflow-y-auto">
													{#each $questions.filter((q) => q.type === 'radio') as q}
														<Select.Item class="truncate" value={q.id}>
															{q.title.replace(/<[^>]*>/g, '') || m.no_title()}
														</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
										</div>

										{#if conditionQuestionId}
											<div class="flex flex-col">
												<span class="text-xs font-bold">{m.condition_answer()}</span>
												<Select.Root
													selected={{
														value: question.conditionanswer?.[conditionQuestionId],
														label: $questions.find((q) => q.id === conditionQuestionId)?.options
															.choices[question.conditionanswer?.[conditionQuestionId]]
													}}
													onSelectedChange={(value) => {
														updateConditionAnswer(conditionQuestionId, value?.value ?? '');
													}}
												>
													<Select.Trigger class="w-full truncate">
														<Select.Value placeholder={m.select_an_answer()} />
													</Select.Trigger>
													<Select.Content>
														{#each $questions.find((q) => q.id === conditionQuestionId)?.options.choices || [] as answer, answerIndex}
															<Select.Item value={answerIndex.toString()}>{answer}</Select.Item>
														{/each}
													</Select.Content>
												</Select.Root>
											</div>
										{/if}
									</div>

									<Button
										on:click={() => removeCondition(index)}
										variant="ghost"
										size="sm"
										class="mt-5 h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
									>
										<X size="14" />
									</Button>
								</div>
							{/each}
						</div>
					{/if}
					<div class="flex items-center gap-2">
						<Checkbox bind:checked={question.required} />
						<span>
							{m.required()}
						</span>
					</div>
				{/if}

				{#if !isEditing}
					<Button on:click={handleEdit} variant="ghost" size="icon" class="absolute right-1 top-1">
						<Edit size="16" />
					</Button>
				{/if}
			</Card.Content>

			{#if isEditing}
				<Card.Footer class="flex justify-end gap-1 border-t p-1">
					<span class="ml-2 mr-auto text-xs text-muted-foreground">
						{question.type}.{question.id}
					</span>
					<Button
						on:click={handleDelete}
						variant="ghost"
						size="icon"
						class="text-destructive hover:bg-destructive hover:text-destructive-foreground"
					>
						<Trash size="16" />
					</Button>
					<Button on:click={handleCopy} variant="ghost" size="icon">
						<Copy size="16" />
					</Button>
					<Button on:click={handleCancel} variant="ghost" size="icon">
						<SaveOff size="16" />
					</Button>
					<Button on:click={handleSave} variant="ghost" size="icon">
						<Save size="16" />
					</Button>
				</Card.Footer>
			{/if}
		</div>
	</Card.Root>
{:else}
	<div class="flex w-full items-center justify-between">
		<span class="text-sm text-muted-foreground">
			[{question.type}.{question.id}]: Unknown question type
		</span>
		<Button variant="outline" size="icon" on:click={handleDelete}>
			<Trash size="16" />
		</Button>
	</div>
{/if}

<script lang="ts">
	import Editor from '$lib/components/editor.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Select from '$lib/components/ui/select';
	import * as m from '$lib/paraglide/messages.js';
	import { Copy, Edit, MoveDown, MoveUp, Plus, Save, SaveOff, Trash, X } from 'lucide-svelte';
	import {
		copyQuestion,
		deleteQuestion,
		moveQuestionDown,
		moveQuestionUp,
		saveQuestion
	} from './methods';
	import questionTypes from './question-types';
	import type { Question } from './types';

	export let question: Question;
	export let editingId: string | null;
	export let index: number;
	export let eventId: string;
	export let questions: Question[];

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
		if (question.conditionanswer && typeof question.conditionanswer === 'object') {
			question.conditionanswer = { ...question.conditionanswer, [questionId]: answerIndex };
		} else {
			question.conditionanswer = { [questionId]: answerIndex };
		}
	};

	const handleDelete = async () => {
		await deleteQuestion(question.id);
	};

	const handleCopy = async () => {
		const copied = await copyQuestion(eventId, question);
		if (copied) {
			editingId = copied.id;
		}
	};

	const handleCancel = async () => {
		editingId = null;
	};

	const handleSave = async () => {
		await saveQuestion(question);
		editingId = null;
	};

	const handleMoveUp = async () => {
		await moveQuestionUp(eventId, question, index);
	};

	const handleMoveDown = async () => {
		await moveQuestionDown(eventId, question);
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
						<!-- eslint-disable-next-line -->
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
						<!-- eslint-disable-next-line -->
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
													label: questions.find((q) => q.id === conditionQuestionId)?.title
												}}
												onSelectedChange={(value) => {
													updateConditionQuestion(index, value?.value || '');
												}}
											>
												<Select.Trigger class="w-full truncate">
													{conditionQuestionId
														? questions
																.find((q) => q.id === conditionQuestionId)
																?.title.replace(/<[^>]*>/g, '') || m.no_title()
														: m.select_a_question()}
												</Select.Trigger>
												<Select.Content class="max-h-64 overflow-y-auto">
													{#each questions.filter((q) => q.type === 'radio') as q}
														<Select.Item class="truncate" value={q.id}>
															{q.title.replace(/<[^>]*>/g, '') || m.no_title()}
														</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
										</div>

										{#if conditionQuestionId}
											{#each questions.filter((q) => q.id === conditionQuestionId) as selectedQuestion}
												{@const questionOptions = selectedQuestion.options}
												{@const hasChoices =
													questionOptions && Array.isArray(questionOptions.choices)}
												<div class="flex flex-col">
													<span class="text-xs font-bold">{m.condition_answer()}</span>
													{#if hasChoices}
														{@const choices = questionOptions.choices}
														<Select.Root
															selected={{
																value: question.conditionanswer?.[conditionQuestionId] || '',
																label:
																	choices[
																		parseInt(question.conditionanswer?.[conditionQuestionId] || '0')
																	] || ''
															}}
															onSelectedChange={(value) => {
																updateConditionAnswer(conditionQuestionId, value?.value ?? '');
															}}
														>
															<Select.Trigger class="w-full truncate">
																<Select.Value placeholder={m.select_an_answer()} />
															</Select.Trigger>
															<Select.Content>
																{#each choices as answer, answerIndex}
																	<Select.Item value={answerIndex.toString()}>{answer}</Select.Item>
																{/each}
															</Select.Content>
														</Select.Root>
													{/if}
												</div>
											{/each}
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

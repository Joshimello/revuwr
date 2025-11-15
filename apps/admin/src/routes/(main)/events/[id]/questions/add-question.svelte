<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import * as m from '$lib/paraglide/messages.js';
	import { pb } from '$lib/pocketbase/client';
	import type { EventsResponse, QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
	import { toast } from 'svelte-sonner';
	import { refreshQuestions } from './methods';
	import questionTypes from './question-types';

	export let currentPage: string;
	export let editingId: string | null;
	export let long: boolean = false;
	export let index: number | null = null;

	const addQuestion = async (type: string) => {
		open = false;

		const promise = new Promise(async (resolve, reject) => {
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

					if (index != null) pages[parseInt(currentPage)].splice(index + 1, 0, question.id);
					else pages[parseInt(currentPage)].push(question.id);

					const questionsIds = Object.values(pages).flat();

					await pb
						.collection('events')
						.update<
							EventsResponse<{ questions: QuestionsResponse[] }>
						>($page.params.id, { questions: questionsIds });
				} else {
					await pb
						.collection('events')
						.update<
							EventsResponse<{ questions: QuestionsResponse[] }>
						>($page.params.id, { 'questions+': question.id });
				}

				refreshQuestions();
				editingId = question.id;
				resolve(question);
			} catch (err) {
				await pb.collection('questions').delete(question.id);
				reject(err);
			}
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
	};

	let open = false;
</script>

<Popover.Root bind:open>
	<Popover.Trigger asChild let:builder>
		{#if long}
			<Button
				builders={[builder]}
				class="h-2 w-full text-xs text-muted-foreground opacity-0 transition-opacity duration-75 hover:opacity-100"
				variant="ghost"
			>
				{m.add_a_new_question()}
			</Button>
		{:else}
			<Button builders={[builder]}>
				{m.add_a_new_question()}
			</Button>
		{/if}
	</Popover.Trigger>
	<Popover.Content>
		{#each Object.entries(questionTypes) as [type, { label, icon, component }]}
			<Button
				class="flex w-full justify-start gap-2"
				variant="outline"
				size="sm"
				on:click={() => addQuestion(type)}
			>
				<svelte:component this={icon} size="16" class="shrink-0" />
				<span>{label}</span>
			</Button>
		{/each}
	</Popover.Content>
</Popover.Root>

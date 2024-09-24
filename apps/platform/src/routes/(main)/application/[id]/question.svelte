<script lang="ts">
	import type { AnswersResponse, ApplicationsResponse, EventsResponse, QuestionsResponse } from "$lib/pocketbase/pocketbase-types";
  import * as Card from "$lib/components/ui/card"
  import questionTypes from "./question-types";
	import { Badge } from "$lib/components/ui/badge";
  import { pb } from "$lib/pocketbase/client";
	import { toast } from "svelte-sonner";
  import { application } from "./stores";
  import { type ExpandedResponse } from "./types";

  export let answer: ExpandedResponse;
  let question = answer.expand?.question;
  let newResponse = answer.response;
  let isValid: boolean;

  const handleSave = async () => {

    if (!question) return;
    
    if (!['file', 'image'].includes(question.type)) {
      if (JSON.stringify(answer.response) === JSON.stringify(newResponse)) return;
    }

    try {
      const newAnswer =  await pb.collection("answers").update<ExpandedResponse>(answer.id, {
        response: newResponse,
        valid: isValid,
      }, {
        expand: "question"
      });
      const responseIndex = $application?.expand?.response.findIndex(i => i.id == newAnswer.id);
      if (responseIndex !== undefined && responseIndex !== -1 && $application && $application.expand) {
        $application.expand.response[responseIndex] = newAnswer;
      }
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An error occurred");
      }
    }
  }

  $: disabled = !((answer.status == 'edit' && $application?.status == 'editsRequested') || $application?.status == 'draft');

</script>

{#if question}
  <Card.Root class={disabled ? 'bg-muted' : ''}>
    <Card.Header>
      <Card.Title>
        {@html question.title}
      </Card.Title>
      <Card.Description class="">
        <span>{@html question.description}</span>
      </Card.Description>
      {#if answer.status == 'edit'}
      <Card.Description class="">
        Comments for edit: <span>{answer.comment}</span>
      </Card.Description>
      {/if}
    </Card.Header>
    {#if question.type != "info"}
      <Card.Content>
        <svelte:component
          disabled={disabled}
          this={questionTypes[question.type].component} 
          options={question.options}
          required={question.required}
          bind:value={newResponse}
          bind:isValid
          handleSave={handleSave}
          {...(['file', 'image'].includes(question.type) ? {
            record: answer
          } : {})}
        />
      </Card.Content>
      <Card.Footer>
        {#if question.required}
          <Badge variant={isValid?'secondary':'default'}>Required</Badge>
        {:else}
          <Badge variant="secondary">Optional</Badge>
        {/if}
      </Card.Footer>
    {/if}
  </Card.Root>
{/if}
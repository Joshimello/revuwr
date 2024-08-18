import { fail, redirect, isRedirect } from "@sveltejs/kit"
import { PUBLIC_PB_URL } from "$env/static/public"
import { env } from "$env/dynamic/private"
import Pocketbase from "pocketbase"
import type { EventsResponse, QuestionsResponse, TypedPocketBase } from "$lib/pocketbase/pocketbase-types.js"

type ExpandedEventsResponse = EventsResponse<{
  questions: QuestionsResponse[]
}>

export const actions = {
  async default ({ params, request }) {

    let apb: TypedPocketBase | null = null
    const createdRecords = {
      applicationId: null as string | null,
      answersIds: [] as string[]
    }

    try {
      const data = await request.formData();
      const eventId = params.id
      const userId = data.get("userId") as string

      apb = new Pocketbase(PUBLIC_PB_URL) as TypedPocketBase
      await apb.admins.authWithPassword(env.PB_EMAIL, env.PB_PASSWORD)

      const event = await apb.collection("events").getOne<ExpandedEventsResponse>(eventId, {
        expand: "questions"
      })
      const user = await apb.collection("users").getOne(userId)

      if (!event.expand?.questions) {
        return fail(400, { message: "Questions could not be fetched" })
      }

      const questions = event.expand.questions

      if (new Date() < new Date(event.startDate)) {
        return fail(400, { message: "Event has not started yet"})
      }

      if (new Date() > new Date(+new Date(event.endDate) + 86400000)) {
        return fail(400, { message: "Event has already passed"})
      }

      const userResponses = await apb.collection("applications").getFullList({
        filter: `responder = "${user.id}" && event = "${event.id}"`
      })

      if (userResponses.length >= event.responseLimit) {
        return fail(400, { message: "Application limit reached"})
      }

      const application = await apb.collection("applications").create({
        event: event.id,
        status: "draft",
        responder: user.id
      })

      createdRecords.applicationId = application.id

      let answersIds: string[] = []
      for (const question of questions) {
        const answer = await apb.collection("answers").create({
          application: application.id,
          question: question.id,
          valid: question.type == "info" ? true : false
        })
        answersIds = [...answersIds, answer.id]
      }

      createdRecords.answersIds = [...answersIds]

      await apb.collection("applications").update(application.id, {
        response: answersIds
      })

      return redirect(302, `/application/${application.id}`)

    }

    catch (err) {
      if (isRedirect(err)) {
        return redirect(err.status, err.location)
      }

      if (apb && createdRecords.applicationId) {
        try {
          for (const answerId of createdRecords.answersIds) {
            await apb.collection("answers").delete(answerId)
          }
          await apb.collection("applications").delete(createdRecords.applicationId)
        }
        catch (rollbackErr) {
          console.error(rollbackErr)
          return fail(400, {
            message: "A rollback error occurred"
          })
        }
      }

      if (err instanceof Error) {
        return fail(400, {
          message: err.message
        })
      }
      else {
        return fail(400, {
          message: "An unknown error occurred"
        })
      }
    }
  }
}
import { fail, redirect, isRedirect } from "@sveltejs/kit"
import { PUBLIC_PB_URL } from "$env/static/public"
import { env } from "$env/dynamic/private"
import Pocketbase from "pocketbase"
import type { AnswersResponse, ApplicationsResponse, QuestionsResponse, TypedPocketBase } from "$lib/pocketbase/pocketbase-types.js"

type ExpandedApplicationsResponse = ApplicationsResponse<{
  response: AnswersResponse<any, {
    question: QuestionsResponse
  }>[]
}>

export const actions = {
  async default({ params, request }) {

    let apb: TypedPocketBase | null = null

    try {
      const data = await request.formData();
      const applicationId = params.id
      const userId = data.get("userId") as string

      apb = new Pocketbase(PUBLIC_PB_URL) as TypedPocketBase
      await apb.admins.authWithPassword(env.PB_EMAIL, env.PB_PASSWORD)

      const application = await apb.collection("applications").getOne<ExpandedApplicationsResponse>(applicationId, {
        expand: "response,response.question"
      })
    
      if (application.responder !== userId) {
        return fail(400, { message: "Invalid user" })
      }

      if (!application.expand?.response) {
        return fail(400, { message: "Responses could not be fetched" })
      }

      if (!['draft', 'editsRequested'].includes(application.status)) {
        return fail(400, { message: "Invalid application status" })
      }

      const responses = application.expand.response

      if (responses.some(i => i.valid === false && i.expand?.question.type !== "info")) {
        return fail(400, { message: "Some responses are invalid" })
      }

      const updatedApplication = await apb.collection("applications").update(applicationId, {
        status: application.status == "editsRequested" ? "resubmitted" : "submitted"
      })

      return redirect(303, `/application/completed`)
    }

    catch (err) {
      if (isRedirect(err)) {
        return redirect(err.status, err.location)
      }

      if (err instanceof Error) {
        console.log(err)
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
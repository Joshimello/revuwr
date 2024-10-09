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
  async submit({ params, locals }) {
    try {
      const application = await locals.apb.collection("applications").getOne<ExpandedApplicationsResponse>(params.id, {
        expand: "response,response.question"
      })
    
      if (!locals.user || application.responder !== locals.user.id) {
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

      await locals.apb.collection("applications").update(params.id, {
        status: application.status == "editsRequested" ? "resubmitted" : "submitted"
      })

      // await locals.rs.emails.send({
      //   from: ''
      // })

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
  },
  async delete({ params, locals }) {
    try {
      const application = await locals.apb.collection("applications").getOne<ExpandedApplicationsResponse>(params.id, {
        expand: "response,response.question"
      })

      if (!locals.user || application.responder !== locals.user.id) {
        return fail(400, { message: "Invalid user" })
      }

      if (!application.expand?.response) {
        return fail(400, { message: "Responses could not be fetched" })
      }

      if (!['draft'].includes(application.status)) {
        return fail(400, { message: "Invalid application status" })
      }

      await locals.apb.collection("applications").delete(params.id)
      
      for (const response of application.expand.response) {
        await locals.apb.collection("answers").delete(response.id, {
          requestKey: response.id
        })
      }
      
      return redirect(303, `/`)
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
  },
  async withdraw({ params, locals }) {
    try {
      const apb = new Pocketbase(PUBLIC_PB_URL) as TypedPocketBase
      await apb.admins.authWithPassword(env.PB_EMAIL, env.PB_PASSWORD)

      const application = await apb.collection("applications").getOne(params.id)

      if (!locals.user || application.responder !== locals.user.id) {
        return fail(400, { message: "Invalid user" })
      }

      if (['draft', 'withdrawn'].includes(application.status)) {
        return fail(400, { message: "Invalid application status" })
      }

      await apb.collection("applications").update(params.id, {
        status: "withdrawn"
      })

      return redirect(303, `/`)
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
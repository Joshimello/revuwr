import { pb } from '$lib/pocketbase/client'
import { toast } from 'svelte-sonner'
import type { CreateUserDetails, ExpandedUsersResponse } from './types'

export let getAllUsers = async () => {
  try {
    const records = await pb.collection('users').getFullList<ExpandedUsersResponse>({
      expand: 'applications'
    })
    toast.success('Users loaded')
    return records
  }
  catch (err) {
    if (err instanceof Error) {
      toast.error(err.message)
    }
    else {
      toast.error("An error occurred")
    }
  }
}

export const createUser = async (details: CreateUserDetails, cb?: () => void) => {
  try {
    await pb.collection('users').create({
      username: details.userId,
      name: details.name,
      email: details.email,
      password: details.password,
      passwordConfirm: details.password,
      init: false
    })
    toast.success('User created')
    if (cb) cb()
  }
  catch (err) {
    if (err instanceof Error) {
      toast.error(err.message)
    }
    else {
      toast.error('Unknown error')
      console.error(err)
    }
  }
}

export let deleteUserAccount = async (userId: string, cb?: () => void) => {
  try {
    await pb.collection('users').delete(userId)
    toast.success('User account deleted')
    if (cb) cb()
  }
  catch (err) {
    if (err instanceof Error) {
      toast.error(err.message)
    }
    else {
      toast.error('Unknown error')
      console.error(err)
    }
  }
}

export let deleteUserAssociated = async (userId: string, cb?: () => void) => {
  try {
    const applications = await pb.collection('applications').getFullList({
      filter: `responder = "${userId}"`
    })
    for (let application of applications) {
      for (let answerId of application.response) {
        await pb.collection('answers').delete(answerId)
      }
      await pb.collection('applications').delete(application.id)
    }
    toast.success('User associated data deleted')
    if (cb) cb()
  }
  catch (err) {
    if (err instanceof Error) {
      toast.error(err.message)
    }
    else {
      toast.error('Unknown error')
      console.error(err)
    }
  }
}

export let deleteUserExsistance = async (userId: string, cb?: () => void) => {
  try {
    const applications = await pb.collection('applications').getFullList({
      filter: `responder = "${userId}"`
    })
    for (let application of applications) {
      for (let answerId of application.response) {
        await pb.collection('answers').delete(answerId)
      }
      await pb.collection('applications').delete(application.id)
    }

    await pb.collection('users').delete(userId)

    toast.success('User deleted')
    if (cb) cb()
  }
  catch (err) {
    if (err instanceof Error) {
      toast.error(err.message)
    }
    else {
      toast.error('Unknown error')
      console.error(err)
    }
  }
}
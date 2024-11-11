import { pb } from '$lib/pocketbase/client';
import { toast } from 'svelte-sonner';
import type { ExpandedApplication, ExpandedResponse } from './types';
import { application } from './stores';
import { page } from '$app/stores';
import { get } from 'svelte/store'

export const removeFile = async (id: string, file: string) => {
  try {
    const record = await pb.collection('files').update(id, {
      'file-': file
    })
    if (record.file.length === 0) {
      await pb.collection('files').delete(id);
    }
    return true;
  }
  catch (err) {
    if (err instanceof Error) {
      toast.error(err.message);
    }
    else {
      toast.error('Unknown error: remove file');
    }
    return false;
  }
}

export const createFiles = async (files: File[]) => {
  if (!get(page).data.user.id) {
    toast.error('User not found');
    return;
  }
  try {
    const promises = files.map(async file => 
      pb.collection('files').create({
        file: file,
        user: get(page).data.user.id
      })
    );
    const responses = await Promise.all(promises);
    return responses;
  }
  catch (err) {
    if (err instanceof Error) {
      toast.error(err.message);
    }
    else {
      toast.error('Unknown error: create files');
    }
  }
}

export const getApplication = async (id: string) => {
  try {
    const response = await pb.collection('applications').getOne<ExpandedApplication>(id, {
      expand: 'event,response,response.question'
    });
    return response;
  }
  catch (err) {
    if (err instanceof Error) {
      toast.error(err.message);
    }
    else {
      toast.error('Unknown error: get application');
    }
  }
}

export const updateAnswer = async (id: string, answer: any) => {
  try {
    const response = await pb.collection('answers').update<ExpandedResponse>(id, {
      response: answer,
      valid: true
    }, {
      expand: 'question'
    })
    application.update(application => {
      const answerIndex = application?.expand?.response.findIndex(a => a.id === id);
      if (answerIndex !== undefined && application && application.expand) {
        application.expand.response[answerIndex] = response;
        return application;
      }
      return application;
    });
    console.log('Answer updated');
    return [true, response];
  }
  catch (err) {
    if (err instanceof Error) {
      toast.error(err.message);
    }
    else {
      toast.error('Unknown error: update answer');
    }
    return [false, null];
  }
}
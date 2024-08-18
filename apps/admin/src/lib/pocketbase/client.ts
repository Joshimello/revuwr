import { PUBLIC_PB_URL } from '$env/static/public';
import PocketBase from 'pocketbase';
import { type TypedPocketBase } from './pocketbase-types';

export const pb = new PocketBase(PUBLIC_PB_URL) as TypedPocketBase;
export const pbImage = (collectionID: string, recordID: string, file: string) => {
  return `${PUBLIC_PB_URL}/api/files/${collectionID}/${recordID}/${file}`;
}
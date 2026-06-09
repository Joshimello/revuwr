import { PUBLIC_PB_URL } from '$env/static/public';
import PocketBase, { LocalAuthStore } from 'pocketbase';
import { type TypedPocketBase } from './pocketbase-types';

const customAuthStore = new LocalAuthStore('admin_auth');

export const pb = new PocketBase(PUBLIC_PB_URL, customAuthStore) as TypedPocketBase;

export const pbImage = (collectionID: string, recordID: string, file: string) => {
	return `${PUBLIC_PB_URL}/api/files/${collectionID}/${recordID}/${file}`;
};

import { PUBLIC_PB_URL } from '$env/static/public';
import PocketBase from 'pocketbase';
import { type TypedPocketBase } from './pocketbase-types';

const pb = new PocketBase(PUBLIC_PB_URL) as TypedPocketBase;
pb.autoCancellation(false);

const pbImage = (collectionID: string, recordID: string, file: string) => {
	return `${PUBLIC_PB_URL}/api/files/${collectionID}/${recordID}/${file}`;
};

export { pb, pbImage };

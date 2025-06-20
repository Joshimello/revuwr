import { pb } from '$lib/pocketbase/client';

export async function syncColleges() {
	try {
		const colleges = await pb.collection('colleges').getFullList();
		for (const college of colleges) {
			await pb.collection('colleges').delete(college.id);
		}
	} catch (err) {
		console.log(err);
		throw new Error('Failed to clear colleges');
	}

	try {
		const newColleges = await (await fetch('/api/colleges')).json();
		for (const college of newColleges) {
			await pb.collection('colleges').create(college);
		}
	} catch (err) {
		console.log(err);
		throw new Error('Failed to sync colleges');
	}
}

export async function addCollege(college: { en: string; zh: string }) {
	try {
		await pb.collection('colleges').create(college);
	} catch (err) {
		throw new Error('Failed to add college');
	}
}

export async function deleteCollege(id: string) {
	try {
		await pb.collection('colleges').delete(id);
	} catch (err) {
		throw new Error('Failed to delete college');
	}
}

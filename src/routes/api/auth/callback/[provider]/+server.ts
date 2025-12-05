import { dev } from '$app/environment';
import {
	NTHU_OAUTH_CLIENT_ID,
	NTHU_OAUTH_CLIENT_SECRET,
	PB_EMAIL,
	PB_PASSWORD
} from '$env/static/private';
import type { UsersResponse } from '$lib/pocketbase/pocketbase-types.js';
import { error, isRedirect, redirect, type RequestHandler } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

const getToken = async (code: string) => {
	if (dev) {
		return {
			access_token: 'uwu'
		};
	}

	const tokenBase = 'https://oauth.ccxp.nthu.edu.tw/v1.1/token.php';
	const client_id = NTHU_OAUTH_CLIENT_ID;
	const client_secret = NTHU_OAUTH_CLIENT_SECRET;
	const grant_type = 'authorization_code';
	const redirect_uri = 'https://fsga.et.nthu.edu.tw/api/auth/callback/nthu';

	const tokenResponse = await fetch(tokenBase, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			client_id,
			client_secret,
			grant_type,
			redirect_uri,
			code
		})
	});

	return await tokenResponse.json();
};

const getResource = async (access_token: string) => {
	if (dev) {
		return {
			success: true,
			uuid: 'uwu',
			inschool: true,
			userid: '111000777',
			name: '測試帳',
			name_en: 'DEV USER',
			email: 'joshualeanjw@gmail.com'
		};
	}

	const resourceBase = 'https://oauth.ccxp.nthu.edu.tw/v1.1/resource.php';

	const resourceResponse = await fetch(resourceBase, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			access_token
		})
	});

	return await resourceResponse.json();
	// success: boolean
	// uuid: string
	// inschool: boolean
	// userid: string
	// name: string
	// name_en: string
	// email: string
};

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	if (!code) return error(400, 'Missing code');

	const tokenData = await getToken(code);
	if (!tokenData.access_token) return error(400, 'Invalid code');

	const resourceData = await getResource(tokenData.access_token);
	if (!resourceData.success) return error(400, 'Invalid token');

	// Check if user is in school
	if (!resourceData.inschool) {
		return error(403, 'Access restricted to NTHU members only');
	}

	try {
		await locals.apb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
	} catch (err) {
		return error(500, 'Internal server error');
	}

	const tempPassword = nanoid();
	let user: UsersResponse | null = null;
	let isNewUser = false;

	try {
		user = await locals.apb.collection('users').getFirstListItem('1=1', {
			filter: `username = '${resourceData.userid}'`
		});
	} catch (err) {
		null;
	}

	if (!user) {
		isNewUser = true;
		try {
			await locals.apb.collection('users').create({
				username: resourceData.userid,
				email: resourceData.email,
				password: tempPassword,
				passwordConfirm: tempPassword,
				name: resourceData.name,
				nameEn: resourceData.name_en,
				init: false,
				emailVisibility: true
			});
		} catch (err) {
			return error(500, 'Internal server error');
		}
	} else {
		try {
			await locals.apb.collection('users').update(user.id, {
				email: resourceData.email,
				password: tempPassword,
				passwordConfirm: tempPassword,
				name: resourceData.name,
				nameEn: resourceData.name_en
			});
		} catch (err) {
			return error(500, 'Internal server error');
		}
	}

	try {
		await locals.pb.collection('users').authWithPassword(resourceData.userid, tempPassword);

		// If user is new or hasn't completed onboarding, redirect to onboard
		if (isNewUser || user?.init === false) {
			return redirect(302, '/onboard');
		}

		// Existing user - redirect to root
		return redirect(302, '/');
	} catch (err) {
		if (isRedirect(err)) {
			return redirect(err.status, err.location);
		}
		return error(500, 'Internal server error');
	}
};

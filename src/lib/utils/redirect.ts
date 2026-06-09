import { browser } from '$app/environment';
import { goto } from '$app/navigation';

const REDIRECT_KEY = 'redirectAfterLogin';

/**
 * Store the current URL to redirect to after login
 */
export function storeRedirectUrl(url: string): void {
	if (browser) {
		localStorage.setItem(REDIRECT_KEY, url);
	}
}

/**
 * Get and remove the stored redirect URL
 */
export function getAndClearRedirectUrl(): string | null {
	if (!browser) return null;

	const url = localStorage.getItem(REDIRECT_KEY);
	if (url) {
		localStorage.removeItem(REDIRECT_KEY);
	}
	return url;
}

/**
 * Check for stored redirect URL and navigate to it if found
 * Returns true if a redirect was performed
 */
export function handleStoredRedirect(): boolean {
	const redirectUrl = getAndClearRedirectUrl();
	if (redirectUrl) {
		goto(redirectUrl);
		return true;
	}
	return false;
}

/**
 * Store current URL and redirect to login
 */
export function redirectToLogin(currentUrl: string): void {
	storeRedirectUrl(currentUrl);
	window.location.href = '/api/auth/signin';
}

import type { APIRoute } from 'astro';

import { getGithubUser } from '../../../../lib/forum';
import { getGitHubCallbackUrl, getGitHubClientSecret } from '../../../../lib/providers';
import { clearSession, writeSession } from '../../../../lib/session';

const OAUTH_STATE_COOKIE = 'ltf_oauth_state';
const OAUTH_NEXT_COOKIE = 'ltf_oauth_next';

interface GitHubTokenResponse {
	access_token?: string;
	error?: string;
	error_description?: string;
}

function normalizeNextPath(value: string | undefined): string {
	if (!value) {
		return '/forum';
	}

	if (!value.startsWith('/') || value.startsWith('//')) {
		return '/forum';
	}

	return value;
}

function redirectWithError(request: Request, message: string): Response {
	const targetUrl = new URL('/login', request.url);
	targetUrl.searchParams.set('error', message);
	return Response.redirect(targetUrl.toString(), 302);
}

export const GET: APIRoute = async ({ params, request, cookies }) => {
	if (params.provider !== 'github') {
		return redirectWithError(request, 'unsupported_provider');
	}

	const callbackUrl = new URL(request.url);
	const oauthError = callbackUrl.searchParams.get('error');
	if (oauthError) {
		return redirectWithError(request, oauthError);
	}

	const code = callbackUrl.searchParams.get('code');
	const state = callbackUrl.searchParams.get('state');
	const expectedState = cookies.get(OAUTH_STATE_COOKIE)?.value;

	if (!code || !state || !expectedState || state !== expectedState) {
		return redirectWithError(request, 'invalid_state');
	}

	try {
		const clientId = import.meta.env.GITHUB_CLIENT_ID?.trim();
		if (!clientId) {
			throw new Error('Missing GITHUB_CLIENT_ID.');
		}

		const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				client_id: clientId,
				client_secret: getGitHubClientSecret(),
				code,
				redirect_uri: getGitHubCallbackUrl(request),
				state,
			}),
		});

		const tokenPayload = (await tokenResponse.json()) as GitHubTokenResponse;
		if (!tokenResponse.ok || tokenPayload.error || !tokenPayload.access_token) {
			const message = tokenPayload.error ?? tokenPayload.error_description ?? 'oauth_exchange_failed';
			return redirectWithError(request, message);
		}

		const user = await getGithubUser(tokenPayload.access_token);
		writeSession(cookies, {
			provider: 'github',
			accessToken: tokenPayload.access_token,
			user,
			createdAt: new Date().toISOString(),
		});

		cookies.delete(OAUTH_STATE_COOKIE, { path: '/' });

		const nextPath = normalizeNextPath(cookies.get(OAUTH_NEXT_COOKIE)?.value);
		cookies.delete(OAUTH_NEXT_COOKIE, { path: '/' });

		return Response.redirect(new URL(nextPath, request.url).toString(), 302);
	} catch {
		clearSession(cookies);
		return redirectWithError(request, 'login_failed');
	}
};

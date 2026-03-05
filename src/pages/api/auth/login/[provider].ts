import { randomBytes } from 'node:crypto';
import type { APIRoute } from 'astro';

import { json, normalizeError } from '../../../../lib/http';
import { buildGitHubAuthorizeUrl, getCommunityProviders } from '../../../../lib/providers';

const OAUTH_STATE_COOKIE = 'ltf_oauth_state';
const OAUTH_NEXT_COOKIE = 'ltf_oauth_next';

function normalizeNextPath(value: string | null): string | null {
	if (!value) {
		return null;
	}

	if (!value.startsWith('/')) {
		return null;
	}

	if (value.startsWith('//')) {
		return null;
	}

	return value;
}

export const GET: APIRoute = async ({ params, request, cookies }) => {
	try {
		const provider = params.provider;
		if (provider !== 'github') {
			return json({ error: 'Unsupported provider.' }, 404);
		}

		const providerConfig = getCommunityProviders().find((entry) => entry.id === 'github');
		if (!providerConfig?.enabled) {
			return json({ error: 'GitHub login is not configured.' }, 503);
		}

		const state = randomBytes(24).toString('hex');
		const nextPath = normalizeNextPath(new URL(request.url).searchParams.get('next'));

		cookies.set(OAUTH_STATE_COOKIE, state, {
			httpOnly: true,
			sameSite: 'lax',
			secure: import.meta.env.PROD,
			path: '/',
			maxAge: 60 * 10,
		});

		if (nextPath) {
			cookies.set(OAUTH_NEXT_COOKIE, nextPath, {
				httpOnly: true,
				sameSite: 'lax',
				secure: import.meta.env.PROD,
				path: '/',
				maxAge: 60 * 10,
			});
		}

		const authorizeUrl = buildGitHubAuthorizeUrl(request, state);
		return Response.redirect(authorizeUrl, 302);
	} catch (error) {
		return json(
			{
				error: normalizeError(error, 'Failed to initiate OAuth login.'),
			},
			500,
		);
	}
};

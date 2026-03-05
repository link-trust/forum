import type { AstroCookies } from 'astro';

import { getGithubUser, type ForumUser } from './forum';
import { readSession } from './session';

export interface AuthContext {
	token: string;
	user: ForumUser;
	provider: 'github';
	source: 'session' | 'bearer';
}

function getBearerToken(request: Request): string | null {
	const authorization = request.headers.get('authorization');
	if (!authorization) {
		return null;
	}

	const [scheme, token] = authorization.split(' ');
	if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
		return null;
	}

	const normalized = token.trim();
	if (!normalized) {
		return null;
	}

	return normalized;
}

export async function resolveAuth(request: Request, cookies: AstroCookies): Promise<AuthContext | null> {
	const bearerToken = getBearerToken(request);
	if (bearerToken) {
		const user = await getGithubUser(bearerToken);
		return {
			token: bearerToken,
			user,
			provider: 'github',
			source: 'bearer',
		};
	}

	const session = readSession(cookies);
	if (!session) {
		return null;
	}

	return {
		token: session.accessToken,
		user: session.user,
		provider: session.provider,
		source: 'session',
	};
}

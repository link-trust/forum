import type { APIRoute } from 'astro';

import { resolveAuth } from '../../../lib/auth';
import { json, normalizeError } from '../../../lib/http';

export const GET: APIRoute = async ({ request, cookies }) => {
	try {
		const auth = await resolveAuth(request, cookies);
		if (!auth) {
			return json(
				{
					authenticated: false,
				},
				401,
			);
		}

		return json({
			authenticated: true,
			provider: auth.provider,
			source: auth.source,
			user: auth.user,
		});
	} catch (error) {
		return json(
			{
				error: normalizeError(error, 'Failed to resolve identity.'),
			},
			500,
		);
	}
};

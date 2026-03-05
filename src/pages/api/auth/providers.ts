import type { APIRoute } from 'astro';

import { json, normalizeError } from '../../../lib/http';
import { getCommunityProviders } from '../../../lib/providers';

export const GET: APIRoute = async () => {
	try {
		const providers = getCommunityProviders();
		return json({ providers });
	} catch (error) {
		return json(
			{
				error: normalizeError(error, 'Failed to load providers.'),
			},
			500,
		);
	}
};

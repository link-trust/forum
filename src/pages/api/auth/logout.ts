import type { APIRoute } from 'astro';

import { clearSession } from '../../../lib/session';

function redirectHome(request: Request): Response {
	return Response.redirect(new URL('/', request.url).toString(), 302);
}

export const GET: APIRoute = async ({ request, cookies }) => {
	clearSession(cookies);
	return redirectHome(request);
};

export const POST: APIRoute = async ({ request, cookies }) => {
	clearSession(cookies);
	return redirectHome(request);
};

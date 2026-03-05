export function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
		},
	});
}

export function normalizeError(error: unknown, fallback: string): string {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	return fallback;
}

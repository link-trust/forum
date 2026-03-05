import type { APIRoute } from 'astro';

import { getTopic } from '../../../../lib/forum';
import { json, normalizeError } from '../../../../lib/http';

function parseTopicNumber(value: string | undefined): number | null {
	if (!value) {
		return null;
	}

	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return null;
	}

	return parsed;
}

export const GET: APIRoute = async ({ params }) => {
	const topicNumber = parseTopicNumber(params.number);
	if (!topicNumber) {
		return json({ error: 'Invalid topic number.' }, 400);
	}

	try {
		const topic = await getTopic(topicNumber);
		if (!topic) {
			return json({ error: 'Topic not found.' }, 404);
		}

		return json({ topic });
	} catch (error) {
		return json(
			{
				error: normalizeError(error, 'Failed to load topic.'),
			},
			500,
		);
	}
};

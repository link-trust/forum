import type { APIRoute } from 'astro';

import { resolveAuth } from '../../../../../lib/auth';
import { createComment, getTopic, listComments } from '../../../../../lib/forum';
import { json, normalizeError } from '../../../../../lib/http';

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

		const comments = await listComments(topicNumber);
		return json({ comments });
	} catch (error) {
		return json(
			{
				error: normalizeError(error, 'Failed to load comments.'),
			},
			500,
		);
	}
};

export const POST: APIRoute = async ({ params, request, cookies }) => {
	const topicNumber = parseTopicNumber(params.number);
	if (!topicNumber) {
		return json({ error: 'Invalid topic number.' }, 400);
	}

	try {
		const auth = await resolveAuth(request, cookies);
		if (!auth) {
			return json({ error: 'Login required.' }, 401);
		}

		const topic = await getTopic(topicNumber);
		if (!topic) {
			return json({ error: 'Topic not found.' }, 404);
		}

		const payload = (await request.json()) as {
			content?: string;
			agentName?: string;
		};

		const content = payload.content?.trim() ?? '';
		const agentName = payload.agentName?.trim() || null;
		if (content.length < 2 || content.length > 20000) {
			return json({ error: 'Comment length must be between 2 and 20000.' }, 400);
		}

		const comment = await createComment(auth.token, topicNumber, {
			content,
			agentName,
		});

		return json({ comment }, 201);
	} catch (error) {
		return json(
			{
				error: normalizeError(error, 'Failed to create comment.'),
			},
			500,
		);
	}
};

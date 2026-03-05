import type { APIRoute } from 'astro';

import { resolveAuth } from '../../../lib/auth';
import {
	createTopic,
	isForumCategory,
	listTopics,
	type ForumCategoryKey,
} from '../../../lib/forum';
import { json, normalizeError } from '../../../lib/http';

function parsePositiveInt(value: string | null, fallback: number): number {
	if (!value) {
		return fallback;
	}

	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return fallback;
	}

	return parsed;
}

function normalizeCategory(value: unknown): ForumCategoryKey {
	if (typeof value === 'string' && isForumCategory(value)) {
		return value;
	}

	return 'general';
}

export const GET: APIRoute = async ({ request }) => {
	try {
		const requestUrl = new URL(request.url);
		const categoryParam = requestUrl.searchParams.get('category');
		const category = isForumCategory(categoryParam) ? categoryParam : undefined;
		const page = parsePositiveInt(requestUrl.searchParams.get('page'), 1);
		const perPage = parsePositiveInt(requestUrl.searchParams.get('perPage'), 20);

		const topics = await listTopics({
			category,
			page,
			perPage,
		});

		return json(topics);
	} catch (error) {
		return json(
			{
				error: normalizeError(error, 'Failed to list topics.'),
			},
			500,
		);
	}
};

export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const auth = await resolveAuth(request, cookies);
		if (!auth) {
			return json({ error: 'Login required.' }, 401);
		}

		const payload = (await request.json()) as {
			title?: string;
			content?: string;
			category?: string;
			agentName?: string;
		};

		const title = payload.title?.trim() ?? '';
		const content = payload.content?.trim() ?? '';
		const category = normalizeCategory(payload.category);
		const agentName = payload.agentName?.trim() || null;

		if (title.length < 4 || title.length > 120) {
			return json({ error: 'Title length must be between 4 and 120.' }, 400);
		}

		if (content.length < 10 || content.length > 20000) {
			return json({ error: 'Content length must be between 10 and 20000.' }, 400);
		}

		const topic = await createTopic(auth.token, {
			title,
			content,
			category,
			agentName,
		});

		return json({ topic }, 201);
	} catch (error) {
		return json(
			{
				error: normalizeError(error, 'Failed to create topic.'),
			},
			500,
		);
	}
};

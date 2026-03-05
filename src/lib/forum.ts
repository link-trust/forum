const FORUM_METADATA_PATTERN = /^<!--\s*linktrust-forum\s+(.+?)\s*-->\s*/s;

export type ForumCategoryKey = 'general' | 'tech' | 'projects' | 'feedback';

export interface ForumCategory {
	key: ForumCategoryKey;
	name: string;
	description: string;
}

export interface ForumUser {
	id: number;
	login: string;
	name: string | null;
	avatarUrl: string;
	profileUrl: string;
}

export interface ForumTopic {
	number: number;
	title: string;
	content: string;
	excerpt: string;
	category: ForumCategoryKey;
	commentCount: number;
	state: 'open' | 'closed';
	createdAt: string;
	updatedAt: string;
	url: string;
	author: ForumUser;
	agentName: string | null;
}

export interface ForumComment {
	id: number;
	content: string;
	createdAt: string;
	updatedAt: string;
	url: string;
	author: ForumUser;
	agentName: string | null;
}

interface ForumMetadata {
	kind: 'topic' | 'comment';
	category?: ForumCategoryKey;
	agent?: string;
}

interface GitHubUser {
	id: number;
	login: string;
	name: string | null;
	avatar_url: string;
	html_url: string;
}

interface GitHubIssue {
	number: number;
	title: string;
	body: string | null;
	comments: number;
	state: 'open' | 'closed';
	created_at: string;
	updated_at: string;
	html_url: string;
	user: GitHubUser;
	pull_request?: unknown;
}

interface GitHubComment {
	id: number;
	body: string | null;
	created_at: string;
	updated_at: string;
	html_url: string;
	user: GitHubUser;
}

interface GitHubError {
	message?: string;
	error?: string;
	description?: string;
}

export const FORUM_CATEGORIES: ForumCategory[] = [
	{
		key: 'general',
		name: '综合讨论',
		description: '日常交流、社区公告、观点碰撞。',
	},
	{
		key: 'tech',
		name: '技术交流',
		description: '编程实践、工具链、工程方法。',
	},
	{
		key: 'projects',
		name: '项目展示',
		description: '发布作品、演示 Demo、协作邀约。',
	},
	{
		key: 'feedback',
		name: '反馈建议',
		description: '产品建议、流程改进、BUG 反馈。',
	},
];

const CATEGORY_BY_KEY = FORUM_CATEGORIES.reduce(
	(map, category) => {
		map[category.key] = category;
		return map;
	},
	{} as Record<ForumCategoryKey, ForumCategory>,
);

function getForumRepoConfig(): { owner: string; repo: string } {
	const owner = import.meta.env.GITHUB_FORUM_OWNER?.trim();
	const repo = import.meta.env.GITHUB_FORUM_REPO?.trim();

	if (!owner || !repo) {
		throw new Error('Missing GITHUB_FORUM_OWNER or GITHUB_FORUM_REPO environment variable.');
	}

	return { owner, repo };
}

function getReadToken(): string | undefined {
	const token = import.meta.env.GITHUB_FORUM_READ_TOKEN?.trim();
	if (!token) {
		return undefined;
	}
	return token;
}

function buildRepoApiPath(pathname: string): string {
	const { owner, repo } = getForumRepoConfig();
	return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${pathname}`;
}

function sanitizeAgentName(agentName: string | null | undefined): string | null {
	if (!agentName) {
		return null;
	}

	const normalized = agentName.trim().replace(/\s+/g, ' ');
	if (!normalized) {
		return null;
	}

	if (normalized.length > 64) {
		return normalized.slice(0, 64);
	}

	return normalized;
}

function buildMetadataBlock(metadata: ForumMetadata): string {
	return `<!-- linktrust-forum ${JSON.stringify(metadata)} -->`;
}

function parseMetadata(body: string | null): { metadata: ForumMetadata | null; content: string } {
	if (!body) {
		return {
			metadata: null,
			content: '',
		};
	}

	const match = body.match(FORUM_METADATA_PATTERN);
	if (!match?.[1]) {
		return {
			metadata: null,
			content: body.trim(),
		};
	}

	try {
		const metadata = JSON.parse(match[1]) as ForumMetadata;
		return {
			metadata,
			content: body.replace(FORUM_METADATA_PATTERN, '').trim(),
		};
	} catch {
		return {
			metadata: null,
			content: body.trim(),
		};
	}
}

function buildTopicBody(content: string, category: ForumCategoryKey, agentName?: string | null): string {
	const metadata: ForumMetadata = {
		kind: 'topic',
		category,
		agent: sanitizeAgentName(agentName),
	};

	return `${buildMetadataBlock(metadata)}\n\n${content.trim()}`;
}

function buildCommentBody(content: string, agentName?: string | null): string {
	const metadata: ForumMetadata = {
		kind: 'comment',
		agent: sanitizeAgentName(agentName),
	};

	return `${buildMetadataBlock(metadata)}\n\n${content.trim()}`;
}

function toForumUser(user: GitHubUser): ForumUser {
	return {
		id: user.id,
		login: user.login,
		name: user.name,
		avatarUrl: user.avatar_url,
		profileUrl: user.html_url,
	};
}

function buildExcerpt(content: string): string {
	const normalized = content.replace(/\s+/g, ' ').trim();
	if (normalized.length <= 160) {
		return normalized;
	}

	return `${normalized.slice(0, 157)}...`;
}

function toForumTopic(issue: GitHubIssue): ForumTopic | null {
	if (issue.pull_request) {
		return null;
	}

	const { metadata, content } = parseMetadata(issue.body);
	if (!metadata || metadata.kind !== 'topic') {
		return null;
	}

	const category = isForumCategory(metadata.category) ? metadata.category : 'general';
	const agentName = sanitizeAgentName(metadata.agent);

	return {
		number: issue.number,
		title: issue.title,
		content,
		excerpt: buildExcerpt(content),
		category,
		commentCount: issue.comments,
		state: issue.state,
		createdAt: issue.created_at,
		updatedAt: issue.updated_at,
		url: issue.html_url,
		author: toForumUser(issue.user),
		agentName,
	};
}

function toForumComment(comment: GitHubComment): ForumComment {
	const { metadata, content } = parseMetadata(comment.body);
	const agentName = metadata?.kind === 'comment' ? sanitizeAgentName(metadata.agent) : null;

	return {
		id: comment.id,
		content,
		createdAt: comment.created_at,
		updatedAt: comment.updated_at,
		url: comment.html_url,
		author: toForumUser(comment.user),
		agentName,
	};
}

async function githubRequest<T>(
	path: string,
	options: {
		method?: string;
		token?: string;
		body?: unknown;
	} = {},
): Promise<T> {
	const token = options.token ?? getReadToken();
	const headers: HeadersInit = {
		Accept: 'application/vnd.github+json',
		'Content-Type': 'application/json',
		'User-Agent': 'link-trust-forum',
		'X-GitHub-Api-Version': '2022-11-28',
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const response = await fetch(`https://api.github.com${path}`, {
		method: options.method ?? 'GET',
		headers,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});

	if (!response.ok) {
		let errorMessage = `GitHub API request failed with ${response.status}.`;

		try {
			const payload = (await response.json()) as GitHubError;
			if (payload.error) {
				errorMessage = payload.error;
			}
			if (payload.message) {
				errorMessage = payload.message;
			}
			if (payload.description) {
				errorMessage = `${errorMessage} ${payload.description}`;
			}
		} catch {
			const text = await response.text();
			if (text) {
				errorMessage = text;
			}
		}

		throw new Error(errorMessage);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
}

export function isForumCategory(value: string | null | undefined): value is ForumCategoryKey {
	if (!value) {
		return false;
	}

	return value in CATEGORY_BY_KEY;
}

export function getCategoryMeta(category: ForumCategoryKey): ForumCategory {
	return CATEGORY_BY_KEY[category];
}

export async function getGithubUser(accessToken: string): Promise<ForumUser> {
	const user = await githubRequest<GitHubUser>('/user', {
		token: accessToken,
	});

	return toForumUser(user);
}

export async function listTopics(options: {
	category?: ForumCategoryKey;
	page?: number;
	perPage?: number;
	token?: string;
} = {}): Promise<{
	topics: ForumTopic[];
	total: number;
	page: number;
	perPage: number;
	hasMore: boolean;
}> {
	const safePage = Number.isFinite(options.page) && options.page && options.page > 0 ? Math.floor(options.page) : 1;
	const safePerPageRaw = Number.isFinite(options.perPage) && options.perPage && options.perPage > 0 ? Math.floor(options.perPage) : 20;
	const safePerPage = Math.min(safePerPageRaw, 40);

	const query = new URLSearchParams({
		state: 'all',
		sort: 'updated',
		direction: 'desc',
		per_page: '100',
	});

	const issues = await githubRequest<GitHubIssue[]>(`${buildRepoApiPath('/issues')}?${query.toString()}`, {
		token: options.token,
	});

	const parsedTopics = issues
		.map((issue) => toForumTopic(issue))
		.filter((topic): topic is ForumTopic => topic !== null);

	const filtered = options.category
		? parsedTopics.filter((topic) => topic.category === options.category)
		: parsedTopics;

	const start = (safePage - 1) * safePerPage;
	const topics = filtered.slice(start, start + safePerPage);

	return {
		topics,
		total: filtered.length,
		page: safePage,
		perPage: safePerPage,
		hasMore: start + safePerPage < filtered.length,
	};
}

export async function getTopic(number: number, token?: string): Promise<ForumTopic | null> {
	const issue = await githubRequest<GitHubIssue>(`${buildRepoApiPath(`/issues/${number}`)}`, {
		token,
	});

	return toForumTopic(issue);
}

export async function listComments(topicNumber: number, token?: string): Promise<ForumComment[]> {
	const query = new URLSearchParams({
		per_page: '100',
		sort: 'created',
		direction: 'asc',
	});

	const comments = await githubRequest<GitHubComment[]>(`${buildRepoApiPath(`/issues/${topicNumber}/comments`)}?${query.toString()}`, {
		token,
	});

	return comments.map((comment) => toForumComment(comment));
}

export async function createTopic(
	accessToken: string,
	input: {
		title: string;
		content: string;
		category: ForumCategoryKey;
		agentName?: string | null;
	},
): Promise<ForumTopic> {
	const issue = await githubRequest<GitHubIssue>(buildRepoApiPath('/issues'), {
		method: 'POST',
		token: accessToken,
		body: {
			title: input.title.trim(),
			body: buildTopicBody(input.content, input.category, input.agentName),
		},
	});

	const topic = toForumTopic(issue);
	if (!topic) {
		throw new Error('Forum topic metadata missing after creation.');
	}

	return topic;
}

export async function createComment(
	accessToken: string,
	topicNumber: number,
	input: {
		content: string;
		agentName?: string | null;
	},
): Promise<ForumComment> {
	const comment = await githubRequest<GitHubComment>(buildRepoApiPath(`/issues/${topicNumber}/comments`), {
		method: 'POST',
		token: accessToken,
		body: {
			body: buildCommentBody(input.content, input.agentName),
		},
	});

	return toForumComment(comment);
}

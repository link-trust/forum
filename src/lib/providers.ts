export interface CommunityProvider {
	id: string;
	name: string;
	description: string;
	enabled: boolean;
	loginPath: string | null;
	priority: number;
}

export function getCommunityProviders(): CommunityProvider[] {
	const githubEnabled = Boolean(import.meta.env.GITHUB_CLIENT_ID && import.meta.env.GITHUB_CLIENT_SECRET);

	return [
		{
			id: 'github',
			name: 'GitHub',
			description: '优先接入，支持 OAuth 登录与 API Bearer 访问。',
			enabled: githubEnabled,
			loginPath: githubEnabled ? '/api/auth/login/github' : null,
			priority: 1,
		},
		{
			id: 'gitlab',
			name: 'GitLab',
			description: '预留接口，可按相同模式接入。',
			enabled: false,
			loginPath: null,
			priority: 2,
		},
		{
			id: 'discord',
			name: 'Discord',
			description: '预留社区账号接入能力。',
			enabled: false,
			loginPath: null,
			priority: 3,
		},
		{
			id: 'x',
			name: 'X / Twitter',
			description: '预留 OAuth 入口。',
			enabled: false,
			loginPath: null,
			priority: 4,
		},
	].sort((a, b) => a.priority - b.priority);
}

export function getGitHubCallbackUrl(request: Request): string {
	const configuredCallback = import.meta.env.GITHUB_OAUTH_CALLBACK_URL?.trim();
	if (configuredCallback) {
		return configuredCallback;
	}

	const publicBaseUrl = import.meta.env.PUBLIC_FORUM_BASE_URL?.trim();
	if (publicBaseUrl) {
		return `${publicBaseUrl.replace(/\/$/, '')}/api/auth/callback/github`;
	}

	const requestUrl = new URL(request.url);
	return `${requestUrl.origin}/api/auth/callback/github`;
}

export function buildGitHubAuthorizeUrl(request: Request, state: string): string {
	const clientId = import.meta.env.GITHUB_CLIENT_ID?.trim();
	if (!clientId) {
		throw new Error('Missing GITHUB_CLIENT_ID.');
	}

	const query = new URLSearchParams({
		client_id: clientId,
		redirect_uri: getGitHubCallbackUrl(request),
		scope: 'read:user user:email public_repo',
		state,
	});

	return `https://github.com/login/oauth/authorize?${query.toString()}`;
}

export function getGitHubClientSecret(): string {
	const clientSecret = import.meta.env.GITHUB_CLIENT_SECRET?.trim();
	if (!clientSecret) {
		throw new Error('Missing GITHUB_CLIENT_SECRET.');
	}

	return clientSecret;
}

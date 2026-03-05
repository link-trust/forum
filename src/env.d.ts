/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly GITHUB_FORUM_OWNER?: string;
	readonly GITHUB_FORUM_REPO?: string;
	readonly GITHUB_FORUM_READ_TOKEN?: string;
	readonly GITHUB_CLIENT_ID?: string;
	readonly GITHUB_CLIENT_SECRET?: string;
	readonly GITHUB_OAUTH_CALLBACK_URL?: string;
	readonly PUBLIC_FORUM_BASE_URL?: string;
	readonly SESSION_SECRET?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

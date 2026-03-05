import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';

import type { ForumUser } from './forum';

const SESSION_COOKIE = 'ltf_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export interface SessionData {
	provider: 'github';
	accessToken: string;
	user: ForumUser;
	createdAt: string;
}

function getSessionSecret(): string {
	const secret = import.meta.env.SESSION_SECRET?.trim();
	if (!secret || secret.length < 32) {
		throw new Error('SESSION_SECRET must be set and contain at least 32 characters.');
	}

	return secret;
}

function sign(payload: string): string {
	return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

function safeCompare(value: string, expected: string): boolean {
	const left = Buffer.from(value);
	const right = Buffer.from(expected);

	if (left.length !== right.length) {
		return false;
	}

	return timingSafeEqual(left, right);
}

function encodeSession(data: SessionData): string {
	const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
	const signature = sign(payload);
	return `${payload}.${signature}`;
}

function decodeSession(value: string): SessionData | null {
	const [payload, signature] = value.split('.');
	if (!payload || !signature) {
		return null;
	}

	const expected = sign(payload);
	if (!safeCompare(signature, expected)) {
		return null;
	}

	try {
		const raw = Buffer.from(payload, 'base64url').toString('utf-8');
		const session = JSON.parse(raw) as SessionData;
		if (!session?.accessToken || !session?.user?.login) {
			return null;
		}

		return session;
	} catch {
		return null;
	}
}

export function readSession(cookies: AstroCookies): SessionData | null {
	try {
		const cookie = cookies.get(SESSION_COOKIE)?.value;
		if (!cookie) {
			return null;
		}

		return decodeSession(cookie);
	} catch {
		return null;
	}
}

export function writeSession(cookies: AstroCookies, data: SessionData): void {
	const encoded = encodeSession(data);
	cookies.set(SESSION_COOKIE, encoded, {
		httpOnly: true,
		sameSite: 'lax',
		secure: import.meta.env.PROD,
		path: '/',
		maxAge: SESSION_MAX_AGE_SECONDS,
	});
}

export function clearSession(cookies: AstroCookies): void {
	cookies.delete(SESSION_COOKIE, {
		path: '/',
	});
}

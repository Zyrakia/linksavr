import { command, form } from '$app/server';
import z from 'zod';
import { LinkService } from '$lib/server/services/link-service';
import { unwrapOrDomain } from '$lib/utils/service';
import { error } from '@sveltejs/kit';

export const createLink = command(z.object({ url: z.string() }), async ({ url }) => {
	const result = await LinkService.create(url);
	const [link] = unwrapOrDomain(result, (msg) => error(401, msg));

	return link;
});

export const createLinks = command(z.object({ urls: z.array(z.string()) }), async ({ urls }) => {
	const result = await LinkService.create(...urls);
	return unwrapOrDomain(result, (msg) => error(401, msg));
});

const normalizeId = (raw: unknown) => {
	if (Array.isArray(raw)) return normalizeId(raw[0]);
	if (typeof raw === 'string' || typeof raw === 'number') return Number(raw);
	return Number.NaN;
};

export const pollLinkStatus = command(z.object({ ids: z.array(z.number()) }), async ({ ids }) => {
	if (!ids.length) return [];

	const result = await LinkService.pollStatus(ids);
	return unwrapOrDomain(result, (msg) => error(500, msg));
});

export const deleteLink = form(z.object({ id: z.string() }), async ({ id }) => {
	const idValue = normalizeId(id);
	if (!Number.isFinite(idValue)) error(400, 'Invalid link id');

	const result = await LinkService.delete(idValue);
	return unwrapOrDomain(result, (msg) => error(404, msg));
});

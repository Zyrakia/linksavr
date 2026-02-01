import { command } from '$app/server';
import z from 'zod';
import { LinkService } from '$lib/server/services/link-service';
import { unwrapOrDomain } from '$lib/utils/service';
import { error } from '@sveltejs/kit';

export const createLink = command(
	z.object({
		url: z.url('Must be a URL'),
	}),
	async ({ url }) => {
		const result = await LinkService.create(url);
		const [link] = unwrapOrDomain(result, (msg) => error(401, msg));

		return link;
	},
);

export const createLinks = command(
	z.object({ urls: z.array(z.url('Must be a URL')) }),
	async ({ urls }) => {
		const result = await LinkService.create(...urls);
		return unwrapOrDomain(result, (msg) => error(401, msg));
	},
);

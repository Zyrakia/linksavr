import { command } from '$app/server';
import z from 'zod';
import { LinkService } from '$lib/server/services/link-service';
import { unwrapOrDomain } from '$lib/utils/service';

export const createLink = command(
	z.object({
		url: z.url('Must be a URL'),
	}),
	async ({ url }) => {
		const result = await LinkService.create(url);
		return unwrapOrDomain(result, (error) => ({ error }));
	},
);

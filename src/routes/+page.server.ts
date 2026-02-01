import { LinkService } from '$lib/server/services/link-service';
import z from 'zod';
import type { PageServerLoad } from './$types';
import { zodPruneParams } from '$lib/utils/zod-prune';
import { error } from '@sveltejs/kit';
import { DomainError } from '$lib/utils/service';

const QuerySchema = z.object({
	limit: z.number().min(1).max(100),
	offset: z.number().nonnegative(),
});

export const load: PageServerLoad = async ({ url, depends }) => {
	depends('change:links');

	const query = zodPruneParams(QuerySchema, url.searchParams);
	const linksRes = await LinkService.paginate(query.limit || 25, query.offset || 0);
	if (linksRes.isErr()) {
		if (DomainError.is(linksRes.error)) error(401, linksRes.error.message);
		else error(500, linksRes.error);
	}

	return { links: linksRes.value };
};

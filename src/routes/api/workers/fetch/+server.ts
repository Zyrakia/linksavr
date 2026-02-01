import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { runFetchWorker } from '$lib/server/workers/fetch-worker';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const id = body && typeof body.id === 'number' ? body.id : undefined;

	const result = await runFetchWorker(id);

	if (result.isErr()) return json({ error: result.error.message }, { status: 500 });

	return json(result.value);
};

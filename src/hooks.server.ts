import { dev } from '$app/environment';
import { runEmbedWorker } from '$lib/server/workers/embed-worker';
import { runFetchWorker } from '$lib/server/workers/fetch-worker';

const POLL_INTERVAL = 5_000;

if (dev) {
	let fetching = false;
	let embedding = false;

	setInterval(async () => {
		if (fetching) return;
		fetching = true;

		const res = await runFetchWorker();
		if (res.isOk() && res.value.id) {
			console.log(`[fetch-worker] Processed link ${res.value.id}`);
		} else if (res.isErr()) {
			console.warn(`[fetch-worker] ${res.error.message}`);
		}

		fetching = false;
	}, POLL_INTERVAL);

	setInterval(async () => {
		if (embedding) return;
		embedding = true;

		const res = await runEmbedWorker();
		if (res.isOk() && res.value.id) {
			console.log(`[embed-worker] Processed link ${res.value.id}`);
		} else if (res.isErr()) {
			console.warn(`[embed-worker] ${res.error.message}`);
		}

		embedding = false;
	}, POLL_INTERVAL);
}

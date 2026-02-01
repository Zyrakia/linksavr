import { dev } from '$app/environment';
import { runFetchWorker } from '$lib/server/workers/fetch-worker';

const POLL_INTERVAL = 5_000;

if (dev) {
	let running = false;

	setInterval(async () => {
		if (running) return;
		running = true;

		try {
			const result = await runFetchWorker();
			if (result.isOk() && result.value.id) {
				console.log(`[fetch-worker] processed link ${result.value.id}`);
			}

			if (result.isErr()) {
				console.warn(`[fetch-worker] ${result.error.message}`);
			}
		} finally {
			running = false;
		}
	}, POLL_INTERVAL);
}

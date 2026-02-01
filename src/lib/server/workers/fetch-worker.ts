import { chromium, type Browser } from 'playwright';
import TurndownService from 'turndown';
import { createHash } from 'node:crypto';
import { Ok, Err, type Result } from 'ts-results-es';
import { LinkService } from '$lib/server/services/link-service';
import { LinkQueueService } from '$lib/server/services/link-queue.service';

let browser: Browser | null = null;

async function getBrowser() {
	if (!browser || !browser.isConnected()) {
		browser = await chromium.launch({ headless: true });
	}

	return browser;
}

interface FetchResult {
	title: string;
	faviconUrl: string | null;
	markdown: string;
}

async function fetchPage(url: string): Promise<FetchResult> {
	const b = await getBrowser();
	const page = await b.newPage();

	try {
		await page.goto(url, { timeout: 15_000, waitUntil: 'domcontentloaded' });

		const title = await page.title();

		const faviconUrl = await page.evaluate(() => {
			const el = document.querySelector<HTMLLinkElement>('link[rel*="icon"]');
			if (!el?.href) return null;
			try {
				return new URL(el.href, window.location.origin).href;
			} catch {
				return null;
			}
		});

		const bodyHtml = await page.evaluate(() => document.body.innerHTML);

		const td = new TurndownService({ headingStyle: 'atx' });
		const markdown = td.turndown(bodyHtml);

		if (!markdown.trim()) throw new Error('No content extracted');

		return { title, faviconUrl, markdown };
	} finally {
		await page.close();
	}
}

function hashContent(content: string) {
	return createHash('sha256').update(content).digest('hex');
}

export interface WorkerResult {
	id?: number;
}

async function claimLink(id?: number) {
	return await (id === undefined
		? LinkQueueService.claimNextFetch()
		: LinkQueueService.claimFetchById(id));
}

/**
 * Runs the fetch worker. Claims a pending link (or a specific one by ID),
 * renders it with Playwright, converts to markdown, and updates the DB.
 */
export async function runFetchWorker(id?: number): Promise<Result<WorkerResult, Error>> {
	let linkId: number | undefined;

	try {
		const claimRes = await claimLink(id);
		if (claimRes.isErr()) return claimRes;

		const link = claimRes.value;
		if (!link) {
			if (id !== undefined) return Err(new Error(`Link ${id} not found`));
			return Ok({}); // nothing to process
		}

		linkId = link.id;

		const { title, faviconUrl, markdown } = await fetchPage(link.href);
		const contentHash = hashContent(markdown);

		const updateRes = await LinkService.update(linkId, { title, faviconUrl });
		if (updateRes.isErr()) return updateRes;

		const markRes = await LinkQueueService.markFetched(linkId, markdown, contentHash);
		if (markRes.isErr()) return markRes;

		return Ok({ id: linkId });
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));

		if (linkId) await LinkQueueService.markFailure(linkId, 'fetch', error.message);
		return Err(error);
	}
}

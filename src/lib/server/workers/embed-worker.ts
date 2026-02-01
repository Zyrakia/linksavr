import { type Result, Err, Ok } from 'ts-results-es';
import { LinkQueueService } from '../services/link-queue.service';
import { EmbeddingService, EMBEDDING_MAX_INPUT } from '../services/embedding-service';

export interface WorkerResult {
	id?: number;
}

/**
 * Splits content into chunks of at most `maxLen` characters,
 * breaking at double-newline paragraph boundaries.
 */
function chunkContent(content: string, maxLen: number = EMBEDDING_MAX_INPUT): string[] {
	if (content.length <= maxLen) return [content];

	const chunks: string[] = [];
	let buffer = '';

	for (const para of content.split(/\n\n+/)) {
		const candidate = buffer ? buffer + '\n\n' + para : para;

		if (candidate.length > maxLen) {
			if (buffer) chunks.push(buffer);
			// If a single paragraph exceeds maxLen, hard-split it
			for (let i = 0; i < para.length; i += maxLen) {
				chunks.push(para.slice(i, i + maxLen));
			}
			buffer = '';
		} else {
			buffer = candidate;
		}
	}

	if (buffer) chunks.push(buffer);
	return chunks;
}

async function claimLink(id?: number) {
	return await (id === undefined
		? LinkQueueService.claimNextEmbed()
		: LinkQueueService.claimEmbedById(id));
}

/**
 * Runs the embed worker. Claims a pending link (or a specific one by ID),
 * chunks its content, generates embeddings, and stores the chunks.
 */
export async function runEmbedWorker(id?: number): Promise<Result<WorkerResult, Error>> {
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

		const content = link.content;
		if (!content) return Err(new Error(`Link ${link.id} has no content to embed`));

		const chunkTexts = chunkContent(content);

		const embeddingsRes = await EmbeddingService.generateMany(...chunkTexts);
		if (embeddingsRes.isErr()) {
			await LinkQueueService.markFailure(link.id, 'embed', embeddingsRes.error.message);
			return embeddingsRes;
		}

		const embeddings = embeddingsRes.value;
		const chunks = chunkTexts.map((text, i) => ({
			content: text,
			embedding: embeddings[i]!,
		}));

		const markRes = await LinkQueueService.markEmbedded(link.id, chunks);
		if (markRes.isErr()) return markRes;

		return Ok({ id: link.id });
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));

		if (linkId) await LinkQueueService.markFailure(linkId, 'embed', error.message);
		return Err(error);
	}
}

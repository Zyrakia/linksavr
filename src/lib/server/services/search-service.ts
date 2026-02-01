import { createService } from '$lib/utils/service';
import { db } from '$lib/server/db/db';
import { EmbeddingService } from '$lib/server/services/embedding-service';
import { LinkEmbeddingChunksTable } from '$lib/server/db/schema';
import { eq, getTableColumns, sql } from 'drizzle-orm';
import { Ok, Result } from 'ts-results-es';
import { sqlizeVector } from '$lib/server/utils/sql-vectors';
import type { DatabaseEmbeddingChunk, LinkListItem } from '../db/types';
import { streamWords } from '$lib/utils/generators';

export type SearchResult = {
	link: LinkListItem;
	snippets: string[];
};

/**
 * Finds a snippet with a matching word from a list of lowercase words.
 */
const findSnippet = (words: Set<string>, content: string, range = 30): string | undefined => {
	for (const { word, startIndex } of streamWords(content)) {
		if (!words.has(word.trim().toLowerCase())) continue;

		const snippetStart = Math.max(0, startIndex - range);
		const snippetEnd = Math.min(content.length - 1, startIndex + word.length + range);
		const snippet = content.slice(snippetStart, snippetEnd + 1);

		return snippet;
	}
};

export const SearchService = createService(db, {
	similaritySearchByContent: async (
		client,
		query: string,
		topK: number = 5,
	): Promise<Result<SearchResult[], Error>> => {
		const queryWords = new Set(
			query
				.split(' ')
				.map((v) => v.toLowerCase().trim())
				.filter((v) => !!v),
		);

		const embedding = (await EmbeddingService.generate(query)).unwrap();
		const embeddingVector = sqlizeVector(embedding);

		const topKChunks = await client
			.select({ ...getTableColumns(LinkEmbeddingChunksTable) })
			.from(
				sql`vector_top_k('chunk_embedding_vector_idx', ${embeddingVector}, ${topK}) as vec_res`,
			)
			.innerJoin(LinkEmbeddingChunksTable, eq(LinkEmbeddingChunksTable.id, sql`vec_res.id`));

		type LinkFrequency = {
			linkId: number;
			references: { chunk: DatabaseEmbeddingChunk; snippet?: string }[];
		};

		const rankedLinks = topKChunks.reduce((acc, chunk) => {
			const entry: LinkFrequency['references'][number] = {
				chunk,
				snippet: findSnippet(queryWords, chunk.content),
			};

			const existing = acc.find((v) => v.linkId === chunk.linkId);
			if (existing) existing.references.push(entry);
			else acc.push({ linkId: chunk.linkId, references: [entry] });

			return acc;
		}, [] as LinkFrequency[]);

		if (rankedLinks.length === 0) return Ok([]);
		const rankedLinkIds = rankedLinks.map(({ linkId }) => linkId);

		const linksRes = await client.query.LinksTable.findMany({
			columns: { content: false, contentHash: false },
			where: (t, { inArray }) => inArray(t.id, rankedLinkIds),
		});

		return Ok(
			rankedLinks.flatMap(({ linkId, references }) => {
				const link = linksRes.find((l) => l.id === linkId);
				if (!link) return [];

				const snippets = references
					.map(({ snippet }) => snippet)
					.filter((v): v is string => !!v);

				return [{ link, snippets }];
			}),
		);
	},
});

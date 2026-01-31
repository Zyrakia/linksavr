import { createService } from '$lib/utils/service';
import { db } from '$lib/server/db/db';
import { EmbeddingService } from '$lib/server/services/embedding-service';
import { LinksTable } from '$lib/server/db/schema';
import { getTableColumns, sql } from 'drizzle-orm';
import { Ok } from 'ts-results-es';
import { sqlizeVector } from '$lib/server/utils/sql-vectors';

export const SearchService = createService(db, {
	similaritySearchByContent: async (client, query: string, topK: number = 5) => {
		const embedding = (await EmbeddingService.generate(query)).unwrap();
		const embeddingVector = sqlizeVector(embedding);

		const res = await client
			.select({
				...getTableColumns(LinksTable),
				distanceFromQuery: sql<number>`distance`,
			})
			.from(sql`vector_top_k('link_embedding_vector_idx', ${embeddingVector}, ${topK})`)
			.leftJoin(LinksTable, sql`${LinksTable.id} = id`);

		return Ok(res);
	},
});

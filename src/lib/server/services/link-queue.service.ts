import { createService, DomainError } from '$lib/utils/service';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/db';
import { LinksTable } from '../db/schema';
import { Ok, Err } from 'ts-results-es';

export const LinkQueueService = createService(db, {
	/**
	 * Claims the next link pending fetch for processing.
	 */
	claimNextFetch: async (client) => {
		const [claimed] = await client
			.update(LinksTable)
			.set({ status: 'fetching' })
			.where(
				sql`${LinksTable.id} = (
                        select ${LinksTable.id}
                        from ${LinksTable}
                        where ${LinksTable.status} = 'pending_fetch'
                        and ${LinksTable.retryCount} < ${LinksTable.maxRetries}
                        order by ${LinksTable.createdAt}
                        limit 1
                    )`,
			)
			.returning();

		return Ok(claimed);
	},

	/**
	 * Claims a specific link by ID, setting its status to 'fetching'.
	 */
	claimFetchById: async (client, id: number) => {
		const [claimed] = await client
			.update(LinksTable)
			.set({ status: 'fetching' })
			.where(eq(LinksTable.id, id))
			.returning();

		return Ok(claimed);
	},

	/**
	 * Claims the next link pending embedding for processing.
	 */
	claimNextEmbed: async (client) => {
		const [claimed] = await client
			.update(LinksTable)
			.set({ status: 'embedding' })
			.where(
				sql`${LinksTable.id} = (
                        select ${LinksTable.id}
                        from ${LinksTable}
                        where ${LinksTable.status} = 'pending_embed'
                        and ${LinksTable.retryCount} < ${LinksTable.maxRetries}
                        order by ${LinksTable.createdAt}
                        limit 1
                    )`,
			)
			.returning();

		return Ok(claimed);
	},

	/**
	 * Marks fetch step success.
	 */
	markFetched: async (client, id: number, content: string, contentHash: string) => {
		const res = await client
			.update(LinksTable)
			.set({
				content,
				contentHash,
				fetchedAt: new Date(),
				status: 'pending_embed',
			})
			.where(eq(LinksTable.id, id));

		if (res.rowsAffected === 0)
			return Err(DomainError.of(`Unable to update fetch step for link: ${id}`));

		return Ok(undefined);
	},

	/**
	 * Marks embedding step success.
	 */
	markEmbedded: async (client, id: number, embedding: number[]) => {
		const res = await client
			.update(LinksTable)
			.set({
				embedding,
				embeddedAt: new Date(),
				status: 'success',
			})
			.where(eq(LinksTable.id, id));

		if (res.rowsAffected === 0)
			return Err(DomainError.of(`Unable to update embedding step for link: ${id}`));

		return Ok(undefined);
	},

	/**
	 * Records a processing failure and sets the next status.
	 */
	markFailure: async (client, id: number, step: 'fetch' | 'embed', errorMessage: string) => {
		const [link] = await client
			.select({ retryCount: LinksTable.retryCount, maxRetries: LinksTable.maxRetries })
			.from(LinksTable)
			.where(eq(LinksTable.id, id));

		if (!link) return Err(DomainError.of(`Unable to locate link for failure: ${id}`));

		const retryCount = link.retryCount + 1;
		const isExhausted = retryCount >= link.maxRetries;
		const status = isExhausted
			? 'failed'
			: step === 'fetch'
				? 'pending_fetch'
				: 'pending_embed';

		await client
			.update(LinksTable)
			.set({ retryCount, status, statusText: errorMessage })
			.where(eq(LinksTable.id, id));

		return Ok(undefined);
	},
});

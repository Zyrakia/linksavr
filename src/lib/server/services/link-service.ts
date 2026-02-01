import { createService, DomainError } from '$lib/utils/service';
import { db } from '$lib/server/db/db';
import { Err, Ok } from 'ts-results-es';
import { LinksTable } from '$lib/server/db/schema';
import type { DatabaseLink } from '$lib/server/db/types';
import { pickUrlComponents } from '$lib/utils/url';
import { eq } from 'drizzle-orm';

export const LinkService = createService(db, {
	/**
	 * Creates a link from a URL and queues it into
	 * the processing pipeline. Can be multiple links at once.
	 *
	 * @param url the URLs to be processed
	 * @return the created link entry, will be in the processing state
	 */
	create: async (client, ...urls: string[]) => {
		const rowPromises = urls.map(async (url) => {
			const parts = pickUrlComponents(url, 'href', 'hostname');
			if (!parts) throw DomainError.of('Invalid URL');

			const exists = await client.query.LinksTable.findFirst({
				columns: { id: true },
				where: (t, { eq }) => eq(t.href, parts.href),
			});

			if (exists) throw DomainError.of(`${parts.href} is a duplicate`);

			return {
				href: parts.href,
				title: parts.hostname,
			} satisfies typeof LinksTable.$inferInsert;
		});

		const rows = await Promise.all(rowPromises);
		const inserted = await client.insert(LinksTable).values(rows).returning();

		return Ok(inserted);
	},

	/**
	 * Deletes a link by it's ID.
	 *
	 * @param id the ID of the link
	 */
	delete: async (client, id: number) => {
		const res = await client.delete(LinksTable).where(eq(LinksTable.id, id));
		if (res.rowsAffected === 0)
			return Err(DomainError.of(`Unable to delete link by ID: ${id}`));

		return Ok(undefined);
	},

	/**
	 * Updates a link by it's ID.
	 *
	 * @param id the ID of the link
	 * @param partial the properties to update on the link
	 */
	update: async (
		client,
		id: number,
		partial: Partial<Omit<DatabaseLink, 'createdAt' | 'id'>>,
	) => {
		const res = await client.update(LinksTable).set(partial).where(eq(LinksTable.id, id));
		if (res.rowsAffected === 0)
			return Err(DomainError.of(`Unable to update link by ID: ${id}`));

		return Ok(undefined);
	},

	/**
	 * Paginates through links by their created date in
	 * descending order, optionally filtering by a title prefix.
	 */
	paginate: async (client, limit: number, offset: number, startsWith?: string) => {
		const res = await client.query.LinksTable.findMany({
			limit,
			offset,
			columns: { content: false, contentHash: false },
			orderBy: (t, { desc }) => desc(t.createdAt),
			where: startsWith ? (t, { like }) => like(t.title, `%${startsWith}`) : undefined,
		});

		return Ok(res);
	},
});

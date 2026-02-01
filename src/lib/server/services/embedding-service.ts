import { embed, embedMany } from 'ai';
import { env } from '$lib/server/env';
import { createMistral } from '@ai-sdk/mistral';
import { createService, DomainError } from '$lib/utils/service';
import { Ok } from 'ts-results-es';

const modelProvider = createMistral({ apiKey: env.MISTRAL_API_KEY });
const embeddingModel = modelProvider.embedding('mistral-embed');

export const EMBEDDING_MAX_INPUT = 8000;

const assertWithinInputLimit = (value: string) => {
	if (value.length > EMBEDDING_MAX_INPUT) {
		throw DomainError.of(
			`Input exceeds max embedding length (${value.length}/${EMBEDDING_MAX_INPUT}).`,
		);
	}
};

export const EmbeddingService = createService(embeddingModel, {
	/**
	 * Generates an embedding for a single text value.
	 *
	 * @param value the text to embed
	 */
	generate: async (model, value: string) => {
		assertWithinInputLimit(value);

		const { embedding } = await embed({ model, value: value });
		return Ok(embedding);
	},

	/**
	 * Generates embeddings for multiple text values.
	 *
	 * @param values the texts to embed
	 */
	generateMany: async (model, ...values: string[]) => {
		values.forEach(assertWithinInputLimit);

		const { embeddings } = await embedMany({ model, values });
		return Ok(embeddings);
	},
});

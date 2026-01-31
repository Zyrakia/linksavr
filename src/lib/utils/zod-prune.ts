import type z from 'zod';

/**
 * Validates each field in a Zod object schema and returns only valid values.
 */
export function zodPrune<T extends z.ZodObject<any>>(schema: T, data: any) {
	const shape = schema.shape;
	const source = typeof data === 'object' ? (data as Record<string, unknown>) : {};
	const output: Record<string, unknown> = {};

	for (const key in shape) {
		const schema = shape[key] as z.ZodType;

		const { success, data } = schema.safeParse(source[key]);
		if (success) output[key] = data;
	}

	return output as Partial<z.infer<T>>;
}

/**
 * Prunes URLSearchParams using a Zod object schema.
 */
export function zodPruneParams<T extends z.ZodObject<any>>(schema: T, data: URLSearchParams) {
	return zodPrune(schema, Object.fromEntries(data.entries()));
}

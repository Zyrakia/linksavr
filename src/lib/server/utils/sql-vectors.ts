import { sql } from 'drizzle-orm';

export function sqlizeVector(vector: number[]) {
	return sql<Buffer>`vector32(${JSON.stringify(vector)})`;
}

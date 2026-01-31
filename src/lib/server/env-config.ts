import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

function applyEnvFile(filePath: string) {
	if (!fs.existsSync(filePath)) return;
	dotenv.config({ path: filePath });
}

export function loadEnvConfig() {
	const mode = process.env.NODE_ENV ?? 'development';
	const basePath = path.resolve(process.cwd(), '.env');
	const envFiles = [
		basePath,
		`${basePath}.local`,
		`${basePath}.${mode}`,
		`${basePath}.${mode}.local`,
	];

	for (const filePath of envFiles) {
		applyEnvFile(filePath);
	}
}

loadEnvConfig();

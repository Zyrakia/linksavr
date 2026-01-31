import './env-config';

import { createEnv } from '@t3-oss/env-core';
import z from 'zod';

export const env = createEnv({
	server: {
		DB_FILENAME: z.string().transform((value) => (value.startsWith('file:') ? value : `file:${value}`)),
		MISTRAL_API_KEY: z.string(),
	},
	client: {},
	clientPrefix: 'PUBLIC_',
	runtimeEnv: process.env,
	isServer: typeof window === 'undefined',
});

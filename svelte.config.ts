import adapter from '@sveltejs/adapter-node';
import { Config } from '@sveltejs/kit';

const config: Config = {
	compilerOptions: { runes: true },
	kit: {
		experimental: { remoteFunctions: true },
		adapter: adapter(),
	},
};

export default config;

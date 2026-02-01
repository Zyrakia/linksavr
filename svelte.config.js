import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: { runes: true },
	kit: {
		experimental: { remoteFunctions: true },
		adapter: adapter(),
	},
};

export default config;

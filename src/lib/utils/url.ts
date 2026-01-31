type URLStringKeys = { [K in keyof URL]: URL[K] extends string ? K : never }[keyof URL];

/**
 * Validates a URL and extracts a subset of its properties.
 *
 * @param url the raw string or URL object to be parsed
 * @param pick the list of string-based URL properties to extract
 */
export function pickUrlComponents<T extends URLStringKeys[]>(url: string | URL, ...pick: T) {
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		return;
	}

	type PickedKey = T[number];
	return pick.reduce(
		(acc, key: PickedKey) => {
			acc[key] = parsed[key];
			return acc;
		},
		{} as { [K in PickedKey]: string },
	);
}

/**
 * Normalizes a raw string into a fully-qualified URL string.
 *
 * @param raw the user-provided string to normalize
 */
export function normalizeUrl(raw: string) {
	let candidate = raw?.trim();
	if (!candidate) return;

	if (!candidate.match(/^[A-Za-z]+:\/\//)) {
		candidate = `https://${candidate.replace(/:\/{1,2}/, '')}`;
	}

	try {
		const url = new URL(candidate);

		if (!candidate.startsWith(url.origin)) return;

		return url.href;
	} catch {
		return;
	}
}

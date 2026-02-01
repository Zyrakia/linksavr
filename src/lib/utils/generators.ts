/**
 * Streams words lazily from a string
 * @param text the raw string to parse
 */
export function* streamWords(text: string) {
	const regex = /\S+/g;
	let match;

	while ((match = regex.exec(text)) !== null) {
		yield {
			word: match[0],
			startIndex: match.index,
		};
	}
}

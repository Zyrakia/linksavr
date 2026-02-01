<script lang="ts">
	import { invalidate } from '$app/navigation';
	import LinkAddEditor from '$lib/components/link-add-editor.svelte';
	import LinkRow from '$lib/components/link-row.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
	} from '$lib/components/ui/input-group/index';
	import { createLinks, pollLinkStatus, simSearchLinks } from '$lib/remotes/links.remote';
	import type { SearchResult } from '$lib/server/services/search-service.js';
	import { PlusIcon, SearchIcon } from '@lucide/svelte';

	const { data } = $props();

	let searchInput = $state('');

	const query = $derived(searchInput.trim());
	const queryWordsArray = $derived(
		query
			.split(' ')
			.map((v) => v.trim().toLowerCase())
			.filter((v) => !!v),
	);
	const queryWords = $derived(new Set(queryWordsArray));

	// svelte-ignore state_referenced_locally
	let links = $state(data.links);
	let searchResults = $state<SearchResult[]>([]);

	let showAddLinksDialog = $state(false);

	$effect(() => void (links = data.links));
	const hasProcessing = $derived(
		links.some((l) => l.status !== 'success' && l.status !== 'failed'),
	);

	$effect(() => {
		if (!hasProcessing) return;

		const interval = setInterval(async () => {
			const ids = links
				.filter((l) => l.status !== 'success' && l.status !== 'failed')
				.map((l) => l.id);

			if (!ids.length) return;

			const updates = await pollLinkStatus({ ids });
			for (const update of updates) {
				const idx = links.findIndex((l) => l.id === update.id);
				if (idx === -1) continue;

				const current = links[idx];
				if (!current) continue;

				links[idx] = { ...current, ...update };
			}
		}, 3_000);

		return () => clearInterval(interval);
	});

	$effect(() => {
		if (!query) {
			searchResults = [];
			return;
		}

		const debounce = setTimeout(async () => {
			searchResults = await simSearchLinks({ query });
		}, 350);

		return () => clearTimeout(debounce);
	});

	let addingLinks = $state(false);
	const addLinks = async (...links: URL[]) => {
		if (addingLinks || !links.length) return;

		addingLinks = true;

		await createLinks({ urls: links.map((v) => v.href) });
		invalidate('change:links');

		addingLinks = false;
	};
</script>

<Dialog bind:open={showAddLinksDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Add Links</DialogTitle>
			<DialogDescription>
				Either use the input, or simply paste from your clipboard.
			</DialogDescription>
		</DialogHeader>

		<LinkAddEditor
			onsubmit={(links) => {
				showAddLinksDialog = false;
				addLinks(...links);
			}}
		/>
	</DialogContent>
</Dialog>

<div class="w-full grid place-items-center">
	<div class="w-full max-w-2xl p-4 flex flex-col gap-3">
		<div class="relative">
			<InputGroup>
				<InputGroupAddon align="inline-start" class="pe-1">
					<SearchIcon class="text-muted-foreground" />
				</InputGroupAddon>

				<InputGroupInput placeholder="Search in your own words" bind:value={searchInput} />
			</InputGroup>
		</div>

		<Card class="max-w-2xl p-4 w-full rounded-md">
			<div class="flex items-center justify-between gap-3 mb-2">
				<h3 class="font-semibold">Saved Links</h3>
				<Button
					disabled={addingLinks}
					variant="outline"
					class="w-max"
					size="sm"
					onclick={() => {
						showAddLinksDialog = true;
					}}
				>
					<PlusIcon class="mr-2 h-4 w-4" />
					Add Link
				</Button>
			</div>

			<div class="divide-y divide-border flex flex-col gap-2">
				{#if searchResults.length}
					{#each searchResults as { link, snippets } (link.id)}
						{@const firstSnippet = snippets[0]}

						<div class="flex flex-col gap-1">
							<LinkRow {link} />

							{#if firstSnippet}
								{@const snippetWords = firstSnippet.split(' ')}

								<blockquote class="ps-5 pb-2 text-gray-500 italic">
									...{' '}

									{#each snippetWords as word, i}
										{@const isQWord = queryWordsArray.some((v) =>
											word.startsWith(v),
										)}

										{#if isQWord}
											<span class="text-orange-400">{word}</span>
										{:else}
											{word}
										{/if}

										{i === snippetWords.length ? '' : ' '}
									{/each}

									{' '}...
								</blockquote>
							{/if}
						</div>
					{/each}
				{:else}
					{#each links as link (link.id)}
						<LinkRow {link} />
					{/each}
				{/if}
			</div>
		</Card>
	</div>
</div>

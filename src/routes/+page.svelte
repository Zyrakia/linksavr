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
	import { createLinks, pollLinkStatus } from '$lib/remotes/links.remote';
	import { PlusIcon, SearchIcon } from '@lucide/svelte';

	const { data } = $props();

	// svelte-ignore state_referenced_locally
	let links = $state(data.links);
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

				<InputGroupInput placeholder="Search in your own words" />
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

			<div class="divide-y divide-border">
				{#each links as link (link.id)}
					<LinkRow {link} />
				{/each}
			</div>
		</Card>
	</div>
</div>

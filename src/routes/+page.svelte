<script lang="ts">
	import { invalidate } from '$app/navigation';
	import LinkAddEditor from '$lib/components/link-add-editor.svelte';
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
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from '$lib/components/ui/table';
	import { createLinks } from '$lib/remotes/links.remote';
	import { ExternalLinkIcon, GlobeIcon, ImageIcon, PlusIcon, SearchIcon } from '@lucide/svelte';

	const { data } = $props();

	const links = $derived(data.links);
	let showAddLinksDialog = $state(false);

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
	<DialogContent class="max-h-96 overflow-hidden">
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
					class="w-max cursor-pointer disabled:cursor-auto"
					size="sm"
					onclick={() => {
						showAddLinksDialog = true;
					}}
				>
					<PlusIcon class="mr-2 h-4 w-4" />
					Add Link
				</Button>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="w-2">
							<ImageIcon size={20} />
						</TableHead>
						<TableHead class="w-full">Link</TableHead>
						<TableHead />
					</TableRow>
				</TableHeader>

				<TableBody>
					{#each links as link (link.id)}
						<TableRow>
							<TableCell>
								{#if link.faviconUrl}
									<img src={link.faviconUrl} alt="" class="w-5 h-5" />
								{:else}
									<GlobeIcon size={20} />
								{/if}
							</TableCell>
							<TableCell class="w-full">
								<div class="flex gap-4">
									<span>{link.title}</span>
									<span class="text-muted-foreground">{link.status}</span>
								</div>
							</TableCell>
							<TableCell>
								<a
									href={link.href}
									title="Visit Page"
									target="_blank"
									rel="noreferrer"
								>
									<ExternalLinkIcon size={20} />
								</a>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</Card>
	</div>
</div>

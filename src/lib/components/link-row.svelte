<script lang="ts">
	import type { LinkListItem } from '$lib/server/db/types';
	import {
		GlobeIcon,
		ExternalLinkIcon,
		TrashIcon,
		LoaderCircleIcon,
		CircleAlertIcon,
	} from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { deleteLink } from '$lib/remotes/links.remote';
	import { cn } from '$lib/utils/cn';

	let { link }: { link: LinkListItem } = $props();

	const isProcessing = $derived(link.status !== 'success' && link.status !== 'failed');
	const isFailed = $derived(link.status === 'failed');

	const stepLabel = $derived.by(() => {
		switch (link.status) {
			case 'pending_fetch':
				return 'Waiting to fetch';
			case 'fetching':
				return 'Fetching page';
			case 'pending_embed':
				return 'Waiting to embed';
			case 'embedding':
				return 'Generating embedding';
			default:
				return '';
		}
	});

	const failedStep = $derived(link.fetchedAt ? 'Embedding' : 'Fetching');

	const deleteForm = $derived(deleteLink.for(String(link.id)));

	let showErrorDialog = $state(false);
</script>

<div class="flex flex-col">
	<div class="flex items-center gap-3 py-2">
		{#if link.faviconUrl}
			<img src={link.faviconUrl} alt="" class="size-5 shrink-0 rounded-sm" />
		{:else}
			<GlobeIcon
				class={cn('shrink-0 text-muted-foreground', isProcessing && 'animate-pulse text-teal-400')}
				size={18}
			/>
		{/if}

		<a
			href={link.href}
			target="_blank"
			rel="noreferrer"
			class="truncate font-medium hover:underline"
		>
			{link.title}
		</a>

		<div class="flex-1"></div>

		{#if isFailed}
			<Button
				variant="ghost"
				size="sm"
				class="shrink-0 text-destructive hover:text-destructive"
				onclick={() => (showErrorDialog = true)}
			>
				<CircleAlertIcon size={16} />
				View Error
			</Button>
		{/if}

		<form {...deleteForm} class="shrink-0">
			<input type="hidden" name="id" value={String(link.id)} />
			<Button
				type="submit"
				variant="ghost"
				size="icon-sm"
				disabled={!!deleteForm.pending}
			>
				<TrashIcon size={16} />
				<span class="sr-only">Delete</span>
			</Button>
		</form>

		<Button
			variant="ghost"
			size="icon-sm"
			href={link.href}
			target="_blank"
			rel="noreferrer"
			class="shrink-0"
		>
			<ExternalLinkIcon size={16} />
			<span class="sr-only">Visit</span>
		</Button>
	</div>

	{#if isProcessing}
		<div
			class="ml-[8px] border-l-2 border-muted pl-5 pb-2 flex items-center gap-2 text-sm text-muted-foreground"
		>
			<LoaderCircleIcon size={14} class="animate-spin" />
			<span>{stepLabel}</span>
		</div>
	{/if}
</div>

<Dialog bind:open={showErrorDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Link Error</DialogTitle>
			<DialogDescription>
				Failed during the <strong>{failedStep}</strong> step.
			</DialogDescription>
		</DialogHeader>
		<pre
			class="text-sm bg-muted rounded-md p-3 whitespace-pre-wrap break-words"
		>{link.statusText || 'No error details available.'}</pre>
	</DialogContent>
</Dialog>

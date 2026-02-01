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
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
	} from '$lib/components/ui/alert-dialog';
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

	const deleteForm = $derived(deleteLink.for(String(link.id)));

	let showErrorDialog = $state(false);
	let showDeleteDialog = $state(false);
</script>

<div class="flex flex-col">
	<div class="flex items-center gap-3">
		{#if link.faviconUrl}
			<img src={link.faviconUrl} alt="" class="size-5 shrink-0 rounded-sm" />
		{:else}
			<GlobeIcon
				class={cn(
					'shrink-0 text-muted-foreground',
					isProcessing && 'animate-pulse text-teal-400',
				)}
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

		<Button
			variant="ghost"
			size="icon-sm"
			class="shrink-0"
			onclick={() => (showDeleteDialog = true)}
		>
			<TrashIcon size={16} />
			<span class="sr-only">Delete</span>
		</Button>

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
			class="ml-2 border-l-2 border-muted pl-5 pb-2 flex items-center gap-2 text-sm text-muted-foreground"
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
		</DialogHeader>
		<pre
			class="text-sm bg-muted rounded-md p-3 whitespace-pre-wrap wrap-break-word">{link.statusText ||
				'No error details available.'}</pre>
	</DialogContent>
</Dialog>

<AlertDialog bind:open={showDeleteDialog}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>Delete link?</AlertDialogTitle>
			<AlertDialogDescription>
				Are you sure you want to delete "{link.title}"? This action cannot be undone.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel>Cancel</AlertDialogCancel>
			<form {...deleteForm}>
				<input type="hidden" name="id" value={String(link.id)} />
				<AlertDialogAction type="submit" disabled={!!deleteForm.pending}>
					Delete
				</AlertDialogAction>
			</form>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>

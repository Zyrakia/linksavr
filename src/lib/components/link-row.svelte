<script lang="ts">
	import type { LinkListItem } from '$lib/server/db/types';
	import { GlobeIcon, ExternalLinkIcon } from '@lucide/svelte';
	import { TableRow, TableCell } from './ui/table/index';
	import {Button} from '$lib/components/ui/button'
	import { cn } from '$lib/utils/cn';

	export const { link }: { link: LinkListItem } = $props();

	const isLoading = $derived(link.status !== 'success' && link.status !== 'failed');
</script>

<TableRow>
	<TableCell>
		{#if link.faviconUrl}
			<img src={link.faviconUrl} alt="" class="w-5 h-5" />
		{:else}
			<GlobeIcon class={cn(isLoading && 'animate-pulse text-teal-300')} size={18} />
		{/if}
	</TableCell>

	<TableCell title={link.statusText} class="grid grid-cols-[auto_1fr] gap-2">
		<span class="font-bold">{link.title}</span>

		<Button
			class="font-light {link.status !== 'failed'
				? 'text-destructive'
				: 'text-gray-400'}"
		>
			{#if !isLoading}{:else if link.status !== 'failed'}
				View Error
			{/if}
		</Button>
	</TableCell>

	<TableCell>
		<a href={link.href} title="Visit Page" target="_blank" rel="noreferrer">
			<ExternalLinkIcon size={20} />
		</a>
	</TableCell>
</TableRow>

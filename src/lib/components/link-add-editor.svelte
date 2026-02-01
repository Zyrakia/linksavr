<script lang="ts">
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupButton,
		InputGroupInput,
	} from '$lib/components/ui/input-group/index';
	import { normalizeUrl } from '$lib/utils/url';
	import { GlobeIcon, Link2Icon, XIcon } from '@lucide/svelte';
	import { Button } from './ui/button/index';
	import { cn } from '$lib/utils/cn';
	import { fly } from 'svelte/transition';

	let { onsubmit, maxUrls = 100 }: { onsubmit?: (urls: URL[]) => void; maxUrls?: number } =
		$props();

	let input = $state('');
	let inputFocused = $state(false);

	const detectedUrl = $derived(normalizeUrl(input));

	const urls: URL[] = $state([]);
	const maxUrlsReached = $derived(urls.length >= maxUrls);

	const highlights: { url: URL; type: 'error' | 'success' }[] = $state([]);
	const highlight = (url: URL, type: 'error' | 'success') => {
		const entry = { url, type };
		highlights.push(entry);
		setTimeout(() => highlights.splice(highlights.indexOf(entry), 1), 1000);
	};

	const pushUrl = (url?: URL) => {
		if (!url) return;
		if (maxUrlsReached) return;

		const duplicate = urls.find((v) => v.href === url.href);
		if (duplicate) {
			highlight(duplicate, 'error');
			return;
		}

		urls.push(url);
		highlight(url, 'success');

		input = '';
	};

	const removeUrl = (index: number) => {
		urls.splice(index, 1);
	};

	const handlePaste = (ev: ClipboardEvent) => {
		if (inputFocused) return;

		const text = ev.clipboardData?.getData('text/plain');
		if (!text) return;

		const url = normalizeUrl(text);
		if (!url) return;

		ev.preventDefault();
		pushUrl(url);
	};

	const handleInputKeyDown = (ev: KeyboardEvent) => {
		if (ev.key === 'Enter') pushUrl(detectedUrl);
	};

	const submit = () => {
		onsubmit?.(urls);
		urls.splice(0, urls.length);
	};
</script>

<svelte:window onpaste={handlePaste} />

<div class="flex flex-col minmax-h-full gap-4">
	<InputGroup>
		<InputGroupAddon align="inline-start">
			<Link2Icon />
		</InputGroupAddon>

		<InputGroupInput
			disabled={maxUrlsReached}
			type="text"
			placeholder="Enter URL here"
			bind:value={input}
			onfocus={() => (inputFocused = true)}
			onblur={() => (inputFocused = false)}
			onkeydown={handleInputKeyDown}
		/>

		<InputGroupButton
			disabled={!detectedUrl}
			variant="outline"
			class="me-2 cursor-pointer disabled:cursor-auto"
			onclick={() => pushUrl(detectedUrl)}
		>
			Add
		</InputGroupButton>
	</InputGroup>

	{#if urls.length}
		<ul>
			{#each urls as url, i (url.href)}
				{@const highlight = highlights.filter((v) => v.url === url)[0]}

				<li
					class="grid grid-cols-[auto_1fr_auto] items-center gap-2"
					transition:fly={{ x: -10, duration: 100 }}
				>
					<GlobeIcon
						size={18}
						class={cn(
							'transition-colors',
							'duration-500',
							highlight &&
								(highlight.type === 'error'
									? 'text-destructive'
									: 'text-green-500'),
						)}
					/>

					<p class="flex min-w-0 gap-1">
						<span class="truncate text-amber-300 max-w-4/5">{url.hostname}</span>
						<span class="truncate text-gray-400 italic flex-1"
							>{url.pathname + url.search}</span
						>
					</p>

					<Button
						variant="ghost"
						class="ms-auto cursor-pointer"
						onclick={() => removeUrl(i)}
					>
						<XIcon class="text-destructive" />
					</Button>
				</li>
			{/each}
		</ul>

		{#if maxUrlsReached}
			<p class="border border-dashed p-3 text-center border-destructive bg-destructive/5">
				You can only add {maxUrls} links at a time.
			</p>
		{/if}
	{:else}
		<p class="border border-dashed p-4 text-center border-white bg-white/5">
			Paste a link or enter it above to start adding.
		</p>
	{/if}

	{#if urls.length !== 0}
		<Button class="w-full cursor-pointer disabled:cursor-auto" onclick={() => submit()}
			>Submit</Button
		>
	{/if}
</div>

import z from 'zod';

export const LinkStatusValues = [
	'pending_fetch',
	'fetching',
	'pending_embed',
	'embedding',
	'success',
	'failed',
] as const;

export const LinkFormSchema = z.object({
	href: z.url('URL is required').trim().max(1024, 'Maximum 1024 characters'),
	title: z
		.string('Title is required')
		.trim()
		.min(1, 'Title is required')
		.max(255, 'Maximum 255 characters'),
	faviconUrl: z.url('Must be a URL').trim().max(255, 'Maximum 255 characters').optional(),
	imgUrl: z.url('Must be a URL').trim().max(255, 'Maximum 255 characters').optional(),
	content: z.string().optional(),
	contentHash: z.string().optional(),
	status: z.enum(LinkStatusValues).default('pending_fetch'),
	statusText: z.string().min(1, 'Minimum 1 character').max(255, 'Maximum 255 characters'),
	retryCount: z.number().nonnegative('Retry count must be positive').default(0),
	maxRetries: z.number().positive('Max retries must be positive').default(3),
	embeddedAt: z.number().nonnegative('Timestamp must be positive').optional(),
	fetchedAt: z.number().nonnegative('Timestamp must be positive').optional(),
});

export type LinkFormData = z.infer<typeof LinkFormSchema>;
export type LinkStatus = (typeof LinkStatusValues)[number];

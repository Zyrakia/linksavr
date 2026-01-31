CREATE TABLE `links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`href` text NOT NULL,
	`title` text NOT NULL,
	`favicon_url` text,
	`img_url` text,
	`embedding` F32_BLOB(1024),
	`content` text,
	`content_hash` text,
	`status` text DEFAULT 'pending_fetch' NOT NULL,
	`status_text` text,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`max_retries` integer DEFAULT 3 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`embedded_at` integer,
	`fetched_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `links_href_unique` ON `links` (`href`);--> statement-breakpoint
CREATE INDEX `link_embedding_vector_idx` ON `links` (libsql_vector_idx("embedding"));--> statement-breakpoint
CREATE INDEX `link_hash_idx` ON `links` (`content_hash`);--> statement-breakpoint
CREATE INDEX `link_title_idx` ON `links` (`title`);--> statement-breakpoint
CREATE INDEX `link_status_idx` ON `links` (`status`,`retry_count`,`created_at`);
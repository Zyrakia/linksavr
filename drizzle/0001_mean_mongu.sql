CREATE TABLE `link_embedding_chunks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`link_id` integer NOT NULL,
	`chunk_index` integer NOT NULL,
	`content` text NOT NULL,
	`embedding` F32_BLOB(1024) NOT NULL,
	FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `chunk_embedding_vector_idx` ON `link_embedding_chunks` (libsql_vector_idx("embedding"));--> statement-breakpoint
CREATE INDEX `chunk_link_id_idx` ON `link_embedding_chunks` (`link_id`);--> statement-breakpoint
DROP INDEX `link_embedding_vector_idx`;--> statement-breakpoint
ALTER TABLE `links` DROP COLUMN `embedding`;
CREATE TABLE `shared_views` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`created_by` text NOT NULL,
	`kind` text NOT NULL,
	`snapshot` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shared_views_token_hash_unique` ON `shared_views` (`token_hash`);
CREATE TABLE `login_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`email` text,
	`username` text NOT NULL,
	`action` text NOT NULL,
	`outcome` text NOT NULL,
	`reason` text NOT NULL,
	`ip_address` text,
	`occurred_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `login_events_occurred_at_idx` ON `login_events` (`occurred_at`);
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name_key` text NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_name_key_unique` ON `customers` (`name_key`);
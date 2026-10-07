CREATE TABLE `invitations` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`created_by` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_username_unique` ON `accounts` (`username`);
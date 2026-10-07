CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`resource_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`extracted_text` text NOT NULL,
	`extraction` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `attachments_scope_resource_idx` ON `attachments` (`scope`,`resource_id`);--> statement-breakpoint
CREATE TABLE `project_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`author` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `messages_project_time_idx` ON `project_messages` (`project_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `status_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`author` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `updates_user_time_idx` ON `status_updates` (`user_id`,`created_at`);
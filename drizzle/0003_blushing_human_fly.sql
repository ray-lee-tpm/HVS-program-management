CREATE TABLE `task_notes` (
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`content` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `kind`)
);

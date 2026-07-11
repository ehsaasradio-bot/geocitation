CREATE TABLE `prompt_observations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_key` text NOT NULL,
	`report_id` text NOT NULL,
	`platform` text NOT NULL,
	`prompt_key` text NOT NULL,
	`prompt_text` text NOT NULL,
	`result_state` text NOT NULL,
	`source_url` text,
	`notes` text,
	`observed_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prompt_observations_owner_test_idx` ON `prompt_observations` (`owner_key`,`report_id`,`platform`,`prompt_key`);--> statement-breakpoint
CREATE INDEX `prompt_observations_report_idx` ON `prompt_observations` (`owner_key`,`report_id`,`updated_at`);
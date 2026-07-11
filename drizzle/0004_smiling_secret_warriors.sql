CREATE TABLE `automated_prompt_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_key` text NOT NULL,
	`report_id` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`prompt_key` text NOT NULL,
	`prompt_text` text NOT NULL,
	`answer_text` text NOT NULL,
	`citations_json` text NOT NULL,
	`target_cited` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `automated_prompt_runs_owner_created_idx` ON `automated_prompt_runs` (`owner_key`,`created_at`);--> statement-breakpoint
CREATE INDEX `automated_prompt_runs_report_idx` ON `automated_prompt_runs` (`owner_key`,`report_id`,`created_at`);
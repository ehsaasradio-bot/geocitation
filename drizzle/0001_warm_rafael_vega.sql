CREATE TABLE `saved_audits` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_key` text NOT NULL,
	`domain` text NOT NULL,
	`target` text NOT NULL,
	`score` integer NOT NULL,
	`grade` text NOT NULL,
	`scanned_at` text NOT NULL,
	`created_at` integer NOT NULL,
	`result_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `saved_audits_owner_created_idx` ON `saved_audits` (`owner_key`,`created_at`);--> statement-breakpoint
CREATE INDEX `saved_audits_owner_domain_idx` ON `saved_audits` (`owner_key`,`domain`);
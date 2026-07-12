CREATE TABLE `project_inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`website` text NOT NULL,
	`market` text NOT NULL,
	`services` text NOT NULL,
	`notes` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `project_inquiries_created_idx` ON `project_inquiries` (`created_at`);--> statement-breakpoint
CREATE INDEX `project_inquiries_status_created_idx` ON `project_inquiries` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `project_inquiries_email_created_idx` ON `project_inquiries` (`email`,`created_at`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sandbox_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_key` text NOT NULL,
	`reference` text NOT NULL,
	`plan` text NOT NULL,
	`report_id` text,
	`entitlement_key` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`status` text DEFAULT 'created' NOT NULL,
	`status_detail` text DEFAULT 'Awaiting sandbox confirmation.' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`fulfilled_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_sandbox_orders`("id", "owner_key", "reference", "plan", "report_id", "entitlement_key", "amount_cents", "currency", "status", "status_detail", "created_at", "updated_at", "fulfilled_at") SELECT "id", "owner_key", "reference", "plan", "report_id", "entitlement_key", "amount_cents", "currency", "status", "status_detail", "created_at", "updated_at", "fulfilled_at" FROM `sandbox_orders`;--> statement-breakpoint
DROP TABLE `sandbox_orders`;--> statement-breakpoint
ALTER TABLE `__new_sandbox_orders` RENAME TO `sandbox_orders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `sandbox_orders_owner_created_idx` ON `sandbox_orders` (`owner_key`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `sandbox_orders_reference_idx` ON `sandbox_orders` (`reference`);
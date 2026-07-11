CREATE TABLE `sandbox_entitlements` (
	`owner_key` text PRIMARY KEY NOT NULL,
	`full_audit` integer DEFAULT false NOT NULL,
	`consultation` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sandbox_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_key` text NOT NULL,
	`plan` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`status` text DEFAULT 'test_paid' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sandbox_orders_owner_created_idx` ON `sandbox_orders` (`owner_key`,`created_at`);
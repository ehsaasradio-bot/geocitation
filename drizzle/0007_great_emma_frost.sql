ALTER TABLE `project_inquiries` ADD `owner_key` text;--> statement-breakpoint
ALTER TABLE `project_inquiries` ADD `order_id` text;--> statement-breakpoint
CREATE INDEX `project_inquiries_owner_created_idx` ON `project_inquiries` (`owner_key`,`created_at`);--> statement-breakpoint
CREATE INDEX `project_inquiries_order_created_idx` ON `project_inquiries` (`order_id`,`created_at`);